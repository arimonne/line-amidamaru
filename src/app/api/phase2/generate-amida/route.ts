import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { generateAmida, assignPrizesToGoals, generateAmidaHash, assignColumnsRandomly } from '@/lib/amidaAlgorithm';
import { sendGroupMessage } from '@/lib/lineClient';

/**
 * Phase 2: 締切を迎えたあみだを自動生成
 * (Cron または手動トリガー)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // 締切を迎えた「registration」フェーズのあみだを取得
    const now = new Date().toISOString();
    const { data: lotteries, error: lotteryError } = await supabase
      .from('lotteries')
      .select('*')
      .eq('phase', 'registration')
      .lte('registration_deadline', now);

    if (lotteryError) {
      return NextResponse.json({ error: lotteryError.message }, { status: 500 });
    }

    const results = [];

    for (const lottery of lotteries || []) {
      // 参加者数を取得
      const { count: participantCount, error: countError } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('lottery_id', lottery.id);

      if (countError || !participantCount) {
        results.push({
          lottery_id: lottery.id,
          status: 'error',
          message: 'Failed to count participants',
        });
        continue;
      }

      // あみだを生成
      const seed = `${lottery.id}-${Date.now()}`;
      let amida = generateAmida(participantCount, seed);

      // 景品を取得してあみだに割り当て
      const { data: prizes, error: prizesError } = await supabase
        .from('prizes')
        .select('*')
        .eq('lottery_id', lottery.id);

      if (prizesError || !prizes) {
        results.push({
          lottery_id: lottery.id,
          status: 'error',
          message: 'Failed to fetch prizes',
        });
        continue;
      }

      amida = assignPrizesToGoals(amida, prizes);

      // ハッシュを生成
      const amidaHash = generateAmidaHash(amida);

      // DB を更新
      const { error: updateError } = await supabase
        .from('lotteries')
        .update({
          phase: 'amida_generated',
          amida_data: amida,
          amida_hash: amidaHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lottery.id);

      if (updateError) {
        results.push({
          lottery_id: lottery.id,
          status: 'error',
          message: updateError.message,
        });
        continue;
      }

      // グループLINEに通知
      try {
        await sendGroupMessage(
          lottery.group_line_id,
          `🎉 ${lottery.title}\n\nあみだが生成されました！\nハッシュ値（公平性確認用）:\n${amidaHash}`
        );
      } catch (e) {
        console.error('Failed to send LINE message:', e);
      }

      results.push({
        lottery_id: lottery.id,
        status: 'success',
        amida_hash: amidaHash,
      });
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error('Error in generate-amida:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
