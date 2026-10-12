import { randomInt } from 'node:crypto';
import type { AccountRole } from '../modules/auth/auth.repository';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PREFIX: Record<AccountRole, string> = { USER: 'KH', PARTNER: 'NCC', ADMIN: 'AD' };

export function generatePublicId(role: AccountRole, now = new Date()): string {
  const year = String(now.getUTCFullYear()).slice(-2);
  const suffix = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `${PREFIX[role]}-${year}-${suffix}`;
}
