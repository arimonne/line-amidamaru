import { NextRequest, NextResponse } from 'next/server';
import { lineClient } from '@/lib/lineClient';
import crypto from 'crypto';

const channelSecret = process.env.LINE_CHANNEL_SECRET!;

/**
 * LINE Webhookハンドラー
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-line-signature');

    // 署名検証
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');

    if (signature !== hash) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const events = JSON.parse(body).events;

    for (const event of events) {
      console.log('[Webhook] Received event:', event.type);

      if (event.type === 'message') {
        // メッセージイベントを処理
        console.log('[Webhook] Message:', event.message.text);
      } else if (event.type === 'follow') {
        // フォローイベント
        console.log('[Webhook] User followed');
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
