import { getPool } from "../../config/db";

export const REVIEW_SUMMARY_MINIMUM = 5;
export interface FeedbackCounts {
  approvedReviews: number;
  pendingReviews: number;
  summaryReadyPlaces: number;
  partnerReplyReviews: number;
  submittedResponses: number;
  textAnswers: number;
}
export function feedbackFeatures(counts: FeedbackCounts) {
  return [
    {
      key: "reviewSummary",
      label: "Tổng hợp đánh giá",
      ready: counts.summaryReadyPlaces > 0,
      available: counts.summaryReadyPlaces,
      unit: "địa điểm đủ dữ liệu",
      requirement:
        "Ít nhất 5 đánh giá đã duyệt tại cùng một địa điểm công khai.",
      href: "/admin/danh-gia",
    },
    {
      key: "partnerReply",
      label: "Nháp phản hồi đối tác",
      ready: counts.partnerReplyReviews > 0,
      available: counts.partnerReplyReviews,
      unit: "đánh giá phù hợp",
      requirement:
        "Có đánh giá đã duyệt tại cơ sở công khai thuộc đối tác đã được duyệt.",
      href: "/admin/danh-gia",
    },
    {
      key: "moderation",
      label: "Hỗ trợ kiểm duyệt",
      ready: counts.pendingReviews > 0,
      available: counts.pendingReviews,
      unit: "đánh giá chờ duyệt",
      requirement:
        "Có đánh giá chờ duyệt; quản trị viên tự quyết định sau khi đọc gợi ý AI.",
      href: "/admin/danh-gia",
    },
    {
      key: "survey",
      label: "Phân tích góp ý khảo sát",
      ready: counts.textAnswers > 0,
      available: counts.textAnswers,
      unit: "câu trả lời tự do",
      requirement:
        "Có góp ý văn bản trong phiếu đã gửi. Phiếu chỉ chấm điểm vẫn có thống kê, chưa có chủ đề để nhóm.",
      href: "/admin/khao-sat",
    },
  ];
}
export async function feedbackReadiness() {
  const result = await getPool().request().query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.reviews r JOIN dbo.places p ON p.place_id=r.place_id WHERE p.status='ACTIVE' AND r.status='APPROVED') AS approvedReviews,
      (SELECT COUNT(*) FROM dbo.reviews r JOIN dbo.places p ON p.place_id=r.place_id WHERE p.status='ACTIVE' AND r.status='PENDING') AS pendingReviews,
      (SELECT COUNT(*) FROM dbo.places p WHERE p.status='ACTIVE' AND (SELECT COUNT(*) FROM dbo.reviews r WHERE r.place_id=p.place_id AND r.status='APPROVED')>=5) AS summaryReadyPlaces,
      (SELECT COUNT(*) FROM dbo.reviews r JOIN dbo.places p ON p.place_id=r.place_id JOIN dbo.partner_profiles pp ON pp.partner_id=p.partner_id WHERE p.status='ACTIVE' AND pp.approval_status='APPROVED' AND r.status='APPROVED') AS partnerReplyReviews,
      (SELECT COUNT(*) FROM dbo.survey_responses sr JOIN dbo.surveys s ON s.survey_id=sr.survey_id WHERE sr.status='SUBMITTED' AND s.is_deleted=0) AS submittedResponses,
      (SELECT COUNT(*) FROM dbo.survey_answers a JOIN dbo.survey_responses sr ON sr.response_id=a.response_id JOIN dbo.survey_questions q ON q.question_id=a.question_id AND q.survey_id=sr.survey_id JOIN dbo.surveys s ON s.survey_id=sr.survey_id WHERE sr.status='SUBMITTED' AND s.is_deleted=0 AND q.question_type='TEXT' AND a.answer_number IS NULL AND NULLIF(LTRIM(RTRIM(a.answer_text)),N'') IS NOT NULL) AS textAnswers,
      (SELECT COUNT(*) FROM dbo.places WHERE status='ACTIVE') AS placesTotal;
    SELECT TOP(50) p.place_id AS id,p.name,
      CASE WHEN pp.approval_status='APPROVED' THEN 1 ELSE 0 END AS partnerApproved,
      (SELECT COUNT(*) FROM dbo.reviews r WHERE r.place_id=p.place_id AND r.status='APPROVED') AS approved,
      (SELECT COUNT(*) FROM dbo.reviews r WHERE r.place_id=p.place_id AND r.status='PENDING') AS pending
    FROM dbo.places p LEFT JOIN dbo.partner_profiles pp ON pp.partner_id=p.partner_id
    WHERE p.status='ACTIVE' ORDER BY approved DESC,partnerApproved DESC,p.place_id;
    SELECT s.survey_id AS id,s.title,s.survey_code AS code,
      CASE WHEN s.status='OPEN' AND s.target_role IN('ALL','USER') AND (s.expires_at IS NULL OR s.expires_at>SYSUTCDATETIME()) THEN 1 ELSE 0 END AS canCollect,
      (SELECT COUNT(*) FROM dbo.survey_responses sr WHERE sr.survey_id=s.survey_id AND sr.status='SUBMITTED') AS submitted,
      (SELECT COUNT(*) FROM dbo.survey_answers a JOIN dbo.survey_responses sr ON sr.response_id=a.response_id JOIN dbo.survey_questions q ON q.question_id=a.question_id AND q.survey_id=s.survey_id WHERE sr.survey_id=s.survey_id AND sr.status='SUBMITTED' AND q.question_type='TEXT' AND a.answer_number IS NULL AND NULLIF(LTRIM(RTRIM(a.answer_text)),N'') IS NOT NULL) AS textAnswers
    FROM dbo.surveys s WHERE s.is_deleted=0 ORDER BY s.survey_id;
  `);
  const sets = result.recordsets as import("mssql").IRecordSet<
    Record<string, any>
  >[];
  const counts = sets[0]![0]! as FeedbackCounts & { placesTotal: number };
  return {
    checkedAt: new Date().toISOString(),
    counts,
    features: feedbackFeatures(counts),
    places: sets[1]!.map((p) => ({
      id: p.id as number,
      name: p.name as string,
      partnerApproved: Boolean(p.partnerApproved),
      approved: p.approved as number,
      pending: p.pending as number,
      remaining: Math.max(0, REVIEW_SUMMARY_MINIMUM - p.approved),
      href: `/places/${p.id}#danh-gia`,
    })),
    surveys: sets[2]!.map((s) => ({
      id: s.id as number,
      title: s.title as string,
      canCollect: Boolean(s.canCollect),
      submitted: s.submitted as number,
      textAnswers: s.textAnswers as number,
      href:
        s.code === "FULL_V1"
          ? "/khao-sat"
          : s.code === "QUICK_V1"
            ? "/khao-sat?mode=quick"
            : `/khao-sat?surveyId=${s.id}`,
    })),
  };
}
