import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import {
  submissionSchema,
  validateAnswers,
  SurveyError,
  type StoredQuestion,
} from "../src/modules/surveys/surveys.validation";
import {
  surveysRouter,
  adminSurveysRouter,
} from "../src/modules/surveys/surveys.routes";
const questions: StoredQuestion[] = [
  {
    question_id: 1,
    code: "OVERALL",
    content: "Hài lòng",
    kind: "RATING",
    required: true,
    maxChoices: 1,
    minimum: null,
    maximum: null,
    options: [],
  },
  {
    question_id: 2,
    code: "NPS",
    content: "Giới thiệu",
    kind: "NUMBER",
    required: true,
    maxChoices: 1,
    minimum: 0,
    maximum: 10,
    options: [],
  },
  {
    question_id: 3,
    code: "ISSUES",
    content: "Vấn đề",
    kind: "CHOICE",
    required: false,
    maxChoices: 2,
    minimum: null,
    maximum: null,
    options: [
      { id: 1, code: "traffic", label: "Giao thông" },
      { id: 2, code: "pricing", label: "Giá" },
      { id: 3, code: "none", label: "Không có" },
    ],
  },
];
const input = () =>
  submissionSchema.parse({
    survey_type: "QUICK",
    answers: [
      { question_code: "OVERALL", answer_score: 4 },
      { question_code: "NPS", answer_number: 0 },
      { question_code: "ISSUES", option_codes: ["traffic", "pricing"] },
    ],
    metadata: { request_id: randomUUID(), consent_agreed: true },
  });
test("Khảo sát giữ NPS 0/10 riêng với sao /5; đa lựa chọn lưu đúng một câu trả lời", () => {
  const rows = validateAnswers(input(), questions);
  assert.equal(rows[1]!.number, 0);
  assert.equal(rows[1]!.score, null);
  assert.deepEqual(
    rows[2]!.options.map((x) => x.id),
    [1, 2],
  );
});
test("Không nhận giả userId, thiếu đồng ý, tọa độ danh tính hoặc điểm ngoài giới hạn", () => {
  const body = input();
  for (const b of [
    { ...body, userId: 1 },
    { ...body, metadata: { request_id: randomUUID(), consent_agreed: false } },
    { ...body, metadata: { consent_agreed: true } },
    { ...body, answers: [{ question_code: "OVERALL", answer_score: 6 }] },
  ])
    assert.equal(submissionSchema.safeParse(b).success, false);
});
test("Chặn câu hỏi lạ, trùng câu, thiếu bắt buộc, phương án giả/trùng và none kèm vấn đề", () => {
  for (const change of [
    () => [{ question_code: "FAKE", answer_score: 4 }],
    () => [...input().answers, input().answers[0]!],
    () => [input().answers[0]!],
    () => [
      ...input().answers.slice(0, 2),
      { question_code: "ISSUES", option_codes: ["FAKE"] },
    ],
    () => [
      ...input().answers.slice(0, 2),
      { question_code: "ISSUES", option_codes: ["none", "traffic"] },
    ],
    () => [
      ...input().answers.slice(0, 2),
      { question_code: "ISSUES", option_codes: ["traffic", "traffic"] },
    ],
    () => [
      { question_code: "OVERALL", answer_score: 4 },
      { question_code: "NPS", answer_number: 11 },
    ],
  ])
    assert.throws(
      () => validateAnswers({ ...input(), answers: change() }, questions),
      SurveyError,
    );
});
test("Chưa sử dụng không biến thành điểm 0 hoặc tự cho 4 sao", () => {
  const q = { ...questions[0]!, code: "EXP_FOOD", required: false };
  const rows = validateAnswers(
    {
      ...input(),
      survey_type: "FULL",
      answers: [{ question_code: "EXP_FOOD", answer_text: "CHUA_SU_DUNG" }],
    },
    [q],
  );
  assert.equal(rows[0]!.score, null);
  assert.equal(rows[0]!.text, "CHUA_SU_DUNG");
  assert.throws(
    () =>
      validateAnswers({ ...input(), survey_type: "FULL", answers: [] }, [q]),
    SurveyError,
  );
});
test("API kiểm tra schema trước khi đụng SQL; vùng admin cần đăng nhập", async () => {
  const app = express();
  app.use(express.json(), cookieParser());
  app.use("/public", surveysRouter);
  app.use("/admin", adminSurveysRouter);
  app.use((e: any, _req: any, res: any, _next: any) =>
    res.status(e.statusCode ?? 500).json({ message: e.message }),
  );
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal((await fetch(base + "/admin")).status, 401);
    for (const body of [
      { survey_type: "QUICK", answers: [] },
      { ...input(), survey_type: "FULL" },
      { ...input(), userId: 1 },
    ]) {
      const r = await fetch(base + "/public/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      assert.equal(r.status, 400);
    }
    assert.equal((await fetch(base + "/public/not-a-number")).status, 400);
  } finally {
    server.close();
    server.closeAllConnections();
  }
});
