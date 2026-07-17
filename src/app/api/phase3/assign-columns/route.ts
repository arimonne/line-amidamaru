import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { assignColumnsRandomly } from '@/lib/amidaAlgorithm';
import { sendUserMessage } from '@/lib/lineClient';

/**
 * Phase 3: スタート位置をランダム割当
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

    if (lotteryError || !lottery) {
      return NextResponse.json({ error: 'Lottery not found' }, { status: 404 });
    }

    if (lottery.phase !== 'amida_generated') {
      return NextResponse.json(
        { error: 'Lottery is not in amida_generated phase' },
        { status: 400 }
      );
    }

    // 参加者を取得
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('lottery_id', lottery_id)
      .order('created_at', { ascending: true });

    if (participantsError || !participants) {
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      );
    }

    // 列番号をランダムに割り当て
    const seed = `${lottery_id}-phase3-${Date.now()}`;
    const assignedColumns = assignColumnsRandomly(participants.length, seed);

    // 各参加者を更新
    for (let i = 0; i < participants.length; i++) {
      await supabase
        .from('participants')
        .update({ assigned_column: assignedColumns[i] })
        .eq('id', participants[i].id);
    }

    // 各参加者に個別LINEで通知
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const assignedColumn = assignedColumns[i];
      try {
        await sendUserMessage(
          participant.line_user_id,
          `🎲 ${lottery.title}\n\nあなたのスタート位置: 第${assignedColumn + 1}列\n\nLIFFで抽選を開始してください！`
        );
      } catch (e) {
        console.error(`Failed to send message to ${participant.line_user_id}:`, e);
      }
    }

    return NextResponse.json(
      {
        status: 'success',
        message: 'Columns assigned and notifications sent',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in assign-columns:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
