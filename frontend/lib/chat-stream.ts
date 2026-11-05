import type { ChatPlaceCard, SendMessageResponse } from '../types/chat';

export type ChatProgress = { type: 'status'; text: string } | { type: 'candidates'; places: ChatPlaceCard[] };
export class ChatRequestError extends Error {
  readonly code?: string;
  constructor(message: string, code?: string) { super(message); this.name = 'ChatRequestError'; this.code = code; }
}

/** Đọc SSE qua POST, giữ đúng ranh giới UTF-8 và event dù mạng chia nhỏ gói tin. */
export async function readChatStream(stream: ReadableStream<Uint8Array>, onProgress?: (event: ChatProgress) => void): Promise<SendMessageResponse> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let result: SendMessageResponse | undefined;
  const frame = (text: string) => {
    const data = text.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    if (!data) return;
    const event = JSON.parse(data);
    if (event.type === 'error') throw new ChatRequestError(event.text || 'Không thể nhận phản hồi.', event.code);
    if (event.type === 'result') result = event.result;
    else if (event.type === 'status' || event.type === 'candidates') onProgress?.(event);
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      pending = (pending + (done ? decoder.decode() : decoder.decode(value, { stream: true }))).replace(/\r\n/g, '\n');
      let end: number;
      while ((end = pending.indexOf('\n\n')) !== -1) {
        frame(pending.slice(0, end)); pending = pending.slice(end + 2);
      }
      if (done) break;
    }
    if (pending.trim()) frame(pending);
    if (!result || !Number.isSafeInteger(result.sessionId) || !result.message || typeof result.message.content !== 'string') throw new Error('Phản hồi chưa hoàn tất. Bạn vui lòng thử lại.');
    return result;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
