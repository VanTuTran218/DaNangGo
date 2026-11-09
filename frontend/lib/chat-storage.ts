export function chatStorageKeys(userId?: string | null) {
  const owner = userId ? `user:${userId}` : 'guest';
  return { historyKey: `dananggo_chat_v3:${owner}:history`, sessionKey: `dananggo_chat_v3:${owner}:session` };
}
