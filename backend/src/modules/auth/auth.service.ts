import { createHash, createHmac, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import {
  changePassword as changePasswordRecord,
  createAccount,
  createPasswordResetToken,
  findAccountByIdentifier,
  findAccountByResetTokenHash,
  findAccountByUserId,
  findResetAccountByEmail,
  findRoleId,
  insertRefreshToken,
  mapRoleName,
  publicIdExists,
  recordFailedLogin,
  resetLoginStateAndRecordSuccess,
  resetPasswordByTokenHash,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  unlockExpiredAccount,
  type AccountRole,
  type AuthAccountRecord,
} from './auth.repository';
import { AuthError } from './auth.errors';
import { generatePublicId } from '../../utils/id';

const REFRESH_SHORT_DAYS = 7;
const REFRESH_LONG_DAYS = 30;
const DUMMY_HASH = bcrypt.hash('dummy-password-for-timing', 12);

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone?: string | undefined;
  role: AccountRole;
  createdAt: string;
  approvalStatus?: string;
}

export interface ClientMetadata {
  userAgent: string | null;
  ip: string | null;
}

export interface IssuedSession {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
}

function toPublicUser(account: AuthAccountRecord): PublicUser {
  const user: PublicUser = {
    id: account.public_id,
    name: account.full_name,
    email: account.email,
    role: mapRoleName(account.role_name),
    createdAt: account.created_at.toISOString(),
  };
  if (account.phone) user.phone = account.phone;
  if (account.approval_status) user.approvalStatus = account.approval_status;
  return user;
}

function normalizePhone(value: string): string {
  let digits = value.trim().replace(/[\s().-]/g, '');
  if (digits.startsWith('+84')) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith('84') && digits.length === 11) digits = `0${digits.slice(2)}`;
  if (!/^0\d{9}$/.test(digits)) {
    throw new AuthError(400, 'Số điện thoại Việt Nam không hợp lệ.');
  }
  return digits;
}

function normalizeIdentifier(value: string): string {
  const identifier = value.trim();
  if (identifier.includes('@')) return identifier.toLowerCase();
  return normalizePhone(identifier);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hashRefreshToken(value: string): string {
  return createHmac('sha256', authSecret('JWT_REFRESH_SECRET')).update(value).digest('hex');
}

function authSecret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const secret = process.env[name];
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new AuthError(500, 'Máy chủ chưa được cấu hình khóa phiên an toàn.');
  }
  return secret;
}

function createAccessToken(account: AuthAccountRecord, sessionType: 'USER' | 'ADMIN'): string {
  return jwt.sign(
    { role: mapRoleName(account.role_name), publicId: account.public_id, sessionType },
    authSecret('JWT_ACCESS_SECRET'),
    { subject: String(account.user_id), expiresIn: '15m' },
  );
}

function createRefreshToken(rememberMe: boolean): string {
  const prefix = rememberMe ? 'r' : 's';
  return `${prefix}.${randomBytes(48).toString('base64url')}`;
}

function refreshExpiry(rememberMe: boolean): Date {
  const days = rememberMe ? REFRESH_LONG_DAYS : REFRESH_SHORT_DAYS;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function storeRefreshToken(
  account: AuthAccountRecord,
  refreshToken: string,
  rememberMe: boolean,
  metadata: ClientMetadata,
): Promise<void> {
  await insertRefreshToken({
    userId: account.user_id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: refreshExpiry(rememberMe),
    userAgent: metadata.userAgent?.slice(0, 255) ?? null,
    ip: metadata.ip?.slice(0, 45) ?? null,
  });
}

async function issueSession(
  account: AuthAccountRecord,
  rememberMe: boolean,
  sessionType: 'USER' | 'ADMIN',
  metadata: ClientMetadata,
): Promise<IssuedSession> {
  const refreshToken = createRefreshToken(rememberMe);
  await storeRefreshToken(account, refreshToken, rememberMe, metadata);
  return {
    user: toPublicUser(account),
    accessToken: createAccessToken(account, sessionType),
    refreshToken,
    rememberMe,
  };
}

async function comparePassword(password: string, passwordHash?: string): Promise<boolean> {
  const hash = passwordHash ?? await DUMMY_HASH;
  const matches = await bcrypt.compare(password, hash);
  return Boolean(passwordHash) && matches;
}

export async function register(input: {
  role: string;
  name: string;
  email: string;
  phone?: string | undefined;
  password: string;
  partner?: {
    businessName: string;
    serviceType: 'STAY' | 'TABLE' | 'TICKET';
    taxCode?: string | undefined;
    address?: string | undefined;
  } | undefined;
  rememberMe?: boolean | undefined;
}, metadata: ClientMetadata): Promise<IssuedSession> {
  if (input.role === 'ADMIN') throw new AuthError(403, 'Không thể đăng ký tài khoản quản trị.');
  if (input.role !== 'USER' && input.role !== 'PARTNER') throw new AuthError(400, 'Vai trò tài khoản không hợp lệ.');
  if (input.role === 'PARTNER' && !input.partner) throw new AuthError(400, 'Vui lòng nhập thông tin nhà cung cấp.');

  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() ? normalizePhone(input.phone) : null;
  const role = input.role as Exclude<AccountRole, 'ADMIN'>;
  const roleId = await findRoleId(role);
  if (roleId === null) throw new AuthError(500, 'Vai trò tài khoản chưa được cấu hình.');

  const passwordHash = await bcrypt.hash(input.password, 12);
  let publicId = '';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generatePublicId(role);
    if (!(await publicIdExists(candidate))) {
      publicId = candidate;
      break;
    }
  }
  if (!publicId) throw new AuthError(500, 'Không tạo được mã tài khoản. Vui lòng thử lại.');

  try {
    const account = await createAccount({
      publicId,
      roleId,
      role,
      name: input.name.trim(),
      email,
      phone,
      passwordHash,
      ...(input.partner ? {
        partner: {
          businessName: input.partner.businessName.trim(),
          serviceType: input.partner.serviceType,
          taxCode: input.partner.taxCode?.trim() || null,
          address: input.partner.address?.trim() || null,
        },
      } : {}),
    });
    return issueSession(account, input.rememberMe ?? false, 'USER', metadata);
  } catch (error) {
    const dbError = error as { number?: number };
    if (dbError.number === 2601 || dbError.number === 2627) {
      throw new AuthError(409, 'Email hoặc số điện thoại đã được sử dụng.');
    }
    throw error;
  }
}

async function authenticate(
  identifier: string,
  password: string,
  rememberMe: boolean,
  sessionType: 'USER' | 'ADMIN',
  metadata: ClientMetadata,
): Promise<IssuedSession> {
  let normalized: string;
  try {
    normalized = normalizeIdentifier(identifier);
  } catch {
    normalized = identifier.trim().toLowerCase();
  }
  const account = await findAccountByIdentifier(normalized);
  const passwordMatches = await comparePassword(password, account?.password_hash);
  const accountRole = account ? mapRoleName(account.role_name) : null;
  const permitted = sessionType === 'ADMIN' ? accountRole === 'ADMIN' : accountRole === 'USER' || accountRole === 'PARTNER';
  if (!account || !permitted) throw new AuthError(401, 'Sai thông tin đăng nhập.');

  if (account.status === 'LOCKED') {
    if (!account.locked_until || account.locked_until.getTime() > Date.now()) {
      throw new AuthError(423, 'Tài khoản đang bị khóa. Vui lòng thử lại sau.');
    }
    await unlockExpiredAccount(account.user_id);
  }
  if (!passwordMatches) {
    const failedCount = await recordFailedLogin(account.user_id);
    if (failedCount >= 5) throw new AuthError(423, 'Tài khoản đã bị khóa 15 phút do đăng nhập sai quá nhiều lần.');
    throw new AuthError(401, 'Sai thông tin đăng nhập.');
  }
  if (account.status !== 'ACTIVE' && account.status !== 'LOCKED') {
    throw new AuthError(401, 'Tài khoản hiện không thể đăng nhập.');
  }

  await resetLoginStateAndRecordSuccess(account.user_id);
  const freshAccount = await findAccountByUserId(account.user_id);
  if (!freshAccount) throw new AuthError(401, 'Tài khoản không còn khả dụng.');
  return issueSession(freshAccount, rememberMe, sessionType, metadata);
}

export function login(input: { identifier: string; password: string; rememberMe?: boolean | undefined }, metadata: ClientMetadata): Promise<IssuedSession> {
  return authenticate(input.identifier, input.password, input.rememberMe ?? false, 'USER', metadata);
}

export function adminLogin(input: { identifier: string; password: string; rememberMe?: boolean | undefined }, metadata: ClientMetadata): Promise<IssuedSession> {
  return authenticate(input.identifier, input.password, input.rememberMe ?? false, 'ADMIN', metadata);
}

export async function refreshSession(
  rawRefreshToken: string | undefined,
  sessionType: 'USER' | 'ADMIN',
  metadata: ClientMetadata,
): Promise<IssuedSession> {
  if (!rawRefreshToken || !/^[rs]\.[A-Za-z0-9_-]{64}$/.test(rawRefreshToken)) {
    throw new AuthError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
  const rememberMe = rawRefreshToken.startsWith('r.');
  const nextRefreshToken = createRefreshToken(rememberMe);
  const nextHash = hashRefreshToken(nextRefreshToken);
  const account = await rotateRefreshToken({
    oldTokenHash: hashRefreshToken(rawRefreshToken),
    newTokenHash: nextHash,
    expiresAt: refreshExpiry(rememberMe),
    userAgent: metadata.userAgent?.slice(0, 255) ?? null,
    ip: metadata.ip?.slice(0, 45) ?? null,
  });
  if (!account) throw new AuthError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  const role = mapRoleName(account.role_name);
  if ((sessionType === 'ADMIN' && role !== 'ADMIN') || (sessionType === 'USER' && role === 'ADMIN')) {
    await revokeRefreshToken(nextHash);
    throw new AuthError(403, 'Bạn không có quyền sử dụng phiên này.');
  }
  return {
    user: toPublicUser(account),
    accessToken: createAccessToken(account, sessionType),
    refreshToken: nextRefreshToken,
    rememberMe,
  };
}

export async function getCurrentUser(userId: number): Promise<PublicUser> {
  const account = await findAccountByUserId(userId);
  if (!account) throw new AuthError(401, 'Tài khoản không còn khả dụng.');
  return toPublicUser(account);
}

export async function logout(rawRefreshToken?: string): Promise<void> {
  if (rawRefreshToken) await revokeRefreshToken(hashRefreshToken(rawRefreshToken));
}

export function logoutAll(userId: number): Promise<void> {
  return revokeAllRefreshTokens(userId);
}

export async function forgotPassword(emailInput: string): Promise<void> {
  const email = emailInput.trim().toLowerCase();
  const account = await findResetAccountByEmail(email);
  if (!account || !['USER', 'PARTNER'].includes(account.role_name.toUpperCase())) return;

  const rawToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await createPasswordResetToken(account.user_id, sha256(rawToken), expiresAt);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/quen-mat-khau/dat-lai?token=${encodeURIComponent(rawToken)}`;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost && process.env.NODE_ENV === 'development') {
    console.info(`Liên kết đặt lại mật khẩu (15 phút): ${resetLink}`);
    return;
  }
  if (!smtpHost || !process.env.MAIL_FROM) {
    console.error('Không gửi được email đặt lại mật khẩu: thiếu cấu hình SMTP.');
    return;
  }

  try {
    const port = Number(process.env.SMTP_PORT || '587');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: port === 465,
      ...(smtpUser && smtpPass ? { auth: { user: smtpUser, pass: smtpPass } } : {}),
    });
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: account.email,
      subject: 'Đặt lại mật khẩu DaNangGo',
      text: `Xin chào ${account.full_name},\n\nMở liên kết sau để đặt lại mật khẩu (hết hạn sau 15 phút):\n${resetLink}`,
    });
  } catch (error) {
    console.error('Gửi email đặt lại mật khẩu thất bại:', error);
  }
}

export async function resetPassword(input: { token: string; newPassword: string }): Promise<void> {
  const tokenHash = sha256(input.token);
  const account = await findAccountByResetTokenHash(tokenHash);
  if (!account) throw new AuthError(400, 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  const reset = await resetPasswordByTokenHash(tokenHash, passwordHash);
  if (!reset) throw new AuthError(400, 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
}

export async function updatePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
  refreshCookie: string | undefined,
): Promise<void> {
  const account = await findAccountByUserId(userId);
  if (!account || !(await bcrypt.compare(currentPassword, account.password_hash))) {
    throw new AuthError(400, 'Mật khẩu hiện tại không chính xác.');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const currentRefreshHash = refreshCookie ? hashRefreshToken(refreshCookie) : null;
  await changePasswordRecord(userId, passwordHash, currentRefreshHash);
}

export async function verifyAccessToken(token: string, expectedSession: 'USER' | 'ADMIN'): Promise<number> {
  try {
    const payload = jwt.verify(token, authSecret('JWT_ACCESS_SECRET')) as jwt.JwtPayload & {
      sessionType?: string;
    };
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId < 1 || payload.sessionType !== expectedSession) {
      throw new AuthError(401, 'Phiên đăng nhập không hợp lệ.');
    }
    const account = await findAccountByUserId(userId);
    if (!account || account.status !== 'ACTIVE') throw new AuthError(401, 'Phiên đăng nhập không còn hiệu lực.');
    return userId;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
}

export function getAccountRole(userId: number): Promise<AccountRole | null> {
  return findAccountByUserId(userId).then((account) => account ? mapRoleName(account.role_name) : null);
}

