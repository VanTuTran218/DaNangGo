import nodemailer from 'nodemailer';
import {
  approvePartner,
  rejectPartner,
  listPartners,
  getPartnerContact,
  listAdminPlaces,
  deleteAdminPlace,
  type AdminPlaceItemRecord,
} from './admin.repository';
import { buildPartnerApprovalEmail, buildPartnerRejectionEmail } from '../../utils/emailTemplates';

/** Tái dùng Gmail transporter từ biến môi trường */
function createMailTransporter() {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

async function sendPartnerNotification(
  partnerId: number,
  approved: boolean,
): Promise<void> {
  const contact = await getPartnerContact(partnerId);
  if (!contact) return;

  const transporter = createMailTransporter();
  if (!transporter) {
    // Dev fallback — in ra console
    console.info(`[DEV] Partner ${contact.email} ${approved ? 'APPROVED' : 'REJECTED'}`);
    return;
  }

  const fromName = process.env.MAIL_FROM_NAME ?? 'DaNangGo';
  const fromUser = process.env.MAIL_USER!;

  const { subject, html, text } = approved
    ? buildPartnerApprovalEmail({ userName: contact.full_name, businessName: contact.business_name })
    : buildPartnerRejectionEmail({ userName: contact.full_name, businessName: contact.business_name });

  try {
    await transporter.sendMail({ from: `"${fromName}" <${fromUser}>`, to: contact.email, subject, html, text });
  } catch (err) {
    console.error('[Admin Mail Error] Failed to send partner notification:', err);
    // Không throw — hành động approve/reject đã thành công
  }
}

export async function adminListPartners(status: string | null, limit?: number, offset?: number) {
  return listPartners(status, limit, offset);
}

export async function adminApprovePartner(partnerId: number, adminUserId: number): Promise<boolean> {
  const ok = await approvePartner(partnerId, adminUserId);
  if (ok) {
    await sendPartnerNotification(partnerId, true);
  }
  return ok;
}

export async function adminRejectPartner(partnerId: number, adminUserId: number): Promise<boolean> {
  const ok = await rejectPartner(partnerId, adminUserId);
  if (ok) {
    await sendPartnerNotification(partnerId, false);
  }
  return ok;
}

export async function adminListPlaces(params: {
  category?: string;
  status?: string;
  search?: string;
}): Promise<AdminPlaceItemRecord[]> {
  return listAdminPlaces(params);
}

export async function adminDeletePlace(placeId: number): Promise<boolean> {
  return deleteAdminPlace(placeId);
}
