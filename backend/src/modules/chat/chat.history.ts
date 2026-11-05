import { getPool, sql } from "../../config/db";
import { guests, ChatSessionError } from "./chat.sessions";
import { readAdvisorTurn } from "./chat.advisor-state";
import type {
  SendMessageInput,
  ChatMessageDto,
  ChatSessionSummary,
  ChatTravelPlan,
} from "./chat.types";

type Identity = Pick<SendMessageInput, "userId" | "guestId">;
export async function listConversations(
  owner: Identity,
): Promise<ChatSessionSummary[]> {
  if (!owner.userId) return owner.guestId ? guests.list(owner.guestId) : [];
  const result = await getPool()
    .request()
    .input("userId", sql.Int, owner.userId).query<{
    id: number;
    title: string;
    updatedAt: Date;
  }>(`
    SELECT TOP (50) s.session_id AS id, LEFT(first_message.content,80) AS title, last_message.created_at AS updatedAt
    FROM dbo.chat_sessions s
    CROSS APPLY (SELECT TOP(1) content FROM dbo.chat_messages WHERE session_id=s.session_id AND sender='USER' ORDER BY message_id) first_message
    CROSS APPLY (SELECT TOP(1) created_at FROM dbo.chat_messages WHERE session_id=s.session_id ORDER BY message_id DESC) last_message
    WHERE s.user_id=@userId ORDER BY last_message.created_at DESC,s.session_id DESC`);
  return result.recordset.map((r) => ({
    ...r,
    updatedAt: new Date(r.updatedAt).toISOString(),
  }));
}
export async function conversationMessages(
  id: number,
  owner: Identity,
): Promise<ChatMessageDto[]> {
  if (!owner.userId) {
    if (!owner.guestId) throw new ChatSessionError();
    return guests.messages(id, owner.guestId);
  }
  const request = getPool()
    .request()
    .input("sessionId", sql.Int, id)
    .input("userId", sql.Int, owner.userId);
  const result = await request.query<{
    message_id: string;
    sender: "USER" | "AI";
    content: string;
    created_at: Date;
    dto_json: string | null;
  }>(`
    SELECT * FROM (SELECT TOP(200) m.message_id,m.sender,m.content,m.created_at,m.dto_json
    FROM dbo.chat_messages m JOIN dbo.chat_sessions s ON s.session_id=m.session_id
    WHERE s.session_id=@sessionId AND s.user_id=@userId ORDER BY m.message_id DESC) x ORDER BY message_id`);
  if (!result.recordset.length) throw new ChatSessionError();
  return result.recordset.map((r) => {
    if (r.dto_json) {
      try {
        return JSON.parse(r.dto_json) as ChatMessageDto;
      } catch {}
    }
    return {
      id: `legacy_${r.message_id}`,
      sender: r.sender,
      content: readAdvisorTurn(r.content).content,
      createdAt: new Date(r.created_at).toISOString(),
    };
  });
}
export async function updateMessage(
  id: number,
  owner: Identity,
  message: ChatMessageDto,
  transaction?: sql.Transaction,
) {
  if (!owner.userId) {
    if (!owner.guestId) throw new ChatSessionError();
    guests.update(id, owner.guestId, message);
    return;
  }
  const result = await (
    transaction ? new sql.Request(transaction) : getPool().request()
  )
    .input("sessionId", sql.Int, id)
    .input("userId", sql.Int, owner.userId)
    .input("messageId", sql.NVarChar(100), message.id)
    .input("dto", sql.NVarChar(sql.MAX), JSON.stringify(message)).query(`
    UPDATE m SET dto_json=@dto FROM dbo.chat_messages m JOIN dbo.chat_sessions s ON s.session_id=m.session_id
    WHERE s.session_id=@sessionId AND s.user_id=@userId AND m.sender='AI' AND JSON_VALUE(m.dto_json,'$.id')=@messageId`);
  if (!result.rowsAffected[0]) throw new ChatSessionError();
}
/** All values are the visitor's estimates, never booked services or actual expenditure. */
export function estimatePlan(
  plan: ChatTravelPlan,
  values: { food: number; transport: number; contingencyPercent: number },
): ChatTravelPlan {
  const base = (plan.costs.knownSubtotal ?? 0) + values.food + values.transport;
  const contingencyAllowance = Math.round(
    (base * values.contingencyPercent) / 100,
  );
  return {
    ...plan,
    costs: {
      ...plan.costs,
      foodAllowance: values.food,
      transportAllowance: values.transport,
      contingencyAllowance,
      contingencyPercent: values.contingencyPercent,
      projectedSubtotal: base + contingencyAllowance,
      remaining: plan.budget === null ? null : plan.budget - base - contingencyAllowance,
    },
  };
}
