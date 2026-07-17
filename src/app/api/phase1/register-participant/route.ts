import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';

/**
 * Phase 1: 参加登録
 */
export async function POST(req: NextRequest) {
  try {
    const { lottery_id, line_user_id, line_display_name } = await req.json();
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

    // フェーズチェック
    if (lottery.phase !== 'registration') {
      return NextResponse.json(
        { error: 'Registration is closed' },
        { status: 400 }
      );
    }

    // 締切チェック
    if (new Date() > new Date(lottery.registration_deadline)) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }

    // 参加人数チェック
    const { count, error: countError } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('lottery_id', lottery_id);

    if (count! >= lottery.max_participants) {
      return NextResponse.json(
        { error: 'Participant limit reached' },
        { status: 400 }
      );
    }

    // 既に参加しているかチェック
    const { data: existing } = await supabase
      .from('participants')
      .select('*')
      .eq('lottery_id', lottery_id)
      .eq('line_user_id', line_user_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already registered' },
        { status: 400 }
      );
    }

    // 参加者を登録
    const { data: participant, error: insertError } = await supabase
      .from('participants')
      .insert({
        lottery_id,
        line_user_id,
        line_display_name,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        status: 'registered',
        participant,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in register-participant:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
