/**
 * emailTemplates.ts
 * -----------------
 * Template email HTML + text cho các loại email của DaNangGo.
 * Dùng inline CSS để tương thích tối đa với Gmail, Outlook, Apple Mail.
 */

export interface OtpEmailData {
  userName: string;
  email: string;
  otpCode: string;
  /** Số phút hết hạn (mặc định 10) */
  expiryMinutes?: number;
}

/** Che bớt email: tu***@gmail.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = Math.min(2, local.length);
  return `${local.slice(0, visible)}${'*'.repeat(Math.max(3, local.length - visible))}@${domain}`;
}

export function buildOtpEmail(data: OtpEmailData): { subject: string; html: string; text: string } {
  const expiry = data.expiryMinutes ?? 10;
  const subject = '[DaNangGo] Mã xác nhận đăng ký tài khoản';

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0fdfa;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#f0fdfa;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:520px;background:#ffffff;border-radius:16px;
                      box-shadow:0 4px 24px rgba(20,184,166,0.10),0 1px 4px rgba(0,0,0,0.06);
                      overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2942 0%,#0e7490 100%);
                        padding:32px 40px 28px;text-align:center;">
              <!-- Logo / Brand -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <div style="display:inline-flex;align-items:center;gap:10px;">
                      <!-- Icon triangle -->
                      <svg width="36" height="36" viewBox="0 0 40 40" fill="none"
                           xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="20" fill="rgba(255,255,255,0.12)"/>
                        <path d="M12.5 28L20 12 27.5 28H12.5Z" fill="#f97316"/>
                      </svg>
                      <span style="font-size:26px;font-weight:800;color:#ffffff;
                                   letter-spacing:-0.5px;">DaNangGo</span>
                    </div>
                    <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.65);
                               letter-spacing:0.12em;text-transform:uppercase;">
                      Cẩm nang du lịch số #1 Đà Nẵng
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;
                         line-height:1.3;">
                Xin chào, <span style="color:#0e7490;">${escapeHtml(data.userName)}</span>!
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
                Cảm ơn bạn đã đăng ký tài khoản tại DaNangGo.<br />
                Vui lòng sử dụng mã OTP dưới đây để hoàn tất xác thực email.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="background:linear-gradient(135deg,#f0fdfa 0%,#e0f2fe 100%);
                                 border:2px solid #99f6e4;border-radius:12px;
                                 padding:24px 32px;display:inline-block;">
                      <p style="margin:0 0 6px;font-size:12px;font-weight:600;
                                 color:#0e7490;letter-spacing:0.1em;text-transform:uppercase;">
                        Mã xác nhận của bạn
                      </p>
                      <p style="margin:0;font-size:42px;font-weight:800;
                                 letter-spacing:14px;color:#0f2942;
                                 font-family:'Courier New',Courier,monospace;">
                        ${escapeHtml(data.otpCode)}
                      </p>
                      <p style="margin:10px 0 0;font-size:13px;color:#64748b;">
                        ⏱ Mã có hiệu lực trong <strong>${expiry} phút</strong>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security warning -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="margin-bottom:24px;">
                <tr>
                  <td style="background:#fff7ed;border-left:4px solid #f97316;
                              border-radius:0 8px 8px 0;padding:14px 16px;">
                    <p style="margin:0;font-size:13px;color:#9a3412;line-height:1.6;">
                      🔒 <strong>Bảo mật:</strong> Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên DaNangGo.<br />
                      Nếu bạn không thực hiện đăng ký này, hãy bỏ qua email này.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;">
                Bạn đang đăng ký với email: 
                <span style="color:#0e7490;font-weight:600;">${escapeHtml(maskEmail(data.email))}</span>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#e2e8f0;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
                Email này được gửi tự động từ hệ thống DaNangGo. Vui lòng không trả lời.
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} DaNangGo &bull; Đà Nẵng, Việt Nam
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `[DaNangGo] Xác nhận đăng ký tài khoản

Xin chào ${data.userName},

Cảm ơn bạn đã đăng ký tài khoản tại DaNangGo.
Mã xác nhận của bạn là:

  ${data.otpCode}

Mã có hiệu lực trong ${expiry} phút.

CẢNH BÁO BẢO MẬT:
Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên DaNangGo.
Nếu bạn không thực hiện đăng ký này, hãy bỏ qua email này.

---
© ${new Date().getFullYear()} DaNangGo - Đà Nẵng, Việt Nam
`;

  return { subject, html, text };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface ResetPasswordEmailData {
  userName: string;
  otpCode: string;
  expiryMinutes?: number;
}

/** Template email đặt lại mật khẩu bằng OTP — cùng phong cách với buildOtpEmail */
export function buildResetPasswordEmail(data: ResetPasswordEmailData): { subject: string; html: string; text: string } {
  const expiry = data.expiryMinutes ?? 10;
  const subject = '[DaNangGo] Mã đặt lại mật khẩu';
  const safeName = escapeHtml(data.userName);
  const safeCode = escapeHtml(data.otpCode);

  const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg,#0f766e 0%,#0891b2 100%);padding:32px 40px;text-align:center">
    <div style="display:inline-flex;align-items:center;gap:10px">
      <div style="width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center">
        <span style="color:#f97316;font-size:20px;font-weight:900">●</span>
      </div>
      <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px"><span style="color:#67e8f9">Danang</span><span style="color:#fdba74">Go</span></span>
    </div>
  </td></tr>
  <!-- BODY -->
  <tr><td style="padding:40px 40px 32px">
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600">Đặt lại mật khẩu</p>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0f172a">Xin chào, ${safeName}!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6">
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản DaNangGo của bạn. Nhập mã dưới đây để tiếp tục:
    </p>
    <!-- OTP BOX -->
    <div style="background:linear-gradient(135deg,#f0fdf4 0%,#ecfeff 100%);border:2px solid #0891b2;border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:28px">
      <p style="margin:0 0 8px;font-size:12px;color:#0891b2;font-weight:600;text-transform:uppercase;letter-spacing:1.5px">Mã xác nhận của bạn</p>
      <div style="font-size:42px;font-weight:800;letter-spacing:16px;color:#0f2942;font-family:'Courier New',monospace;margin:8px 0">${safeCode}</div>
      <p style="margin:8px 0 0;font-size:13px;color:#64748b">⏱ Mã có hiệu lực trong <strong>${expiry} phút</strong></p>
    </div>
    <!-- WARNING -->
    <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5">
        🔒 <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên DaNangGo. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.
      </p>
    </div>
    <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6">Sau khi đặt lại mật khẩu thành công, tất cả các phiên đăng nhập trước đó sẽ bị vô hiệu hóa.</p>
  </td></tr>
  <!-- FOOTER -->
  <tr><td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="margin:0 0 4px;font-size:12px;color:#94a3b8">© 2025 DaNangGo — Cẩm nang du lịch Đà Nẵng</p>
    <p style="margin:0;font-size:12px;color:#94a3b8">Email được gửi tự động, vui lòng không trả lời.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `[DaNangGo] ĐẶT LẠI MẬT KHẨU

Xin chào ${data.userName},

Mã đặt lại mật khẩu của bạn là: ${data.otpCode}

Mã có hiệu lực trong ${expiry} phút.

KHÔNG chia sẻ mã này với bất kỳ ai.
Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.

© 2025 DaNangGo`;

  return { subject, html, text };
}

export interface PartnerNotificationData {
  userName: string;
  businessName: string;
}

/** Email thông báo partner được DUYỆT */
export function buildPartnerApprovalEmail(data: PartnerNotificationData): { subject: string; html: string; text: string } {
  const subject = '[DaNangGo] Tài khoản đối tác của bạn đã được duyệt ✅';
  const safeName = escapeHtml(data.userName);
  const safeBiz = escapeHtml(data.businessName);

  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f0fdfa;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;padding:32px 16px"><tr><td align="center">
<table width="100%" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(20,184,166,0.10)">
  <tr><td style="background:linear-gradient(135deg,#0f766e 0%,#0891b2 100%);padding:32px 40px;text-align:center">
    <span style="color:#fff;font-size:22px;font-weight:700"><span style="color:#67e8f9">Danang</span><span style="color:#fdba74">Go</span></span>
  </td></tr>
  <tr><td style="padding:40px">
    <p style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin:0 0 8px">Thông báo đối tác</p>
    <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 16px">Chúc mừng, ${safeName}! 🎉</h1>
    <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 20px">
      Tài khoản đối tác của <strong>${safeBiz}</strong> đã được quản trị viên DaNangGo <strong style="color:#0f766e">phê duyệt</strong>.
      Bạn có thể đăng nhập ngay để bắt đầu quản lý dịch vụ của mình.
    </p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#166534">✅ Tài khoản của bạn hiện đã <strong>HOẠT ĐỘNG</strong> trên hệ thống DaNangGo.</p>
    </div>
    <p style="font-size:14px;color:#64748b">Nếu bạn cần hỗ trợ, liên hệ <a href="mailto:support@dananggo.vn" style="color:#0891b2">support@dananggo.vn</a></p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="margin:0;font-size:12px;color:#94a3b8">© ${new Date().getFullYear()} DaNangGo — Đà Nẵng, Việt Nam</p>
  </td></tr>
</table></td></tr></table></body></html>`;

  const text = `[DaNangGo] Tài khoản đối tác được duyệt\n\nChúc mừng ${data.userName}!\n\nTài khoản đối tác "${data.businessName}" đã được phê duyệt. Bạn có thể đăng nhập ngay.\n\nHỗ trợ: support@dananggo.vn\n© ${new Date().getFullYear()} DaNangGo`;
  return { subject, html, text };
}

/** Email thông báo partner bị TỪ CHỐI */
export function buildPartnerRejectionEmail(data: PartnerNotificationData): { subject: string; html: string; text: string } {
  const subject = '[DaNangGo] Kết quả xét duyệt tài khoản đối tác';
  const safeName = escapeHtml(data.userName);
  const safeBiz = escapeHtml(data.businessName);

  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#fff7ed;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;padding:32px 16px"><tr><td align="center">
<table width="100%" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
  <tr><td style="background:linear-gradient(135deg,#0f2942 0%,#0e7490 100%);padding:32px 40px;text-align:center">
    <span style="color:#fff;font-size:22px;font-weight:700"><span style="color:#67e8f9">Danang</span><span style="color:#fdba74">Go</span></span>
  </td></tr>
  <tr><td style="padding:40px">
    <p style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin:0 0 8px">Kết quả xét duyệt</p>
    <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 16px">Xin chào, ${safeName}</h1>
    <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 20px">
      Sau khi xem xét, hồ sơ đăng ký đối tác của <strong>${safeBiz}</strong> chưa đáp ứng yêu cầu hiện tại của DaNangGo.
    </p>
    <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#92400e">Nếu bạn muốn tìm hiểu thêm hoặc cung cấp bổ sung thông tin, vui lòng liên hệ chúng tôi.</p>
    </div>
    <p style="font-size:14px;color:#64748b">Liên hệ hỗ trợ: <a href="mailto:support@dananggo.vn" style="color:#0891b2">support@dananggo.vn</a></p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="margin:0;font-size:12px;color:#94a3b8">© ${new Date().getFullYear()} DaNangGo — Đà Nẵng, Việt Nam</p>
  </td></tr>
</table></td></tr></table></body></html>`;

  const text = `[DaNangGo] Kết quả xét duyệt đối tác\n\nXin chào ${data.userName},\n\nHồ sơ đối tác "${data.businessName}" chưa được chấp thuận. Vui lòng liên hệ support@dananggo.vn để biết thêm chi tiết.\n\n© ${new Date().getFullYear()} DaNangGo`;
  return { subject, html, text };
}
