import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/auth.middleware';

const authenticate = requireAuth('USER');
export const chatIdentity: RequestHandler = (req, res, next) => {
  const cookies = req.cookies ?? {};
  if (req.headers.authorization || cookies.access_token || cookies.refresh_token || cookies.admin_access || cookies.admin_refresh) {
    return authenticate(req, res, next);
  }
  const existing = cookies.dananggo_chat_guest;
  const guestId = typeof existing === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(existing) ? existing : randomUUID();
  res.locals.chatGuestId = guestId;
  res.cookie('dananggo_chat_guest', guestId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/chat', maxAge: 60 * 60_000 });
  next();
};

export function createChatRateLimit(limit = 20) {
  return rateLimit({ windowMs: 60_000, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Bạn gửi tin quá nhanh. Vui lòng chờ một phút rồi thử lại.', code: 'CHAT_RATE_LIMITED' } });
}

const running = new Set<string>();
export function acquireChatSlot(owner: string): (() => void) | null {
  if (running.has(owner) || running.size >= 50) return null;
  running.add(owner);
  return () => { running.delete(owner); };
}
