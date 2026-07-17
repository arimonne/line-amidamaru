import { Client, middleware, MiddlewareConfig } from '@line/bot-sdk';

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const channelSecret = process.env.LINE_CHANNEL_SECRET!;

if (!channelAccessToken || !channelSecret) {
  throw new Error('Missing LINE environment variables');
}

export const lineClient = new Client({
  channelAccessToken,
  channelSecret,
});

/**
 * グループLINEに通知を送信
 */
export async function sendGroupMessage(
  groupId: string,
  message: string,
  quickReply?: any
) {
  return lineClient.pushMessage(groupId, {
    type: 'text',
    text: message,
    quickReply,
  });
}

/**
 * 個別LINEに通知を送信
 */
export async function sendUserMessage(
  userId: string,
  message: string,
  quickReply?: any
) {
  return lineClient.pushMessage(userId, {
    type: 'text',
    text: message,
    quickReply,
  });
}

/**
 * Flex Message で複雑な UI を送信
 */
export async function sendFlexMessage(userId: string, flexMessage: any) {
  return lineClient.pushMessage(userId, flexMessage);
}
