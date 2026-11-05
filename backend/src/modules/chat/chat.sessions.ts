import { randomInt, randomUUID } from "node:crypto";
import {
  createChatSession,
  ownsChatSession,
  getRecentChatMessages,
  saveChatMessage,
} from "./chat.repository";
import type {
  ChatSender,
  SendMessageInput,
  ChatMessageDto,
  ChatSessionSummary,
} from "./chat.types";

type Turn = { sender: ChatSender; content: string };
type GuestSession = {
  owner: string;
  expires: number;
  turns: Turn[];
  messages: ChatMessageDto[];
  updatedAt: string;
  bytes: number;
};

export class ChatSessionError extends Error {
  readonly status = 404;
  readonly code = "CHAT_SESSION_NOT_FOUND";
  constructor() {
    super(
      "Phiên trò chuyện đã hết hạn hoặc không thuộc tài khoản của bạn. Vui lòng tạo cuộc trò chuyện mới.",
    );
  }
}

export class GuestChatSessions {
  private readonly sessions = new Map<number, GuestSession>();
  private bytes = 0;
  private remove(id: number) {
    const session = this.sessions.get(id);
    if (session) this.bytes -= session.bytes;
    this.sessions.delete(id);
  }
  private bound(id: number) {
    const session = this.sessions.get(id)!;
    this.bytes -= session.bytes;
    session.messages = session.messages.slice(-100);
    while (
      session.messages.length > 1 &&
      Buffer.byteLength(JSON.stringify(session.messages)) > 1024 * 1024
    )
      session.messages.shift();
    session.bytes = Buffer.byteLength(JSON.stringify(session.messages));
    this.bytes += session.bytes;
    while (this.bytes > 32 * 1024 * 1024 && this.sessions.size > 1) {
      const oldest = [...this.sessions.keys()].find((key) => key !== id);
      if (oldest == null) break;
      this.remove(oldest);
    }
  }
  constructor(
    private readonly ttl = 60 * 60_000,
    private readonly capacity = 500,
    private readonly now = Date.now,
  ) {}
  open(owner: string, requestedId?: number | null) {
    for (const [id, session] of this.sessions)
      if (session.expires <= this.now()) this.remove(id);
    if (requestedId) {
      const session = this.sessions.get(requestedId);
      if (!session || session.owner !== owner) throw new ChatSessionError();
      session.expires = this.now() + this.ttl;
      return requestedId;
    }
    if (this.sessions.size >= this.capacity)
      this.remove(this.sessions.keys().next().value!);
    let id: number;
    do {
      id = randomInt(1, 2147483647);
    } while (this.sessions.has(id));
    this.sessions.set(id, {
      owner,
      bytes: 0,
      expires: this.now() + this.ttl,
      turns: [],
      messages: [],
      updatedAt: new Date(this.now()).toISOString(),
    });
    return id;
  }
  history(id: number, owner: string) {
    this.open(owner, id);
    return structuredClone(this.sessions.get(id)!.turns);
  }
  save(
    id: number,
    owner: string,
    sender: ChatSender,
    content: string,
    dto?: ChatMessageDto,
  ) {
    this.open(owner, id);
    const session = this.sessions.get(id)!;
    session.turns.push({ sender, content });
    session.turns = session.turns.slice(-12);
    session.updatedAt = new Date(this.now()).toISOString();
    session.messages.push(
      dto ?? {
        id: randomUUID(),
        sender,
        content,
        createdAt: session.updatedAt,
      },
    );
    this.bound(id);
  }
  list(owner: string): ChatSessionSummary[] {
    return [...this.sessions]
      .filter(
        ([, s]) =>
          s.owner === owner && s.expires > this.now() && s.messages.length,
      )
      .map(([id, s]) => ({
        id,
        title:
          s.messages.find((m) => m.sender === "USER")?.content.slice(0, 80) ??
          "Hội thoại",
        updatedAt: s.updatedAt,
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 50);
  }
  messages(id: number, owner: string) {
    this.open(owner, id);
    return structuredClone(this.sessions.get(id)!.messages);
  }
  update(id: number, owner: string, message: ChatMessageDto) {
    this.open(owner, id);
    const s = this.sessions.get(id)!;
    const index = s.messages.findIndex(
      (m) => m.id === message.id && m.sender === "AI",
    );
    if (index < 0) throw new ChatSessionError();
    s.messages[index] = structuredClone(message);
    this.bound(id);
  }
}

export const guests = new GuestChatSessions();

export async function openChatConversation(input: SendMessageInput) {
  if (input.userId) {
    const userId = input.userId;
    if (input.sessionId && !(await ownsChatSession(input.sessionId, userId)))
      throw new ChatSessionError();
    const id = input.sessionId ?? (await createChatSession(userId));
    return {
      id,
      history: () => getRecentChatMessages(id, 12, userId),
      save: (
        sender: ChatSender,
        text: string,
        placeIds?: number[],
        dto?: ChatMessageDto,
      ) => saveChatMessage(id, userId, sender, text, placeIds, dto),
    };
  }
  if (!input.guestId) throw new ChatSessionError();
  const owner = input.guestId;
  const id = guests.open(owner, input.sessionId);
  return {
    id,
    history: async () => guests.history(id, owner).slice(-12),
    save: async (
      sender: ChatSender,
      text: string,
      _placeIds?: number[],
      dto?: ChatMessageDto,
    ) => {
      guests.save(id, owner, sender, text, dto);
    },
  };
}
