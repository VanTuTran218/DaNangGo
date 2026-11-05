/** SQL integration test: all synthetic identities/content stay uncommitted and are rolled back. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connectDB, closeDB, getPool, sql } from "../config/db";
import { feedbackReadiness } from "../modules/ai/ai.feedback-readiness";
import {
  reviewSummary,
  replyDraft,
  moderation,
  surveyReport,
} from "../modules/ai/ai.service";

async function main() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Không chạy dữ liệu kiểm thử trên production.");
  await connectDB();
  process.env.GEMINI_API_KEY = "";
  const pool = getPool(),
    before = await feedbackReadiness(),
    request = pool.request;
  const tx = new sql.Transaction(pool);
  await tx.begin();
  // Route repository reads to this transaction in this dedicated test process only.
  pool.request = (() => new sql.Request(tx)) as typeof pool.request;
  const tag = randomUUID();
  try {
    const users: number[] = [];
    for (let i = 0; i < 8; i++) {
      const role = i === 0 ? "PARTNER" : "USER";
      const user = await pool
        .request()
        .input("role", sql.VarChar(20), role)
        .input("email", sql.VarChar(150), `test-${tag}-${i}@example.invalid`)
        .input("public", sql.NVarChar(30), `TEST-${tag.slice(0, 8)}-${i}`)
        .query(
          "INSERT INTO dbo.users(role_id,public_id,full_name,email,password_hash,status) OUTPUT INSERTED.user_id SELECT role_id,@public,N'KIỂM THỬ TẠM — ROLLBACK',@email,'not-a-valid-login-hash','LOCKED' FROM dbo.roles WHERE UPPER(role_name)=@role",
        );
      assert.equal(user.recordset.length, 1);
      users.push(user.recordset[0].user_id);
    }
    const partner = await pool
      .request()
      .input("u", sql.Int, users[0])
      .query(
        "INSERT INTO dbo.partner_profiles(user_id,business_name,approval_status) OUTPUT INSERTED.partner_id VALUES(@u,N'ĐỐI TÁC KIỂM THỬ ROLLBACK','APPROVED')",
      );
    const property = await pool
      .request()
      .input("p", sql.Int, partner.recordset[0].partner_id)
      .query(
        "INSERT INTO dbo.places(place_type,name,partner_id,status) OUTPUT INSERTED.place_id VALUES('ATTRACTION',N'ĐỊA ĐIỂM KIỂM THỬ ROLLBACK',@p,'ACTIVE')",
      );
    const placeId = property.recordset[0].place_id as number,
      ids: number[] = [];
    for (let i = 0; i < 5; i++) {
      const review = await pool
        .request()
        .input("p", sql.Int, placeId)
        .input("u", sql.Int, users[i + 1])
        .input("rating", sql.TinyInt, [5, 4, 3, 2, 1][i])
        .input(
          "comment",
          sql.NVarChar(1000),
          i < 2
            ? "KIỂM THỬ TẠM: phục vụ tốt, giá hợp lý."
            : "KIỂM THỬ TẠM: phục vụ chậm, giá cao.",
        )
        .query(
          "INSERT INTO dbo.reviews(place_id,user_id,rating,comment,status,created_at) OUTPUT INSERTED.review_id VALUES(@p,@u,@rating,@comment,'APPROVED',SYSUTCDATETIME())",
        );
      ids.push(review.recordset[0].review_id);
      if (i === 3) {
        assert.equal((await reviewSummary(placeId)).mode, "insufficient");
        assert.equal(
          (await feedbackReadiness()).counts.summaryReadyPlaces,
          before.counts.summaryReadyPlaces,
        );
      }
    }
    const summary = await reviewSummary(placeId);
    assert.equal(summary.sampleCount, 5);
    assert.deepEqual(summary.sentiment, {
      positive: 2,
      neutral: 1,
      negative: 2,
    });
    assert.ok(summary.strengths.length);
    assert.ok(summary.weaknesses.length);
    console.log(
      "PASS 1: Dưới 5 đánh giá vẫn báo thiếu; đủ 5 đã duyệt tổng hợp đúng 2 tích cực / 1 trung lập / 2 chưa hài lòng.",
    );
    const draft = await replyDraft(ids[0]!, users[0]!);
    assert.ok(draft.draft);
    assert.match(draft.notice, /chưa được gửi/);
    await assert.rejects(replyDraft(ids[0]!, users[7]!));
    const pending = await pool
      .request()
      .input("p", sql.Int, placeId)
      .input("u", sql.Int, users[6])
      .query(
        "INSERT INTO dbo.reviews(place_id,user_id,rating,comment,status,created_at) OUTPUT INSERTED.review_id VALUES(@p,@u,1,N'KIỂM THỬ TẠM: liên hệ 0901234567 để quảng cáo','PENDING',SYSUTCDATETIME())",
      );
    const pendingId = pending.recordset[0].review_id as number;
    const scan = await moderation([pendingId]);
    assert.equal(scan.analyzedCount, 1);
    const unchanged = await pool
      .request()
      .input("id", sql.Int, pendingId)
      .input("place", sql.Int, placeId)
      .query(
        "SELECT status FROM dbo.reviews WHERE review_id=@id; SELECT COUNT(*) AS n FROM dbo.partner_review_replies WHERE review_id IN (SELECT review_id FROM dbo.reviews WHERE place_id=@place)",
      );
    const states = unchanged.recordsets as sql.IRecordSet<any>[];
    assert.equal(states[0]![0].status, "PENDING");
    assert.equal(states[1]![0].n, 0);
    console.log(
      "PASS 2: Nháp phản hồi đúng quyền, không tự gửi; kiểm duyệt không tự đổi trạng thái.",
    );
    const survey = await pool
      .request()
      .query(
        "INSERT INTO dbo.surveys(title,target_role,status,created_by,created_at) OUTPUT INSERTED.survey_id VALUES(N'KHẢO SÁT KIỂM THỬ ROLLBACK','ALL','OPEN',NULL,SYSUTCDATETIME())",
      );
    const surveyId = survey.recordset[0].survey_id as number;
    const question = await pool
      .request()
      .input("s", sql.Int, surveyId)
      .query(
        "INSERT INTO dbo.survey_questions(survey_id,content,question_type,is_required,sort_order) OUTPUT INSERTED.question_id VALUES(@s,N'Góp ý kiểm thử','TEXT',0,1)",
      );
    const q = question.recordset[0].question_id;
    assert.equal((await surveyReport(surveyId)).mode, "insufficient");
    for (const status of ["SUBMITTED", "SENT"]) {
      const response = await pool
        .request()
        .input("s", sql.Int, surveyId)
        .input("status", sql.VarChar(10), status)
        .query(
          "INSERT INTO dbo.survey_responses(survey_id,user_id,status,consent_agreed,submitted_at) OUTPUT INSERTED.response_id VALUES(@s,NULL,@status,1,CASE WHEN @status='SUBMITTED' THEN SYSUTCDATETIME() ELSE NULL END)",
        );
      await pool
        .request()
        .input("r", sql.Int, response.recordset[0].response_id)
        .input("q", sql.Int, q)
        .query(
          "INSERT INTO dbo.survey_answers(response_id,question_id,answer_text) VALUES(@r,@q,N'KIỂM THỬ TẠM: phục vụ chậm, giá cao.')",
        );
    }
    const report = await surveyReport(surveyId);
    assert.equal(report.stats.responses, 1);
    assert.equal(report.sampleCount, 1);
    assert.ok(report.themes.length);
    const readiness = await feedbackReadiness();
    assert.ok(readiness.features.every((feature) => feature.ready));
    assert.equal(
      readiness.surveys.find((s) => s.id === surveyId)?.submitted,
      1,
    );
    assert.equal(
      readiness.surveys.find((s) => s.id === surveyId)?.textAnswers,
      1,
    );
    await pool
      .request()
      .input("id", sql.Int, surveyId)
      .query(
        "UPDATE dbo.surveys SET expires_at=DATEADD(day,-1,SYSUTCDATETIME()) WHERE survey_id=@id",
      );
    assert.equal(
      (await feedbackReadiness()).surveys.find((s) => s.id === surveyId)
        ?.canCollect,
      false,
    );
    console.log(
      "PASS 3: Chỉ phiếu SUBMITTED được phân tích; khảo sát hết hạn không được mời trả lời.",
    );
    await pool
      .request()
      .input("id", sql.Int, placeId)
      .query("UPDATE dbo.places SET status='HIDDEN' WHERE place_id=@id");
    assert.equal(
      (await feedbackReadiness()).counts.summaryReadyPlaces,
      before.counts.summaryReadyPlaces,
    );
    console.log(
      "PASS 4: Địa điểm ẩn không làm tăng số nơi đủ dữ liệu công khai.",
    );
  } finally {
    pool.request = request;
    await tx.rollback();
  }
  const after = await feedbackReadiness();
  assert.deepEqual(after.counts, before.counts);
  assert.deepEqual(after.surveys, before.surveys);
  assert.deepEqual(after.places, before.places);
  console.log(
    "PASS 5: Rollback toàn bộ; số phiếu, đánh giá, địa điểm và khảo sát trước/sau không thay đổi.",
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDB);
