import { getPool, sql } from "../../config/db";

export async function place(id: number) {
  const result = await getPool().request().input("id", sql.Int, id).query<{
    place_id: number;
    name: string;
    place_type: "RESTAURANT" | "ACCOMMODATION" | "ATTRACTION";
    description: string | null;
    address: string | null;
    district_id: number | null;
    status: string;
  }>(`SELECT place_id,name,place_type,description,address,district_id,status FROM dbo.places WHERE place_id=@id AND status='ACTIVE'`);
  return result.recordset[0] ?? null;
}
export async function approvedReviews(placeId: number) {
  const req = getPool().request().input("id", sql.Int, placeId);
  const result = await req.query<{
    review_id: number;
    rating: number;
    comment: string;
    updated_at: Date | null;
  }>(`
    SELECT TOP (100) review_id,rating,COALESCE(comment,N'') AS comment,updated_at FROM dbo.reviews
    WHERE place_id=@id AND status='APPROVED' ORDER BY created_at DESC,review_id DESC`);
  const count = await getPool().request().input("id", sql.Int, placeId).query<{
    total: number;
  }>(`SELECT COUNT(*) AS total FROM dbo.reviews WHERE place_id=@id AND status='APPROVED'`);
  return { rows: result.recordset, total: count.recordset[0]?.total ?? 0 };
}
export async function ownedReview(id: number, userId: number) {
  const result = await getPool()
    .request()
    .input("id", sql.Int, id)
    .input("userId", sql.Int, userId).query<{
    review_id: number;
    rating: number;
    comment: string;
    name: string;
    partner_id: number;
    approval_status: string;
  }>(`
    SELECT r.review_id,r.rating,COALESCE(r.comment,N'') AS comment,p.name,p.partner_id,pp.approval_status
    FROM dbo.reviews r JOIN dbo.places p ON p.place_id=r.place_id JOIN dbo.partner_profiles pp ON pp.partner_id=p.partner_id
    WHERE r.review_id=@id AND pp.user_id=@userId AND r.status='APPROVED'`);
  return result.recordset[0] ?? null;
}
export async function partnerReviews(userId: number, rating?: number) {
  const result = await getPool()
    .request()
    .input("userId", sql.Int, userId)
    .input("rating", sql.Int, rating ?? null).query(`
    SELECT TOP (200) r.review_id,r.place_id,p.name AS place_name,u.full_name,r.rating,r.comment,r.created_at,
      rr.reply_text,rr.updated_at AS replied_at
    FROM dbo.reviews r JOIN dbo.places p ON p.place_id=r.place_id JOIN dbo.partner_profiles pp ON pp.partner_id=p.partner_id
    JOIN dbo.users u ON u.user_id=r.user_id LEFT JOIN dbo.partner_review_replies rr ON rr.review_id=r.review_id AND rr.partner_id=p.partner_id
    WHERE pp.user_id=@userId AND r.status='APPROVED' AND (@rating IS NULL OR r.rating=@rating)
    ORDER BY r.created_at DESC,r.review_id DESC`);
  return result.recordset.map((r) => ({
    id: String(r.review_id),
    placeId: String(r.place_id),
    placeName: r.place_name,
    customerName: r.full_name,
    rating: r.rating,
    comment: r.comment ?? "",
    createdAt: r.created_at,
    ...(r.reply_text
      ? { reply: { content: r.reply_text, createdAt: r.replied_at } }
      : {}),
  }));
}
export async function saveReply(
  reviewId: number,
  partnerId: number,
  text: string,
) {
  const result = await getPool()
    .request()
    .input("reviewId", sql.Int, reviewId)
    .input("partnerId", sql.Int, partnerId)
    .input("text", sql.NVarChar(800), text).query(`
    MERGE dbo.partner_review_replies WITH (HOLDLOCK) AS t USING (SELECT r.review_id FROM dbo.reviews r JOIN dbo.places p ON p.place_id=r.place_id JOIN dbo.partner_profiles pp ON pp.partner_id=p.partner_id WHERE r.review_id=@reviewId AND p.partner_id=@partnerId AND pp.approval_status='APPROVED' AND r.status='APPROVED') AS s ON t.review_id=s.review_id
    WHEN MATCHED THEN UPDATE SET reply_text=@text,partner_id=@partnerId,updated_at=SYSUTCDATETIME()
    WHEN NOT MATCHED THEN INSERT(review_id,partner_id,reply_text,updated_at) VALUES(@reviewId,@partnerId,@text,SYSUTCDATETIME()) OUTPUT inserted.review_id;`);
  return result.recordset.length > 0;
}
export async function moderationReviews(ids: number[]) {
  const req = getPool().request();
  const params = ids.map((id, i) => {
    req.input(`id${i}`, sql.Int, id);
    return `@id${i}`;
  });
  if (!params.length) return [];
  return (
    await req.query<{ review_id: number; rating: number; comment: string }>(
      `SELECT review_id,rating,COALESCE(comment,N'') AS comment FROM dbo.reviews WHERE review_id IN (${params.join(",")}) ORDER BY review_id`,
    )
  ).recordset;
}
export async function surveys() {
  return (
    await getPool().request().query<{
      survey_id: number;
      title: string;
      response_count: number;
    }>(`
    SELECT s.survey_id,s.title,(SELECT COUNT(*) FROM dbo.survey_responses sr WHERE sr.survey_id=s.survey_id AND sr.status='SUBMITTED') AS response_count
    FROM dbo.surveys s WHERE s.is_deleted=0 ORDER BY s.created_at DESC,s.survey_id DESC`)
  ).recordset;
}
export async function surveyAnswers(id: number) {
  const exists = await getPool()
    .request()
    .input("id", sql.Int, id)
    .query(
      `SELECT title FROM dbo.surveys WHERE survey_id=@id AND is_deleted=0`,
    );
  if (!exists.recordset.length) return null;
  const answers = await getPool().request().input("id", sql.Int, id).query<{
    answer_id: number;
    answer_text: string;
    content: string;
  }>(`
    SELECT TOP (100) a.answer_id,a.answer_text,q.content FROM dbo.survey_answers a JOIN dbo.survey_responses sr ON sr.response_id=a.response_id
    JOIN dbo.survey_questions q ON q.question_id=a.question_id
    WHERE sr.survey_id=@id AND q.survey_id=@id AND sr.status='SUBMITTED' AND q.question_type='TEXT' AND a.answer_number IS NULL AND NULLIF(LTRIM(RTRIM(a.answer_text)),N'') IS NOT NULL
    ORDER BY a.answer_id DESC`);
  const stats = await getPool().request().input("id", sql.Int, id).query(`
    SELECT (SELECT COUNT(*) FROM dbo.survey_responses WHERE survey_id=@id AND status='SUBMITTED') AS responses,
      COUNT(a.answer_score) AS rating_count,AVG(CAST(a.answer_score AS float)) AS average_score,
      (SELECT AVG(CAST(n.answer_number AS float)) FROM dbo.survey_answers n JOIN dbo.survey_responses nr ON nr.response_id=n.response_id JOIN dbo.survey_questions nq ON nq.question_id=n.question_id WHERE nr.survey_id=@id AND nr.status='SUBMITTED' AND nq.question_code='NPS_SCORE') AS nps_average,
      (SELECT COUNT(*) FROM dbo.survey_answers n JOIN dbo.survey_responses nr ON nr.response_id=n.response_id JOIN dbo.survey_questions nq ON nq.question_id=n.question_id WHERE nr.survey_id=@id AND nr.status='SUBMITTED' AND nq.question_code='NPS_SCORE' AND n.answer_number IS NOT NULL) AS nps_count
    FROM dbo.survey_answers a JOIN dbo.survey_responses sr ON sr.response_id=a.response_id
    WHERE sr.survey_id=@id AND sr.status='SUBMITTED'`);
  const choices = await getPool().request().input("id", sql.Int, id).query<{
    question: string;
    option: string;
    count: number;
  }>(`
    SELECT TOP(100) q.content AS question,o.option_text AS [option],COUNT(*) AS [count]
    FROM dbo.survey_answer_options ao JOIN dbo.survey_answers a ON a.answer_id=ao.answer_id
    JOIN dbo.survey_responses r ON r.response_id=a.response_id
    JOIN dbo.survey_questions q ON q.question_id=a.question_id
    JOIN dbo.survey_question_options o ON o.option_id=ao.option_id AND o.question_id=q.question_id
    WHERE r.survey_id=@id AND q.survey_id=@id AND r.status='SUBMITTED'
    GROUP BY q.question_id,q.content,o.option_id,o.option_text ORDER BY q.question_id,COUNT(*) DESC,o.option_id`);
  return {
    choiceStats: choices.recordset,
    title: exists.recordset[0].title as string,
    answers: answers.recordset,
    stats: stats.recordset[0],
  };
}
export async function embeddingPlaces() {
  return (
    await getPool().request().query<{
      place_id: number;
      name: string;
      description: string | null;
      place_type: string;
      district_id: number | null;
    }>(`
    SELECT place_id,name,description,place_type,district_id FROM dbo.places WHERE status='ACTIVE' ORDER BY place_id`)
  ).recordset;
}
export async function vectors() {
  return (
    await getPool().request().query<{
      place_id: number;
      content_hash: string;
      model: string;
      embedding_json: string;
    }>(`
    SELECT v.place_id,v.content_hash,v.model,v.embedding_json FROM dbo.ai_place_vectors v JOIN dbo.places p ON p.place_id=v.place_id WHERE p.status='ACTIVE'`)
  ).recordset;
}
export async function saveVector(
  id: number,
  hash: string,
  model: string,
  values: number[],
) {
  await getPool()
    .request()
    .input("id", sql.Int, id)
    .input("hash", sql.VarChar(64), hash)
    .input("model", sql.NVarChar(100), model)
    .input("vector", sql.NVarChar(sql.MAX), JSON.stringify(values)).query(`
    MERGE dbo.ai_place_vectors WITH (HOLDLOCK) t USING (SELECT @id AS place_id) s ON t.place_id=s.place_id
    WHEN MATCHED THEN UPDATE SET content_hash=@hash,model=@model,embedding_json=@vector,updated_at=SYSUTCDATETIME()
    WHEN NOT MATCHED THEN INSERT(place_id,content_hash,model,embedding_json,updated_at) VALUES(@id,@hash,@model,@vector,SYSUTCDATETIME());`);
}
