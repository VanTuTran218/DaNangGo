import { createHash, createHmac, randomBytes, randomInt } from 'node:crypto';
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
  updateAccountAvatar,
  updateAccountProfile,
  resetPasswordByTokenHash,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  unlockExpiredAccount,
  type AccountRole,
  type AuthAccountRecord,
} from './auth.repository';
import {
  deleteVerification,
  findUserIdByEmail,
  findVerificationByUserId,
  incrementAttempts,
  markEmailVerified,
  upsertVerification,
} from './email-verification.repository';
import { AuthError } from './auth.errors';
import { generatePublicId } from '../../utils/id';
import { buildOtpEmail, buildResetPasswordEmail, maskEmail } from '../../utils/emailTemplates';
import type { OtpPurpose } from './email-verification.repository';

const REFRESH_SHORT_DAYS = 7;
const REFRESH_LONG_DAYS = 30;
const DUMMY_HASH = bcrypt.hash('dummy-password-for-timing', 12);
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_SENDS_PER_HOUR = 5;

/** Tạo nodemailer transporter từ biến môi trường (Gmail App Password) */
function createMailTransporter(): ReturnType<typeof nodemailer.createTransport> {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new AuthError(500, 'Máy chủ chưa được cấu hình dịch vụ email.');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/** Tạo OTP 6 số và lưu hash vào DB, gửi email */
async function issueOtp(
  userId: number,
  email: string,
  userName: string,
  purpose: OtpPurpose = 'verify_email',
): Promise<void> {
  // crypto.randomInt: không dùng Math.random — đảm bảo cryptographically secure
  const code = randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, 10); // rounds=10 để hash nhanh hơn (OTP ngắn hạn)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const now = new Date();

  await upsertVerification({ userId, codeHash, expiresAt, now, purpose });

  // Gửi email (nếu development và chưa có MAIL_USER → in ra console)
  console.log('MAIL_USER=', process.env.MAIL_USER);
  console.log('MAIL_APP_PASSWORD=', process.env.MAIL_APP_PASSWORD);
  if (!process.env.MAIL_USER && process.env.NODE_ENV !== 'production') {
    console.info(`[DEV OTP:${purpose}] ${email} → ${code} (hết hạn: ${expiresAt.toISOString()})`);
    return;
  }

  try {
    const fromName = process.env.MAIL_FROM_NAME ?? 'DaNangGo';
    const fromUser = process.env.MAIL_USER!;
    const transporter = createMailTransporter();

    const { subject, html, text } = purpose === 'reset_password'
      ? buildResetPasswordEmail({ userName, otpCode: code, expiryMinutes: OTP_EXPIRY_MINUTES })
      : buildOtpEmail({ userName, email, otpCode: code, expiryMinutes: OTP_EXPIRY_MINUTES });

    await transporter.sendMail({ from: `"${fromName}" <${fromUser}>`, to: email, subject, html, text });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[OTP Mail Error]', err);
    } else {
      console.error('[OTP Mail Error] Failed to send OTP email.');
    }
    throw new AuthError(500, 'Không thể gửi email. Vui lòng thử lại sau.');
  }
}



export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone?: string | undefined;
  birthday?: string;
  avatarUrl?: string;
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
  if (account.date_of_birth) user.birthday = account.date_of_birth;
  if (account.avatar_url) user.avatarUrl = account.avatar_url;
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
}, _metadata: ClientMetadata): Promise<{ email: string; maskedEmail: string }> {
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

    // Gửi OTP xác thực email (email_verified = 0 lúc này)
    await issueOtp(account.user_id, account.email, account.full_name);

    return { email: account.email, maskedEmail: maskEmail(account.email) };
  } catch (error) {
    const dbError = error as { number?: number };
    if (dbError.number === 2601 || dbError.number === 2627) {
      // Email/phone đã tồn tại — kiểm tra xem đã xác thực chưa
      const existingUser = await findUserIdByEmail(email);
      if (existingUser && !existingUser.email_verified) {
        // Chưa xác thực → gửi lại OTP, cho phép tiếp tục luồng xác thực
        await issueOtp(existingUser.user_id, email, existingUser.full_name);
        return { email, maskedEmail: maskEmail(email) };
      }
      // Đã xác thực → báo lỗi với gợi ý đăng nhập
      throw new AuthError(409, 'Email này đã được đăng ký. Bạn muốn đăng nhập?', 'EMAIL_ALREADY_EXISTS');
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

  if (account.status === 'LOCKED') throw new AuthError(403, 'Tài khoản đã bị khóa');
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
  if (account.status === 'PENDING_APPROVAL') {
    throw new AuthError(403, 'Tài khoản đối tác của bạn đang chờ quản trị viên duyệt. Vui lòng đợi email thông báo kết quả.');
  }
  if (account.status !== 'ACTIVE' && account.status !== 'LOCKED') {
    throw new AuthError(401, 'Tài khoản hiện không thể đăng nhập.');
  }

  // Kiểm tra xác thực email (chỉ áp dụng với USER/PARTNER, không áp dụng ADMIN)
  if (sessionType === 'USER' && !account.email_verified) {
    // Gửi lại OTP tự động để người dùng có thể xác thực ngay
    // (không throw nếu gửi mail thất bại — FE sẽ cho bấm "Gửi lại mã")
    try {
      await issueOtp(account.user_id, account.email, account.full_name);
    } catch {
      // Bỏ qua lỗi gửi mail ở đây — FE vẫn sẽ hiện màn xác thực
    }
    const err = new AuthError(403, 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư và nhập mã OTP.');
    // Thêm extra data để FE nhận biết và chuyển sang bước OTP
    (err as AuthError & { code?: string; maskedEmail?: string }).code = 'EMAIL_NOT_VERIFIED';
    (err as AuthError & { code?: string; maskedEmail?: string }).maskedEmail = maskEmail(account.email);
    throw err;
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

export async function updateCurrentUserProfile(userId: number, input: {
  name: string;
  phone: string | null;
  birthday: string | null;
}): Promise<PublicUser> {
  const account = await updateAccountProfile({
    userId,
    name: input.name.trim(),
    phone: input.phone?.trim() ? normalizePhone(input.phone) : null,
    birthday: input.birthday,
  });
  if (!account) throw new AuthError(404, 'KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n.');
  return toPublicUser(account);
}

export async function updateCurrentUserAvatar(userId: number, avatarUrl: string | null): Promise<PublicUser> {
  const account = await updateAccountAvatar(userId, avatarUrl);
  if (!account) throw new AuthError(404, 'KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n.');
  return toPublicUser(account);
}

export async function logout(rawRefreshToken?: string): Promise<void> {
  if (rawRefreshToken) await revokeRefreshToken(hashRefreshToken(rawRefreshToken));
}

export function logoutAll(userId: number): Promise<void> {
  return revokeAllRefreshTokens(userId);
}

/**
 * Giai đoạn 1: Gửi OTP đặt lại mật khẩu.
 * Luôn trả void dù email có tồn tại hay không (không lộ thông tin).
 */
export async function forgotPassword(emailInput: string): Promise<void> {
  const email = emailInput.trim().toLowerCase();
  const account = await findResetAccountByEmail(email);
  // Trả về bình thường dù email không tồn tại — không lộ thông tin
  if (!account || !['USER', 'PARTNER'].includes(account.role_name.toUpperCase())) return;
  // Bỏ qua lỗi gửi mail (đã xử lý bên trong issueOtp) — FE có thể bấm "Gửi lại"
  try {
    await issueOtp(account.user_id, account.email, account.full_name, 'reset_password');
  } catch {
    // Silent fail — phản hồi luôn chung chung
  }
}

/**
 * Giai đoạn 2: Xác thực OTP đặt lại mật khẩu.
 * Trả về userId nếu thành công (để dùng trong bước đặt mật khẩu mới).
 */
export async function verifyResetOtp(emailInput: string, code: string): Promise<number> {
  const email = emailInput.trim().toLowerCase();
  const user = await findUserIdByEmail(email);
  if (!user) throw new AuthError(400, 'Mã xác nhận không hợp lệ hoặc đã hết hạn.');

  const record = await findVerificationByUserId(user.user_id, 'reset_password');
  if (!record) throw new AuthError(400, 'Mã xác nhận không hợp lệ hoặc đã hết hạn.');

  if (record.expires_at.getTime() < Date.now()) {
    await deleteVerification(user.user_id, 'reset_password');
    throw new AuthError(400, 'Mã xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại mã.');
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await deleteVerification(user.user_id, 'reset_password');
    throw new AuthError(429, 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu gửi lại mã mới.');
  }

  const isMatch = await bcrypt.compare(code.trim(), record.code_hash);
  if (!isMatch) {
    const attempts = await incrementAttempts(user.user_id, 'reset_password');
    const remaining = OTP_MAX_ATTEMPTS - attempts;
    if (remaining <= 0) {
      await deleteVerification(user.user_id, 'reset_password');
      throw new AuthError(429, 'Mã xác nhận không đúng. Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.');
    }
    throw new AuthError(400, `Mã xác nhận không đúng. Còn ${remaining} lần thử.`);
  }

  return user.user_id;
}

/**
 * Giai đoạn 3: Đặt mật khẩu mới sau khi đã xác thực OTP.
 * Xóa bản ghi OTP và thu hồi tất cả refresh token cũ.
 */
export async function resetPasswordWithOtp(
  emailInput: string,
  code: string,
  newPassword: string,
): Promise<void> {
  // Xác thực OTP lần nữa (tránh bỏ qua bước verify)
  const userId = await verifyResetOtp(emailInput, code);
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await changePasswordRecord(userId, passwordHash, null); // null = thu hồi TẤT CẢ refresh tokens
  await deleteVerification(userId, 'reset_password');
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
): Promise<void> {
  const account = await findAccountByUserId(userId);
  if (!account || !(await bcrypt.compare(currentPassword, account.password_hash))) {
    throw new AuthError(400, 'Mật khẩu hiện tại không chính xác.');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await changePasswordRecord(userId, passwordHash, null);
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
    if (account?.status === 'LOCKED') throw new AuthError(403, 'Tài khoản đã bị khóa');
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

export async function getAccountAuthDetails(userId: number): Promise<{
  role: AccountRole;
  partnerId?: number | null;
  approvalStatus?: string | null;
} | null> {
  const account = await findAccountByUserId(userId);
  if (!account) return null;
  return {
    role: mapRoleName(account.role_name),
    partnerId: account.partner_id,
    approvalStatus: account.approval_status,
  };
}


/**
 * Xác thực email bằng mã OTP 6 số.
 * - Kiểm tra hết hạn, giới hạn 5 lần sai
 * - Đúng mã: set is_verified = 1, xóa bản ghi OTP
 * - Sai mã: tăng attempts, khóa khi >= OTP_MAX_ATTEMPTS
 */
export async function verifyEmail(email: string, code: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserIdByEmail(normalizedEmail);

  // Trả lỗi chung chung để không lộ thông tin
  if (!user) throw new AuthError(400, 'Mã xác nhận không hợp lệ hoặc đã hết hạn.');
  if (user.email_verified) throw new AuthError(400, 'Email này đã được xác thực.');

  const record = await findVerificationByUserId(user.user_id);
  if (!record) throw new AuthError(400, 'Mã xác nhận không hợp lệ hoặc đã hết hạn.');

  // Kiểm tra hết hạn
  if (record.expires_at.getTime() < Date.now()) {
    await deleteVerification(user.user_id);
    throw new AuthError(400, 'Mã xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại mã.');
  }

  // Kiểm tra số lần sai
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await deleteVerification(user.user_id);
    throw new AuthError(429, 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu gửi lại mã mới.');
  }

  // So sánh mã
  const isMatch = await bcrypt.compare(code.trim(), record.code_hash);
  if (!isMatch) {
    const attempts = await incrementAttempts(user.user_id);
    const remaining = OTP_MAX_ATTEMPTS - attempts;
    if (remaining <= 0) {
      await deleteVerification(user.user_id);
      throw new AuthError(429, 'Mã xác nhận không đúng. Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.');
    }
    throw new AuthError(400, `Mã xác nhận không đúng. Còn ${remaining} lần thử.`);
  }

  // Đúng mã → xác thực thành công
  await markEmailVerified(user.user_id);
}

/**
 * Gửi lại mã OTP:
 * - Rate limit 60 giây giữa các lần gửi
 * - Tối đa 5 lần/giờ
 * - Luôn trả response chung để không lộ email tồn tại
 */
export async function resendCode(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserIdByEmail(normalizedEmail);

  // Không lộ thông tin — trả về bình thường dù email không tồn tại
  if (!user || user.email_verified) return;

  const record = await findVerificationByUserId(user.user_id);
  const now = new Date();

  // Kiểm tra cooldown 60 giây
  if (record) {
    const secondsSinceLastSent = (now.getTime() - record.last_sent_at.getTime()) / 1000;
    if (secondsSinceLastSent < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitSecs = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSent);
      throw new AuthError(429, `Vui lòng chờ ${waitSecs} giây trước khi gửi lại mã.`);
    }

    // Kiểm tra giới hạn 5 lần/giờ (window_start reset sau 60 phút)
    const minutesSinceWindowStart = (now.getTime() - record.window_start.getTime()) / (60 * 1000);
    if (minutesSinceWindowStart < 60 && record.sent_count >= OTP_MAX_SENDS_PER_HOUR) {
      throw new AuthError(429, 'Bạn đã yêu cầu gửi lại mã quá nhiều lần. Vui lòng thử lại sau 1 giờ.');
    }
  }

  await issueOtp(user.user_id, normalizedEmail, user.full_name);
}
