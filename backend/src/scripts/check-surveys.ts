/** Integration check with temporary, explicitly marked responses, always cleaned up. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connectDB, closeDB, getPool, sql } from "../config/db";
import {
  submissionSchema,
  SurveyError,
} from "../modules/surveys/surveys.validation";
import {
  submitSurvey,
  saveAdminSurvey,
  getSurvey,
  publicSurvey,
  adminList,
} from "../modules/surveys/surveys.repository";
import { surveyReport } from "../modules/ai/ai.service";
const ids = [randomUUID(), randomUUID(), randomUUID()];
let customId: number | undefined;
async function main() {
  await connectDB();
  const key = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const pool = getPool();
    const full = submissionSchema.parse({
      survey_type: "FULL",
      answers: [
        { question_code: "TRIP_PURPOSE", option_codes: ["leisure"] },
        { question_code: "STAY_DURATION", option_codes: ["1-2"] },
        { question_code: "TRAVEL_COMPANION", option_codes: ["couple"] },
        { question_code: "ORIGIN_PROVINCE", option_codes: ["DA_NANG"] },
        { question_code: "VISIT_FREQUENCY", option_codes: ["first_time"] },
        { question_code: "DAILY_BUDGET", answer_number: 1500000 },
        { question_code: "TOP_EXPENSES", option_codes: ["stay", "food"] },
        { question_code: "OVERALL_SATISFACTION", answer_score: 4 },
        { question_code: "NPS_SCORE", answer_number: 0 },
        { question_code: "EXP_FOOD", answer_score: 3 },
        {
          question_code: "FEEDBACK_TEXT",
          answer_text: "DỮ LIỆU KIỂM THỬ TẠM: Giá cả hợp lý, phục vụ chậm.",
        },
      ],
      metadata: { request_id: ids[0], consent_agreed: true },
    });
    const first = await submitSurvey(full),
      again = await submitSurvey(full);
    assert.equal(first.responseId, again.responseId);
    assert.equal(again.duplicate, true);
    const duplicateCount = await pool
      .request()
      .input("id", sql.Int, first.responseId)
      .query(
        "SELECT user_id,itinerary_id,(SELECT COUNT(*) FROM dbo.survey_answers WHERE response_id=r.response_id) AS answers FROM dbo.survey_responses r WHERE response_id=@id",
      );
    assert.equal(duplicateCount.recordset[0].user_id, null);
    assert.equal(duplicateCount.recordset[0].itinerary_id, null);
    assert.equal(duplicateCount.recordset[0].answers, 11);
    const q = await pool
      .request()
      .input("id", sql.Int, first.responseId)
      .query(
        "SELECT a.answer_number,a.answer_score FROM dbo.survey_answers a JOIN dbo.survey_questions q ON q.question_id=a.question_id WHERE a.response_id=@id AND q.question_code='NPS_SCORE'",
      );
    assert.equal(q.recordset[0].answer_number, 0);
    assert.equal(q.recordset[0].answer_score, null);
    const choices = await pool
      .request()
      .input("id", sql.Int, first.responseId)
      .query(
        "SELECT COUNT(*) AS n FROM dbo.survey_answer_options ao JOIN dbo.survey_answers a ON a.answer_id=ao.answer_id JOIN dbo.survey_questions q ON q.question_id=a.question_id WHERE a.response_id=@id AND q.question_code='TOP_EXPENSES'",
      );
    assert.equal(choices.recordset[0].n, 2);
    await assert.rejects(
      submitSurvey({
        ...full,
        answers: full.answers.map((a) =>
          a.question_code === "NPS_SCORE" ? { ...a, answer_number: 1 } : a,
        ),
      }),
      (e) => e instanceof SurveyError && e.status === 409,
    );
    console.log(
      "Đạt: full survey lưu SQL, NPS=0 đúng thang, đa lựa chọn, ẩn danh, gửi lại không trùng.",
    );
    await submitSurvey(
      submissionSchema.parse({
        survey_type: "QUICK",
        answers: [
          { question_code: "OVERALL_SATISFACTION", answer_score: 5 },
          { question_code: "NPS_SCORE", answer_number: 10 },
          { question_code: "BEST_LIKES", option_codes: ["beach"] },
        ],
        metadata: { request_id: ids[1], consent_agreed: true },
      }),
    );
    console.log(
      "Đạt: quick survey lưu SQL và NPS=10 không vượt ràng buộc điểm sao /5.",
    );
    const admins = await pool
      .request()
      .query(
        "SELECT TOP(1) u.user_id FROM dbo.users u JOIN dbo.roles r ON r.role_id=u.role_id WHERE UPPER(r.role_name)='ADMIN' ORDER BY u.user_id",
      );
    assert.ok(
      admins.recordset[0],
      "Cần có tài khoản admin trong database để thử quản trị.",
    );
    const adminId = admins.recordset[0].user_id;
    customId = await saveAdminSurvey(
      {
        title: "KIỂM THỬ TẠM – KHÔNG PHẢN HỒI THẬT",
        description: "Tự dọn sau kiểm tra.",
        isActive: true,
        questions: [
          { id: "tmp1", question: "Mức hài lòng về phục vụ?", type: "STAR" },
          { id: "tmp2", question: "Điều cần cải thiện?", type: "TEXT" },
        ],
      },
      adminId,
    );
    const survey = await publicSurvey(customId);
    assert.equal(survey.questions.length, 2);
    await submitSurvey(
      submissionSchema.parse({
        survey_type: "CUSTOM",
        survey_id: customId,
        answers: [
          { question_code: survey.questions[0]!.code, answer_score: 2 },
          {
            question_code: survey.questions[1]!.code,
            answer_text: "KIỂM THỬ TẠM: Phục vụ chậm, giá cao.",
          },
        ],
        metadata: { request_id: ids[2], consent_agreed: true },
      }),
    );
    const report = await surveyReport(customId);
    assert.equal(report.stats.responses, 1);
    assert.equal(report.stats.average_score, 2);
    assert.equal(report.sampleCount, 1);
    assert.ok(report.themes.length);
    const listed = (await adminList()).find((s) => s.id === String(customId));
    assert.equal(listed?.responseCount, 1);
    assert.equal(listed?.summaries[0]?.averageStar, 2);
    await assert.rejects(
      saveAdminSurvey(
        {
          questions: [
            {
              id: "other",
              question: "Thay câu hỏi sau khi có phản hồi",
              type: "TEXT",
            },
          ],
        },
        adminId,
        customId,
      ),
      (e) => e instanceof SurveyError && e.status === 409,
    );
    await saveAdminSurvey({ isActive: false }, adminId, customId);
    await assert.rejects(
      publicSurvey(customId),
      (e) => e instanceof SurveyError && e.status === 409,
    );
    console.log(
      "Đạt: admin tạo khảo sát → user gửi → thống kê SQL → AI nhóm chủ đề. Chặn sửa cấu trúc sau phản hồi và gửi vào khảo sát đóng.",
    );
    const baseReport = await surveyReport(first.surveyId);
    assert.ok(baseReport.choiceStats.some((c) => c.option.includes("lưu trú")));
    console.log("Đạt: AI đọc thống kê lựa chọn và điểm từ dữ liệu đã gửi.");
  } finally {
    const pool = getPool(),
      tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const request = new sql.Request(tx);
      ids.forEach((id, i) =>
        request.input(`key${i}`, sql.UniqueIdentifier, id),
      );
      await request.query(
        `DELETE ao FROM dbo.survey_answer_options ao JOIN dbo.survey_answers a ON a.answer_id=ao.answer_id JOIN dbo.survey_responses r ON r.response_id=a.response_id WHERE r.request_id IN(@key0,@key1,@key2);DELETE a FROM dbo.survey_answers a JOIN dbo.survey_responses r ON r.response_id=a.response_id WHERE r.request_id IN(@key0,@key1,@key2);DELETE FROM dbo.survey_responses WHERE request_id IN(@key0,@key1,@key2);`,
      );
      if (customId)
        await new sql.Request(tx)
          .input("id", sql.Int, customId)
          .query(
            "DELETE o FROM dbo.survey_question_options o JOIN dbo.survey_questions q ON q.question_id=o.question_id WHERE q.survey_id=@id;DELETE FROM dbo.survey_questions WHERE survey_id=@id;DELETE FROM dbo.surveys WHERE survey_id=@id",
          );
      await tx.commit();
      console.log(
        "Đã dọn đúng các phản hồi và khảo sát tạm, giữ nguyên dữ liệu khác.",
      );
    } catch (e) {
      await tx.rollback();
      throw e;
    } finally {
      if (key == null) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = key;
      await closeDB();
    }
  }
}
main().catch((e) => {
  console.error(
    "Kiểm tra khảo sát thất bại:",
    e instanceof Error ? e.message : "unknown",
  );
  process.exitCode = 1;
});
