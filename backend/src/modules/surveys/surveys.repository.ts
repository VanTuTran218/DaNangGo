import { randomUUID, createHash } from "node:crypto";
import { getPool, sql } from "../../config/db";
import { anonymize } from "../ai/ai.rules";
import { SURVEY_CATALOG } from "./surveys.catalog";
import {
  SurveyError,
  validateAnswers,
  type StoredQuestion,
  type Submission,
} from "./surveys.validation";

export async function seedSurveyCatalog() {
  const tx = new sql.Transaction(getPool());
  await tx.begin();
  try {
    for (const [type, questions] of Object.entries(SURVEY_CATALOG)) {
      const existing = await new sql.Request(tx)
        .input("code", sql.VarChar(80), `${type}_V1`)
        .query(
          "SELECT survey_id FROM dbo.surveys WITH(UPDLOCK,HOLDLOCK) WHERE survey_code=@code",
        );
      if (existing.recordset.length) continue;
      const created = await new sql.Request(tx)
        .input("code", sql.VarChar(80), `${type}_V1`)
        .input(
          "title",
          sql.NVarChar(200),
          type === "FULL"
            ? "Khảo sát trải nghiệm du lịch Đà Nẵng"
            : "Khảo sát nhanh trải nghiệm Đà Nẵng",
        )
        .query(
          "INSERT INTO dbo.surveys(title,description,target_role,status,created_by,created_at,survey_code) OUTPUT INSERTED.survey_id VALUES(@title,N'Bộ câu hỏi chính thức của biểu mẫu DaNangGo. Không chứa phản hồi mẫu.','ALL','OPEN',NULL,SYSUTCDATETIME(),@code)",
        );
      const id = created.recordset[0].survey_id;
      for (const [index, q] of questions.entries()) {
        const result = await new sql.Request(tx)
          .input("id", sql.Int, id)
          .input("code", sql.VarChar(80), q.code)
          .input("content", sql.NVarChar(500), q.content)
          .input("type", sql.VarChar(20), q.kind === "NUMBER" ? "TEXT" : q.kind)
          .input("kind", sql.VarChar(20), q.kind)
          .input("required", sql.Bit, q.required)
          .input("order", sql.TinyInt, index + 1)
          .input("max", sql.TinyInt, q.maxChoices)
          .input("minNumber", sql.Decimal(18, 2), q.minimum ?? null)
          .input("maxNumber", sql.Decimal(18, 2), q.maximum ?? null)
          .query(
            "INSERT INTO dbo.survey_questions(survey_id,question_code,content,question_type,answer_kind,is_required,sort_order,max_choices,min_number,max_number) OUTPUT INSERTED.question_id VALUES(@id,@code,@content,@type,@kind,@required,@order,@max,@minNumber,@maxNumber)",
          );
        for (const [oi, o] of (q.options ?? []).entries())
          await new sql.Request(tx)
            .input("id", sql.Int, result.recordset[0].question_id)
            .input("code", sql.VarChar(80), o.code)
            .input("text", sql.NVarChar(200), o.label)
            .input("order", sql.TinyInt, oi + 1)
            .query(
              "INSERT INTO dbo.survey_question_options(question_id,option_code,option_text,sort_order) VALUES(@id,@code,@text,@order)",
            );
      }
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}
export interface StoredSurvey {
  survey_id: number;
  title: string;
  description: string | null;
  status: string;
  survey_code: string | null;
  expires_at: Date | null;
  target_role: string;
  questions: StoredQuestion[];
}
export async function getSurvey(
  id: number,
  tx?: sql.Transaction,
): Promise<StoredSurvey> {
  const request = () => (tx ? new sql.Request(tx) : getPool().request());
  const result = await request()
    .input("id", sql.Int, id)
    .query(
      "SELECT survey_id,title,description,status,survey_code,expires_at,target_role FROM dbo.surveys " +
        (tx ? "WITH(UPDLOCK,HOLDLOCK) " : "") +
        "WHERE survey_id=@id AND is_deleted=0",
    );
  const survey = result.recordset[0];
  if (!survey) throw new SurveyError(404, "Không tìm thấy khảo sát.");
  const qr = await request()
    .input("id", sql.Int, id)
    .query(
      "SELECT question_id,question_code,content,COALESCE(answer_kind,question_type) AS kind,is_required,max_choices,min_number,max_number FROM dbo.survey_questions WHERE survey_id=@id ORDER BY sort_order,question_id",
    );
  const options = await request()
    .input("id", sql.Int, id)
    .query(
      "SELECT o.* FROM dbo.survey_question_options o JOIN dbo.survey_questions q ON q.question_id=o.question_id WHERE q.survey_id=@id ORDER BY o.sort_order,o.option_id",
    );
  const questions: StoredQuestion[] = qr.recordset.map((q) => ({
    question_id: q.question_id,
    code: q.question_code ?? `Q_${q.question_id}`,
    content: q.content,
    kind: q.kind,
    required: !!q.is_required,
    maxChoices: q.max_choices,
    minimum: q.min_number == null ? null : Number(q.min_number),
    maximum: q.max_number == null ? null : Number(q.max_number),
    options: options.recordset
      .filter((o) => o.question_id === q.question_id)
      .map((o) => ({
        id: o.option_id,
        code: o.option_code ?? String(o.option_id),
        label: o.option_text,
      })),
  }));
  return { ...survey, questions };
}
export async function publicSurvey(id: number) {
  const survey = await getSurvey(id);
  assertOpen(survey);
  if (survey.survey_code)
    throw new SurveyError(
      400,
      "Bạn mở biểu mẫu khảo sát chính tại /khao-sat để trả lời bộ câu hỏi này.",
    );
  return {
    id: survey.survey_id,
    title: survey.title,
    description: survey.description,
    questions: survey.questions.map((q) => ({
      code: q.code,
      question: q.content,
      type: q.kind,
      required: q.required,
    })),
  };
}
function assertOpen(s: {
  status: string;
  expires_at: Date | null;
  target_role: string;
}) {
  if (
    s.status !== "OPEN" ||
    (s.expires_at && new Date(s.expires_at).getTime() < Date.now()) ||
    !["ALL", "USER"].includes(s.target_role)
  )
    throw new SurveyError(
      409,
      "Khảo sát đã đóng hoặc không dành cho khách du lịch.",
    );
}
export async function publicList() {
  return (
    await getPool()
      .request()
      .query(
        "SELECT TOP(100) survey_id AS id,title,description FROM dbo.surveys WHERE is_deleted=0 AND survey_code IS NULL AND status='OPEN' AND target_role IN('ALL','USER') AND (expires_at IS NULL OR expires_at>SYSUTCDATETIME()) ORDER BY created_at DESC,survey_id DESC",
      )
  ).recordset;
}
export async function submitSurvey(input: Submission) {
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        type: input.survey_type,
        id: input.survey_id,
        answers: [...input.answers].sort((a, b) =>
          a.question_code.localeCompare(b.question_code),
        ),
      }),
    )
    .digest("hex");
  const tx = new sql.Transaction(getPool());
  await tx.begin();
  try {
    const old = await new sql.Request(tx)
      .input("key", sql.UniqueIdentifier, input.metadata.request_id)
      .query(
        "SELECT response_id,survey_id,payload_hash FROM dbo.survey_responses WITH(UPDLOCK,HOLDLOCK) WHERE request_id=@key",
      );
    if (old.recordset.length) {
      const previous = old.recordset[0];
      if (previous.payload_hash !== hash)
        throw new SurveyError(
          409,
          "Mã gửi này đã dùng cho dữ liệu khác. Vui lòng tải lại biểu mẫu.",
        );
      await tx.commit();
      return {
        responseId: previous.response_id,
        surveyId: previous.survey_id,
        duplicate: true,
      };
    }
    let id = input.survey_id;
    if (input.survey_type !== "CUSTOM") {
      const found = await new sql.Request(tx)
        .input("code", sql.VarChar(80), `${input.survey_type}_V1`)
        .query(
          "SELECT survey_id FROM dbo.surveys WHERE survey_code=@code AND is_deleted=0",
        );
      id = found.recordset[0]?.survey_id;
    }
    if (!id) throw new SurveyError(404, "Chưa có biểu mẫu khảo sát tương ứng.");
    const survey = await getSurvey(id, tx);
    assertOpen(survey);
    if (input.survey_type === "CUSTOM" && survey.survey_code)
      throw new SurveyError(400, "Sai loại biểu mẫu.");
    const answers = validateAnswers(input, survey.questions);
    // Anonymous statistical feedback: never trust/persist a client-supplied user or itinerary identity.
    const response = await new sql.Request(tx)
      .input("id", sql.Int, id)
      .input("key", sql.UniqueIdentifier, input.metadata.request_id)
      .input("hash", sql.VarChar(64), hash)
      .query(
        "INSERT INTO dbo.survey_responses(survey_id,user_id,place_id,itinerary_id,status,sent_at,submitted_at,request_id,payload_hash,consent_agreed) OUTPUT INSERTED.response_id VALUES(@id,NULL,NULL,NULL,'SUBMITTED',SYSUTCDATETIME(),SYSUTCDATETIME(),@key,@hash,1)",
      );
    const responseId = response.recordset[0].response_id;
    for (const a of answers) {
      const saved = await new sql.Request(tx)
        .input("response", sql.Int, responseId)
        .input("question", sql.Int, a.question.question_id)
        .input("score", sql.TinyInt, a.score)
        .input("number", sql.Decimal(18, 2), a.number)
        .input("text", sql.NVarChar(1000), a.text)
        .input(
          "option",
          sql.Int,
          a.options.length === 1 ? a.options[0]!.id : null,
        )
        .query(
          "INSERT INTO dbo.survey_answers(response_id,question_id,answer_score,answer_number,answer_text,option_id) OUTPUT INSERTED.answer_id VALUES(@response,@question,@score,@number,@text,@option)",
        );
      for (const o of a.options)
        await new sql.Request(tx)
          .input("answer", sql.Int, saved.recordset[0].answer_id)
          .input("option", sql.Int, o.id)
          .query(
            "INSERT INTO dbo.survey_answer_options(answer_id,option_id) VALUES(@answer,@option)",
          );
    }
    await tx.commit();
    return { responseId, surveyId: id, duplicate: false };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}
export async function adminList() {
  const surveys = (
    await getPool()
      .request()
      .query(
        "SELECT TOP(100) survey_id,title,description,status,survey_code,created_at,(SELECT COUNT(*) FROM dbo.survey_responses r WHERE r.survey_id=s.survey_id AND r.status='SUBMITTED') AS response_count FROM dbo.surveys s WHERE is_deleted=0 ORDER BY created_at DESC,survey_id DESC",
      )
  ).recordset;
  return Promise.all(
    surveys.map(async (s) => {
      const detail = await getSurvey(s.survey_id);
      const stats = (
        await getPool()
          .request()
          .input("id", sql.Int, s.survey_id)
          .query(
            "SELECT a.question_id,COUNT(*) AS total,AVG(CAST(a.answer_score AS float)) AS average,AVG(CAST(a.answer_number AS float)) AS numeric_average FROM dbo.survey_answers a JOIN dbo.survey_responses r ON r.response_id=a.response_id WHERE r.survey_id=@id AND r.status='SUBMITTED' GROUP BY a.question_id",
          )
      ).recordset;
      const samples = (
        await getPool()
          .request()
          .input("id", sql.Int, s.survey_id)
          .query(
            "SELECT TOP(100) a.question_id,a.answer_text FROM dbo.survey_answers a JOIN dbo.survey_responses r ON r.response_id=a.response_id JOIN dbo.survey_questions q ON q.question_id=a.question_id WHERE r.survey_id=@id AND r.status='SUBMITTED' AND q.question_type='TEXT' AND a.answer_number IS NULL AND a.answer_text IS NOT NULL ORDER BY a.answer_id DESC",
          )
      ).recordset;
      return {
        id: String(s.survey_id),
        title: s.title,
        description: s.description ?? "",
        isActive: s.status === "OPEN",
        isSystem: !!s.survey_code,
        responseCount: s.response_count,
        createdAt: s.created_at,
        questions: detail.questions.map((q) => ({
          id: q.code,
          question: q.content,
          type: q.kind === "RATING" ? "STAR" : q.kind,
        })),
        summaries: detail.questions.map((q) => {
          const stat = stats.find((x) => x.question_id === q.question_id);
          return {
            questionId: q.code,
            totalAnswers: stat?.total ?? 0,
            ...(stat?.average != null
              ? { averageStar: Number(stat.average.toFixed(2)) }
              : {}),
            ...(stat?.numeric_average != null
              ? { numericAverage: Number(stat.numeric_average.toFixed(2)) }
              : {}),
            sampleResponses: samples
              .filter((a) => a.question_id === q.question_id)
              .slice(0, 5)
              .map((a) => anonymize(a.answer_text)),
          };
        }),
      };
    }),
  );
}
export async function saveAdminSurvey(
  body: {
    title?: string;
    description?: string;
    isActive?: boolean;
    questions?: { id: string; question: string; type: string }[];
  },
  userId: number,
  id?: number,
) {
  const tx = new sql.Transaction(getPool());
  await tx.begin();
  try {
    let surveyId = id;
    if (id) {
      const old = await getSurvey(id, tx);
      const changed =
        body.questions &&
        JSON.stringify(
          body.questions.map((q) => [q.id, q.question, q.type]),
        ) !==
          JSON.stringify(
            old.questions.map((q) => [
              q.code,
              q.content,
              q.kind === "RATING" ? "STAR" : q.kind,
            ]),
          );
      if (changed) {
        if (old.survey_code)
          throw new SurveyError(
            409,
            "Bộ câu hỏi hệ thống phải khớp biểu mẫu người dùng; hãy tạo khảo sát riêng để đổi câu hỏi.",
          );
        const exists = await new sql.Request(tx)
          .input("id", sql.Int, id)
          .query(
            "SELECT TOP(1) response_id FROM dbo.survey_responses WHERE survey_id=@id",
          );
        if (exists.recordset.length)
          throw new SurveyError(
            409,
            "Khảo sát đã có phản hồi. Hãy tạo khảo sát mới để giữ nguyên dữ liệu cũ.",
          );
        await new sql.Request(tx)
          .input("id", sql.Int, id)
          .query(
            "DELETE o FROM dbo.survey_question_options o JOIN dbo.survey_questions q ON q.question_id=o.question_id WHERE q.survey_id=@id; DELETE FROM dbo.survey_questions WHERE survey_id=@id",
          );
      }
      await new sql.Request(tx)
        .input("id", sql.Int, id)
        .input("title", sql.NVarChar(200), body.title ?? old.title)
        .input(
          "description",
          sql.NVarChar(500),
          body.description ?? old.description,
        )
        .input(
          "status",
          sql.VarChar(20),
          body.isActive === undefined
            ? old.status
            : body.isActive
              ? "OPEN"
              : "CLOSED",
        )
        .query(
          "UPDATE dbo.surveys SET title=@title,description=@description,status=@status WHERE survey_id=@id",
        );
      if (!changed) {
        await tx.commit();
        return id;
      }
    } else {
      if (!body.title || !body.questions?.length)
        throw new SurveyError(400, "Cần tiêu đề và ít nhất một câu hỏi.");
      const r = await new sql.Request(tx)
        .input("title", sql.NVarChar(200), body.title)
        .input("desc", sql.NVarChar(500), body.description ?? "")
        .input("userId", sql.Int, userId)
        .input(
          "status",
          sql.VarChar(20),
          body.isActive === false ? "CLOSED" : "OPEN",
        )
        .query(
          "INSERT INTO dbo.surveys(title,description,target_role,status,created_by,created_at) OUTPUT INSERTED.survey_id VALUES(@title,@desc,'ALL',@status,@userId,SYSUTCDATETIME())",
        );
      surveyId = r.recordset[0].survey_id;
    }
    for (const [i, q] of (body.questions ?? []).entries()) {
      if (!["STAR", "TEXT"].includes(q.type))
        throw new SurveyError(
          400,
          "Khảo sát riêng hỗ trợ câu hỏi sao và văn bản.",
        );
      await new sql.Request(tx)
        .input("id", sql.Int, surveyId!)
        .input("code", sql.VarChar(80), `Q_${randomUUID()}`)
        .input("content", sql.NVarChar(500), q.question)
        .input("type", sql.VarChar(20), q.type === "STAR" ? "RATING" : "TEXT")
        .input("order", sql.TinyInt, i + 1)
        .query(
          "INSERT INTO dbo.survey_questions(survey_id,question_code,content,question_type,answer_kind,is_required,sort_order) VALUES(@id,@code,@content,@type,@type,1,@order)",
        );
    }
    await tx.commit();
    return surveyId!;
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}
export async function archiveSurvey(id: number) {
  const detail = await getSurvey(id);
  if (detail.survey_code)
    throw new SurveyError(409, "Hãy đóng khảo sát hệ thống thay vì xóa.");
  await getPool()
    .request()
    .input("id", sql.Int, id)
    .query(
      "UPDATE dbo.surveys SET is_deleted=1,status='CLOSED' WHERE survey_id=@id",
    );
}
