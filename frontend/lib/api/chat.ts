import type { ChatLocation, SendMessageResponse } from "@/types/chat";
import {
  readChatStream,
  ChatRequestError,
  type ChatProgress,
} from "../chat-stream";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function sendChatMessage(
  message: string,
  sessionId?: number | null,
  options: {
    signal?: AbortSignal;
    location?: ChatLocation;
    onProgress?: (event: ChatProgress) => void;
  } = {},
): Promise<SendMessageResponse> {
  const timeout = AbortSignal.timeout(45_000);
  const res = await fetch(`${API_BASE_URL}/api/chat/message?stream=1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    credentials: "include",
    body: JSON.stringify({ message, sessionId, location: options.location }),
    signal: options.signal
      ? AbortSignal.any([options.signal, timeout])
      : timeout,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new ChatRequestError(
      error.error ||
        error.message ||
        "Không thể kết nối trợ lý. Bạn vui lòng thử lại.",
      error.code,
    );
  }
  if (
    res.headers.get("Content-Type")?.includes("text/event-stream") &&
    res.body
  )
    return readChatStream(res.body, options.onProgress);
  return res.json();
}

export async function chatRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/chat${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    signal: options?.signal ?? AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error ?? "Không thể xử lý yêu cầu. Bạn thử lại nhé.");
  return data as T;
}
