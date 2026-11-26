import { createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { getPool, sql } from "../../config/db";
import {
  buildPostTripSurveyInviteEmail,
  buildSurveyAppreciationEmail,
  maskEmail,
} from "../../utils/emailTemplates";
import { SURVEY_CATALOG } from "./surveys.catalog";
import type { Submission } from "./surveys.validation";

export interface SurveyAppreciationResult {
  sent: boolean;
  status: "SENT" | "DEV_LOGGED" | "SKIPPED_COOLDOWN" | "FAILED" | "NONE";
  certificateCode?: string;
  rewardCode?: string;
  recipientName?: string;
  maskedEmail?: string;
  originLabel?: string | null;
  stayDurationLabel?: string | null;
  issuedAt?: string;
  previewUrl?: string;
}

export interface SurveyCertificateDetail {
  certificateCode: string;
  recipientName: string;
  maskedEmail: string;
  originLabel: string | null;
  stayDurationLabel: string | null;
  satisfactionScore: number | null;
  npsScore: number | null;
  rewardCode: string;
  deliveryStatus: string;
  issuedAt: string;
  emailSubject: string;
  emailHtml: string;
}

export interface PostTripInviteDispatchReport {
  scannedCompletedTrips: number;
  eligibleNewTrips: number;
  sentCount: number;
  devLoggedCount: number;
  failedCount: number;
  invitations: Array<{
    itineraryId: number;
    itineraryTitle: string;
    maskedEmail: string;
    tripEndDate: string;
    status: "SENT" | "DEV_LOGGED" | "FAILED";
  }>;
}

/** Băm SHA-256 của email đã chuẩn hóa lowercase để chống spam nhưng không lưu email thô */
export function hashNormalizedEmail(email: string): string {
  return createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
}

function generateCertificateCode(responseId: number): string {
  const year = new Date().getFullYear();
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `DNG-${year}-${String(responseId).padStart(4, "0")}-${suffix}`;
}

function generateRewardCode(responseId: number): string {
  const token = createHash("sha256")
    .update(`dananggo-reward:${responseId}:${Date.now()}`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();
  return `TRIAN-DNG-${token}`;
}

function lookupCatalogLabel(questionCode: string, optionCode?: string): string | null {
  if (!optionCode) return null;
  const fullQuestions = SURVEY_CATALOG.FULL;
  const q = fullQuestions.find((item) => item.code === questionCode);
  const opt = q?.options?.find((o) => o.code === optionCode);
  return opt?.label ?? null;
}

async function sendEmailSafe(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: string;
}): Promise<{
  status: "SENT" | "DEV_LOGGED" | "FAILED";
  previewUrl?: string;
}> {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_APP_PASSWORD;
  const fromName = process.env.MAIL_FROM_NAME || "DaNangGo";

  // Trong môi trường test tự động hoặc chưa cấu hình SMTP -> ghi nhận DEV_LOGGED an toàn
  if (
    process.env.SURVEY_MAIL_DRY_RUN === "1" ||
    (!user || !pass)
  ) {
    return { status: "DEV_LOGGED" };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    return { status: "SENT" };
  } catch (err) {
    console.warn(
      `[SurveyMailer:${params.tag}] Gmail SMTP chạm hạn mức hoặc lỗi, thử tạo hộp thư xem trước Ethereal:`,
      (err as Error)?.message,
    );
    if (process.env.NODE_ENV !== "production") {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const fallbackTransporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        const info = await fallbackTransporter.sendMail({
          from: `"${fromName}" <${testAccount.user}>`,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
        });
        const url = nodemailer.getTestMessageUrl(info);
        if (typeof url === "string" && url) {
          console.info(`[SurveyMailer:${params.tag}] Ethereal Preview URL: ${url}`);
          return { status: "DEV_LOGGED", previewUrl: url };
        }
      } catch {
        // Bỏ qua nếu không kết nối được Ethereal
      }
    }
    return {
      status: process.env.NODE_ENV === "production" ? "FAILED" : "DEV_LOGGED",
    };
  }
}

/**
 * Lấy email & họ tên từ tài khoản đã đăng nhập (nếu có) hoặc từ metadata người dùng nhập.
 */
async function resolveRecipient(
  input: Submission,
  authUserId?: number,
): Promise<{ email: string; name: string } | null> {
  const manualEmail = input.metadata.recipient_email?.trim();
  const manualName = input.metadata.recipient_name?.trim();

  if (authUserId) {
    const userRes = await getPool()
      .request()
      .input("userId", sql.Int, authUserId)
      .query<{ email: string; full_name: string }>(
        "SELECT email, full_name FROM dbo.users WHERE user_id = @userId",
      );
    const account = userRes.recordset[0];
    if (account) {
      return {
        email: manualEmail || account.email,
        name: manualName || account.full_name || "Bạn du khách Đà Nẵng",
      };
    }
  }

  if (manualEmail) {
    return {
      email: manualEmail,
      name: manualName || "Bạn du khách Đà Nẵng",
    };
  }

  return null;
}

/**
 * Luồng A: Ngay sau khi du khách gửi khảo sát, tự động phát hành Chứng nhận điện tử
 * + Mã quà tặng tri ân và gửi về email (không cần Admin duyệt).
 * Có lớp chặn: tối đa 1 thư tri ân / email trong 30 ngày cho khách vãng lai,
 * và idempotent theo response_id.
 */
export async function issueAndSendSurveyAppreciation(
  responseId: number,
  input: Submission,
  authUserId?: number,
): Promise<SurveyAppreciationResult> {
  try {
    const pool = getPool();

    // 1. Kiểm tra nếu responseId này đã được cấp chứng nhận trước đó (retry idempotent)
    const existingRes = await pool
      .request()
      .input("responseId", sql.Int, responseId)
      .query<{
        certificate_code: string;
        reward_code: string;
        recipient_name: string;
        masked_email: string;
        origin_label: string | null;
        stay_duration_label: string | null;
        delivery_status: "SENT" | "DEV_LOGGED" | "SKIPPED_COOLDOWN" | "FAILED";
        created_at: Date;
      }>(
        "SELECT certificate_code, reward_code, recipient_name, masked_email, origin_label, stay_duration_label, delivery_status, created_at FROM dbo.survey_appreciation_deliveries WHERE response_id = @responseId",
      );

    if (existingRes.recordset[0]) {
      const row = existingRes.recordset[0];
      return {
        sent:
          row.delivery_status === "SENT" ||
          (process.env.SURVEY_MAIL_DRY_RUN === "1" &&
            row.delivery_status === "DEV_LOGGED"),
        status: row.delivery_status,
        certificateCode: row.certificate_code,
        rewardCode: row.reward_code,
        recipientName: row.recipient_name,
        maskedEmail: row.masked_email,
        originLabel: row.origin_label,
        stayDurationLabel: row.stay_duration_label,
        issuedAt: new Date(row.created_at).toISOString(),
      };
    }

    const recipient = await resolveRecipient(input, authUserId);
    if (!recipient) {
      return { sent: false, status: "NONE" };
    }

    const emailHash = hashNormalizedEmail(recipient.email);
    const masked = maskEmail(recipient.email);

    // 2. Chống lạm dụng: chỉ chặn 30 ngày nếu email này ĐÃ NHẬN ĐƯỢC THƯ THẬT ('SENT')
    // (hoặc đang chạy kiểm thử tự động SURVEY_MAIL_DRY_RUN=1)
    const cooldownStatuses =
      process.env.SURVEY_MAIL_DRY_RUN === "1"
        ? "('SENT', 'DEV_LOGGED')"
        : "('SENT')";
    const cooldownCheck = await pool
      .request()
      .input("emailHash", sql.VarChar(64), emailHash)
      .query<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt
         FROM dbo.survey_appreciation_deliveries
         WHERE email_hash = @emailHash
           AND delivery_status IN ${cooldownStatuses}
           AND created_at >= DATEADD(DAY, -30, SYSUTCDATETIME())`,
      );

    const withinCooldown = (cooldownCheck.recordset[0]?.cnt ?? 0) > 0;

    // 3. Trích xuất thông tin cá nhân hóa từ câu trả lời khảo sát
    const originCode = input.answers.find(
      (a) => a.question_code === "ORIGIN_PROVINCE",
    )?.option_codes?.[0];
    const durationCode = input.answers.find(
      (a) => a.question_code === "STAY_DURATION",
    )?.option_codes?.[0];
    const satisfactionScore =
      input.answers.find((a) => a.question_code === "OVERALL_SATISFACTION")
        ?.answer_score ?? null;
    const npsScore =
      input.answers.find((a) => a.question_code === "NPS_SCORE")
        ?.answer_number ?? null;

    const originLabel = lookupCatalogLabel("ORIGIN_PROVINCE", originCode);
    const stayDurationLabel = lookupCatalogLabel("STAY_DURATION", durationCode);

    const certificateCode = generateCertificateCode(responseId);
    const rewardCode = generateRewardCode(responseId);

    let deliveryStatus: "SENT" | "DEV_LOGGED" | "SKIPPED_COOLDOWN" | "FAILED" =
      "SKIPPED_COOLDOWN";
    let previewUrl: string | undefined;

    if (!withinCooldown) {
      const emailContent = buildSurveyAppreciationEmail({
        recipientName: recipient.name,
        certificateCode,
        originLabel,
        stayDurationLabel,
        satisfactionScore,
        npsScore,
        rewardCode,
      });

      const sendResult = await sendEmailSafe({
        to: recipient.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        tag: "Appreciation",
      });
      deliveryStatus = sendResult.status;
      previewUrl = sendResult.previewUrl;
    }

    const inserted = await pool
      .request()
      .input("responseId", sql.Int, responseId)
      .input("certCode", sql.VarChar(32), certificateCode)
      .input("emailHash", sql.VarChar(64), emailHash)
      .input("maskedEmail", sql.NVarChar(160), masked)
      .input("recipientName", sql.NVarChar(120), recipient.name)
      .input("originLabel", sql.NVarChar(120), originLabel)
      .input("stayDurationLabel", sql.NVarChar(80), stayDurationLabel)
      .input("satisfactionScore", sql.TinyInt, satisfactionScore)
      .input("npsScore", sql.TinyInt, npsScore)
      .input("rewardCode", sql.VarChar(32), rewardCode)
      .input("status", sql.VarChar(20), deliveryStatus)
      .query<{ created_at: Date }>(
        `INSERT INTO dbo.survey_appreciation_deliveries
          (response_id, certificate_code, email_hash, masked_email, recipient_name,
           origin_label, stay_duration_label, satisfaction_score, nps_score,
           reward_code, delivery_status, sent_at)
         OUTPUT INSERTED.created_at
         VALUES
          (@responseId, @certCode, @emailHash, @maskedEmail, @recipientName,
           @originLabel, @stayDurationLabel, @satisfactionScore, @npsScore,
           @rewardCode, @status, CASE WHEN @status IN ('SENT', 'DEV_LOGGED') THEN SYSUTCDATETIME() ELSE NULL END)`,
      );

    return {
      sent:
        deliveryStatus === "SENT" ||
        (process.env.SURVEY_MAIL_DRY_RUN === "1" &&
          deliveryStatus === "DEV_LOGGED"),
      status: deliveryStatus,
      certificateCode,
      rewardCode,
      recipientName: recipient.name,
      maskedEmail: masked,
      originLabel,
      stayDurationLabel,
      issuedAt: new Date(
        inserted.recordset[0]?.created_at ?? Date.now(),
      ).toISOString(),
      ...(previewUrl ? { previewUrl } : {}),
    };
  } catch (err) {
    console.warn(
      "[SurveyMailer] Không thể xử lý thư tri ân (khảo sát vẫn được lưu):",
      (err as Error)?.message,
    );
    return { sent: false, status: "FAILED" };
  }
}

/**
 * Tra cứu Chứng nhận Du khách Văn minh Đà Nẵng theo mã chứng nhận
 */
export async function getCertificateByCode(
  code: string,
): Promise<SurveyCertificateDetail | null> {
  const cleanCode = code.trim().toUpperCase();
  const result = await getPool()
    .request()
    .input("code", sql.VarChar(32), cleanCode)
    .query<{
      certificate_code: string;
      recipient_name: string;
      masked_email: string;
      origin_label: string | null;
      stay_duration_label: string | null;
      satisfaction_score: number | null;
      nps_score: number | null;
      reward_code: string;
      delivery_status: string;
      created_at: Date;
    }>(
      `SELECT certificate_code, recipient_name, masked_email, origin_label,
              stay_duration_label, satisfaction_score, nps_score, reward_code,
              delivery_status, created_at
       FROM dbo.survey_appreciation_deliveries
       WHERE certificate_code = @code`,
    );

  const row = result.recordset[0];
  if (!row) return null;

  const issuedAt = new Date(row.created_at).toISOString();
  const emailRendered = buildSurveyAppreciationEmail({
    recipientName: row.recipient_name,
    certificateCode: row.certificate_code,
    originLabel: row.origin_label,
    stayDurationLabel: row.stay_duration_label,
    satisfactionScore: row.satisfaction_score,
    npsScore: row.nps_score,
    rewardCode: row.reward_code,
    issuedDate: new Date(row.created_at).toLocaleDateString("vi-VN"),
  });

  return {
    certificateCode: row.certificate_code,
    recipientName: row.recipient_name,
    maskedEmail: row.masked_email,
    originLabel: row.origin_label,
    stayDurationLabel: row.stay_duration_label,
    satisfactionScore: row.satisfaction_score,
    npsScore: row.nps_score,
    rewardCode: row.reward_code,
    deliveryStatus: row.delivery_status,
    issuedAt,
    emailSubject: emailRendered.subject,
    emailHtml: emailRendered.html,
  };
}

/**
 * Luồng B: Quét các lịch trình tại Đà Nẵng đã kết thúc chuyến đi
 * (`DATEADD(DAY, day_count - 1, start_date) < CAST(SYSUTCDATETIME() AS DATE)`)
 * và tự động gửi email mời khảo sát (mỗi lịch trình chỉ gửi tối đa 1 lần).
 */
export async function dispatchCompletedTripSurveyInvites(
  limit = 25,
): Promise<PostTripInviteDispatchReport> {
  const pool = getPool();

  // Kiểm tra sự tồn tại của bảng planner.itineraries và survey_trip_invitations
  const tableCheck = await pool.request().query<{ ok: number }>(`
    SELECT CASE
      WHEN OBJECT_ID('planner.itineraries') IS NOT NULL
       AND OBJECT_ID('dbo.survey_trip_invitations', 'U') IS NOT NULL
      THEN 1 ELSE 0 END AS ok
  `);
  if (!tableCheck.recordset[0]?.ok) {
    return {
      scannedCompletedTrips: 0,
      eligibleNewTrips: 0,
      sentCount: 0,
      devLoggedCount: 0,
      failedCount: 0,
      invitations: [],
    };
  }

  const completedCountRes = await pool.request().query<{ total: number }>(`
    SELECT COUNT(*) AS total
    FROM planner.itineraries AS it
    WHERE it.status IN (N'DRAFT', N'SAVED')
      AND DATEADD(DAY, it.day_count - 1, it.start_date) < CAST(SYSUTCDATETIME() AS DATE)
  `);
  const scannedCompletedTrips = completedCountRes.recordset[0]?.total ?? 0;

  // Chọn các lịch trình đã kết thúc nhưng chưa có trong dbo.survey_trip_invitations
  const candidatesRes = await pool
    .request()
    .input("limit", sql.Int, Math.max(1, Math.min(100, limit)))
    .query<{
      itinerary_id: number;
      user_id: number;
      title: string;
      start_date: string;
      day_count: number;
      trip_end_date: string;
      email: string;
      full_name: string;
    }>(`
      SELECT TOP (@limit)
        it.id AS itinerary_id,
        it.user_id,
        it.title,
        CONVERT(VARCHAR(10), it.start_date, 23) AS start_date,
        it.day_count,
        CONVERT(VARCHAR(10), DATEADD(DAY, it.day_count - 1, it.start_date), 23) AS trip_end_date,
        u.email,
        u.full_name
      FROM planner.itineraries AS it
      INNER JOIN dbo.users AS u ON u.user_id = it.user_id
      LEFT JOIN dbo.survey_trip_invitations AS inv ON inv.itinerary_id = it.id
      WHERE inv.invitation_id IS NULL
        AND it.status IN (N'DRAFT', N'SAVED')
        AND u.status = 'ACTIVE'
        AND DATEADD(DAY, it.day_count - 1, it.start_date) < CAST(SYSUTCDATETIME() AS DATE)
      ORDER BY it.start_date DESC, it.id DESC
    `);

  const candidates = candidatesRes.recordset;
  let sentCount = 0;
  let devLoggedCount = 0;
  let failedCount = 0;
  const invitations: PostTripInviteDispatchReport["invitations"] = [];

  for (const row of candidates) {
    const emailHash = hashNormalizedEmail(row.email);
    const masked = maskEmail(row.email);

    const emailContent = buildPostTripSurveyInviteEmail({
      userName: row.full_name || "Bạn du khách",
      itineraryId: Number(row.itinerary_id),
      itineraryTitle: row.title,
      startDate: row.start_date,
      dayCount: row.day_count,
    });

    const sendResult = await sendEmailSafe({
      to: row.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      tag: "PostTripInvite",
    });
    const status = sendResult.status;

    try {
      await pool
        .request()
        .input("itineraryId", sql.BigInt, row.itinerary_id)
        .input("userId", sql.Int, row.user_id)
        .input("emailHash", sql.VarChar(64), emailHash)
        .input("maskedEmail", sql.NVarChar(160), masked)
        .input("title", sql.NVarChar(200), row.title)
        .input("endDate", sql.Date, new Date(`${row.trip_end_date}T00:00:00.000Z`))
        .input("status", sql.VarChar(20), status)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM dbo.survey_trip_invitations WHERE itinerary_id = @itineraryId)
          INSERT INTO dbo.survey_trip_invitations
            (itinerary_id, user_id, email_hash, masked_email, itinerary_title, trip_end_date, delivery_status, sent_at)
          VALUES
            (@itineraryId, @userId, @emailHash, @maskedEmail, @title, @endDate, @status, SYSUTCDATETIME())
        `);

      if (status === "SENT") sentCount += 1;
      else if (status === "DEV_LOGGED") devLoggedCount += 1;
      else failedCount += 1;

      invitations.push({
        itineraryId: Number(row.itinerary_id),
        itineraryTitle: row.title,
        maskedEmail: masked,
        tripEndDate: row.trip_end_date,
        status,
      });
    } catch (err) {
      console.warn(
        "[SurveyMailer] Không thể ghi nhận lời mời lịch trình:",
        (err as Error)?.message,
      );
    }
  }

  return {
    scannedCompletedTrips,
    eligibleNewTrips: candidates.length,
    sentCount,
    devLoggedCount,
    failedCount,
    invitations,
  };
}

/**
 * Thống kê hoạt động gửi thư tri ân & lời mời sau chuyến đi cho trang Admin
 */
export async function getSurveyAutomationStats() {
  const pool = getPool();
  const tableCheck = await pool.request().query<{ ok: number }>(`
    SELECT CASE
      WHEN OBJECT_ID('dbo.survey_appreciation_deliveries', 'U') IS NOT NULL
       AND OBJECT_ID('dbo.survey_trip_invitations', 'U') IS NOT NULL
      THEN 1 ELSE 0 END AS ok
  `);
  if (!tableCheck.recordset[0]?.ok) {
    return {
      appreciationTotal: 0,
      tripInvitesTotal: 0,
      recentAppreciations: [],
      recentTripInvites: [],
    };
  }

  const [appCount, invCount, recentApp, recentInv] = await Promise.all([
    pool.request().query<{ cnt: number }>(
      "SELECT COUNT(*) AS cnt FROM dbo.survey_appreciation_deliveries WHERE delivery_status IN ('SENT', 'DEV_LOGGED')",
    ),
    pool.request().query<{ cnt: number }>(
      "SELECT COUNT(*) AS cnt FROM dbo.survey_trip_invitations WHERE delivery_status IN ('SENT', 'DEV_LOGGED')",
    ),
    pool.request().query<{
      certificate_code: string;
      recipient_name: string;
      masked_email: string;
      origin_label: string | null;
      reward_code: string;
      delivery_status: string;
      created_at: Date;
    }>(
      "SELECT TOP (10) certificate_code, recipient_name, masked_email, origin_label, reward_code, delivery_status, created_at FROM dbo.survey_appreciation_deliveries ORDER BY created_at DESC",
    ),
    pool.request().query<{
      itinerary_id: number;
      itinerary_title: string;
      masked_email: string;
      trip_end_date: Date;
      delivery_status: string;
      sent_at: Date;
    }>(
      "SELECT TOP (10) itinerary_id, itinerary_title, masked_email, trip_end_date, delivery_status, sent_at FROM dbo.survey_trip_invitations ORDER BY sent_at DESC",
    ),
  ]);

  return {
    appreciationTotal: appCount.recordset[0]?.cnt ?? 0,
    tripInvitesTotal: invCount.recordset[0]?.cnt ?? 0,
    recentAppreciations: recentApp.recordset.map((r) => ({
      certificateCode: r.certificate_code,
      recipientName: r.recipient_name,
      maskedEmail: r.masked_email,
      originLabel: r.origin_label,
      rewardCode: r.reward_code,
      deliveryStatus: r.delivery_status,
      createdAt: new Date(r.created_at).toISOString(),
    })),
    recentTripInvites: recentInv.recordset.map((r) => ({
      itineraryId: Number(r.itinerary_id),
      itineraryTitle: r.itinerary_title,
      maskedEmail: r.masked_email,
      tripEndDate: new Date(r.trip_end_date).toISOString().slice(0, 10),
      deliveryStatus: r.delivery_status,
      sentAt: new Date(r.sent_at).toISOString(),
    })),
  };
}
