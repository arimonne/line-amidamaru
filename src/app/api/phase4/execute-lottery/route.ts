import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { calculateFallPath } from '@/lib/amidaAlgorithm';
import { sendGroupMessage, sendUserMessage } from '@/lib/lineClient';

/**
 * Phase 4: 抽選実行 & 結果確定
 */
export async function POST(req: NextRequest) {
  try {
    const { lottery_id } = await req.json();
    const supabase = getSupabaseServerClient();

    // あみだを取得
    const { data: lottery, error: lotteryError } = await supabase
      .from('lotteries')
      .select('*')
      .eq('id', lottery_id)
      .single();

    if (lotteryError || !lottery || !lottery.amida_data) {
      return NextResponse.json({ error: 'Lottery not found' }, { status: 404 });
    }

    // 参加者と景品を取得
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('lottery_id', lottery_id);

    const { data: prizes, error: prizesError } = await supabase
      .from('prizes')
      .select('*')
      .eq('lottery_id', lottery_id);

    if (participantsError || prizesError || !participants || !prizes) {
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      );
    }

    // 景品マップを作成
    const prizeMap = new Map(prizes.map((p) => [p.id, p]));

    // 各参加者の落下パスを計算 & 結果を記録
    const results = [];
    for (const participant of participants) {
      const fallPath = calculateFallPath(participant, lottery.amida_data, prizeMap);

      // 結果をDBに記録
      const { error: insertError } = await supabase.from('results').insert({
        lottery_id: lottery_id,
        participant_id: participant.id,
        prize_id: fallPath.result_prize.id,
        final_column: fallPath.final_column,
        fall_path: fallPath.path,
      });

      if (!insertError) {
        // 参加者を更新
        await supabase
          .from('participants')
          .update({ result_prize_id: fallPath.result_prize.id })
          .eq('id', participant.id);
      }

      results.push(fallPath);
    }

    // あみだのフェーズを「completed」に更新
    await supabase
      .from('lotteries')
      .update({
        phase: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', lottery_id);

    // グループLINEに結果を通知
    let groupMessage = `✨ ${lottery.title} 抽選完了！\n\n【結果】\n`;
    results.forEach((result) => {
      groupMessage += `\n${result.line_user_id}\n→ 🎁 ${result.result_prize.name}\n`;
    });

    try {
      await sendGroupMessage(lottery.group_line_id, groupMessage);
    } catch (e) {
      console.error('Failed to send group message:', e);
    }

    // 個別LINEで各参加者に通知
    for (const result of results) {
      try {
        await sendUserMessage(
          result.line_user_id,
          `🎉 ${lottery.title}\n\nあなたの結果:\n🎁 ${result.result_prize.name}\n\nおめでとうございました！`
        );
      } catch (e) {
        console.error(`Failed to send result to ${result.line_user_id}:`, e);
      }
    }

    return NextResponse.json(
      {
        status: 'success',
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in execute-lottery:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
