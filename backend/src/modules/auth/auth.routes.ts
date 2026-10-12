import { Router, type CookieOptions, type Request, type Response } from 'express';
import { z } from 'zod';
import { AuthError } from './auth.errors';
import { forgotPasswordRateLimit, loginRateLimit } from './auth.rate-limit';
import {
  adminLogin,
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  logoutAll,
  refreshSession,
  register,
  resetPassword,
  updatePassword,
  type IssuedSession,
} from './auth.service';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';

const router = Router();
const adminRouter = Router();

const passwordRule = z.string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự.')
  .regex(/(?=.*\p{L})(?=.*\d)/u, 'Mật khẩu phải có ít nhất một chữ cái và một chữ số.');

const partnerSchema = z.object({
  businessName: z.string().trim().min(2, 'Vui lòng nhập tên doanh nghiệp/cơ sở.').max(75, 'Tên doanh nghiệp tối đa 75 ký tự.'),
  serviceType: z.enum(['STAY', 'TABLE', 'TICKET'], { error: 'Loại dịch vụ không hợp lệ.' }),
  taxCode: z.string().trim().max(20, 'Mã số thuế tối đa 20 ký tự.').optional(),
  address: z.string().trim().max(125, 'Địa chỉ tối đa 125 ký tự.').optional(),
});

const registerSchema = z.object({
  role: z.enum(['USER', 'PARTNER', 'ADMIN'], { error: 'Vai trò tài khoản không hợp lệ.' }),
  name: z.string().trim().min(2, 'Vui lòng nhập họ tên.').max(50, 'Họ tên tối đa 50 ký tự.'),
  email: z.string().trim().email('Email không hợp lệ.').max(150, 'Email tối đa 150 ký tự.'),
  phone: z.string().trim().max(30, 'Số điện thoại không hợp lệ.').optional(),
  password: passwordRule,
  confirmPassword: z.string(),
  agreedToTerms: z.literal(true, { error: 'Bạn cần đồng ý với điều khoản sử dụng.' }),
  partner: partnerSchema.optional(),
}).superRefine((input, context) => {
  if (input.password !== input.confirmPassword) {
    context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Mật khẩu xác nhận không khớp.' });
  }
  if (input.role === 'PARTNER' && !input.partner) {
    context.addIssue({ code: 'custom', path: ['partner'], message: 'Vui lòng nhập thông tin nhà cung cấp.' });
  }
  if (input.role === 'USER' && input.partner) {
    context.addIssue({ code: 'custom', path: ['partner'], message: 'Tài khoản khách du lịch không cần thông tin nhà cung cấp.' });
  }
});

const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Vui lòng nhập email hoặc số điện thoại.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
  rememberMe: z.boolean().optional(),
});

const forgotSchema = z.object({ email: z.string().trim().email('Email không hợp lệ.').max(150) });
const resetSchema = z.object({ token: z.string().min(20), newPassword: passwordRule, confirmPassword: z.string() })
  .refine((input) => input.newPassword === input.confirmPassword, {
    path: ['confirmPassword'], message: 'Mật khẩu xác nhận không khớp.',
  });
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
  newPassword: passwordRule,
  confirmPassword: z.string(),
}).refine((input) => input.newPassword === input.confirmPassword, {
  path: ['confirmPassword'], message: 'Mật khẩu xác nhận không khớp.',
});

function clientMetadata(request: Request) {
  return { userAgent: request.get('user-agent') ?? null, ip: request.ip ?? null };
}

const isProduction = () => process.env.NODE_ENV === 'production';
function cookieOptions(): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', secure: isProduction(), path: '/' };
}
function cookieNames(admin: boolean) {
  return admin
    ? { access: 'admin_access', refresh: 'admin_refresh' }
    : { access: 'access_token', refresh: 'refresh_token' };
}
function setSessionCookies(response: Response, session: IssuedSession, admin: boolean): void {
  const names = cookieNames(admin);
  response.cookie(names.access, session.accessToken, { ...cookieOptions(), maxAge: 15 * 60 * 1000 });
  response.cookie(names.refresh, session.refreshToken, {
    ...cookieOptions(),
    ...(session.rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
  });
}
function clearSessionCookies(response: Response, admin: boolean): void {
  const names = cookieNames(admin);
  response.clearCookie(names.access, cookieOptions());
  response.clearCookie(names.refresh, cookieOptions());
}

router.post('/register', async (req, res) => {
  if (req.body && typeof req.body === 'object' && req.body.role === 'ADMIN') {
    throw new AuthError(403, 'Không thể đăng ký tài khoản quản trị.');
  }
  const input = registerSchema.parse(req.body);
  const session = await register(input, clientMetadata(req));
  setSessionCookies(res, session, false);
  res.status(201).json({ success: true, data: { user: session.user }, message: 'Đăng ký thành công.' });
});

router.post('/login', loginRateLimit, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const session = await login(input, clientMetadata(req));
  setSessionCookies(res, session, false);
  res.json({ success: true, data: { user: session.user }, message: 'Đăng nhập thành công.' });
});

router.post('/refresh', async (req, res) => {
  try {
    const session = await refreshSession(req.cookies?.refresh_token, 'USER', clientMetadata(req));
    setSessionCookies(res, session, false);
    res.json({ success: true, data: { user: session.user } });
  } catch (error) {
    clearSessionCookies(res, false);
    throw error;
  }
});

router.post('/logout', async (req, res) => {
  await logout(req.cookies?.refresh_token);
  clearSessionCookies(res, false);
  res.json({ success: true, message: 'Đã đăng xuất.' });
});

router.post('/logout-all', requireAuth('USER'), requireRole('USER', 'PARTNER'), async (_req, res) => {
  await logoutAll(res.locals.authUserId!);
  clearSessionCookies(res, false);
  res.json({ success: true, message: 'Đã đăng xuất khỏi tất cả thiết bị.' });
});

router.get('/me', requireAuth('USER'), requireRole('USER', 'PARTNER'), async (_req, res) => {
  const user = await getCurrentUser(res.locals.authUserId!);
  res.json({ success: true, data: { user } });
});

router.post('/forgot-password', forgotPasswordRateLimit, async (req, res) => {
  const { email } = forgotSchema.parse(req.body);
  await forgotPassword(email);
  res.json({ success: true, message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.' });
});

router.post('/reset-password', async (req, res) => {
  const input = resetSchema.parse(req.body);
  await resetPassword({ token: input.token, newPassword: input.newPassword });
  res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
});

router.post('/change-password', requireAuth('USER'), requireRole('USER', 'PARTNER'), async (req, res) => {
  const input = changePasswordSchema.parse(req.body);
  await updatePassword(res.locals.authUserId!, input.currentPassword, input.newPassword, req.cookies?.refresh_token);
  res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
});

adminRouter.post('/login', loginRateLimit, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const session = await adminLogin(input, clientMetadata(req));
  setSessionCookies(res, session, true);
  res.json({ success: true, data: { user: session.user }, message: 'Đăng nhập quản trị thành công.' });
});

adminRouter.post('/refresh', async (req, res) => {
  try {
    const session = await refreshSession(req.cookies?.admin_refresh, 'ADMIN', clientMetadata(req));
    setSessionCookies(res, session, true);
    res.json({ success: true, data: { user: session.user } });
  } catch (error) {
    clearSessionCookies(res, true);
    throw error;
  }
});

adminRouter.post('/logout', async (req, res) => {
  await logout(req.cookies?.admin_refresh);
  clearSessionCookies(res, true);
  res.json({ success: true, message: 'Đã đăng xuất quản trị.' });
});

adminRouter.get('/me', requireAuth('ADMIN'), requireRole('ADMIN'), async (_req, res) => {
  const user = await getCurrentUser(res.locals.authUserId!);
  res.json({ success: true, data: { user } });
});

export { adminRouter };
export default router;
