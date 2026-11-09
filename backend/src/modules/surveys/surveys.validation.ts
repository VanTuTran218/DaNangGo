import { z } from "zod";
export class SurveyError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const submissionSchema = z
  .object({
    survey_type: z.enum(["FULL", "QUICK", "CUSTOM"]),
    survey_id: z.number().int().positive().optional(),
    itinerary_id: z.number().int().positive().max(2147483647).optional(),
    place_id: z.number().int().positive().optional(),
    answers: z
      .array(
        z
          .object({
            question_code: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
            answer_score: z.number().int().min(1).max(5).optional(),
            answer_number: z.number().finite().optional(),
            answer_text: z.string().trim().max(1000).optional(),
            option_codes: z.array(z.string().max(80)).max(80).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(40),
    metadata: z
      .object({
        request_id: z.string().uuid(),
        consent_agreed: z.literal(true),
        client_timestamp: z.string().max(50).optional(),
        user_agent: z.string().max(1000).optional(),
      })
      .strict(),
  })
  .strict();
export const adminSurveySchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
    questions: z
      .array(
        z
          .object({
            id: z.string().max(100),
            question: z.string().trim().min(3).max(500),
            type: z.enum(["STAR", "TEXT", "CHOICE", "NUMBER"]),
          })
          .strict(),
      )
      .min(1)
      .max(30)
      .optional(),
  })
  .strict();
export type Submission = z.infer<typeof submissionSchema>;
export interface StoredQuestion {
  question_id: number;
  code: string;
  content: string;
  kind: string;
  required: boolean;
  maxChoices: number;
  minimum: number | null;
  maximum: number | null;
  options: { id: number; code: string; label: string }[];
}
export function validateAnswers(
  input: Submission,
  questions: StoredQuestion[],
) {
  const seen = new Set<string>();
  const result = [];
  for (const a of input.answers) {
    if (seen.has(a.question_code))
      throw new SurveyError(400, "Không gửi trùng một câu hỏi.");
    seen.add(a.question_code);
    const q = questions.find((q) => q.code === a.question_code);
    if (!q) throw new SurveyError(400, "Câu hỏi không thuộc khảo sát.");
    const text = a.answer_text?.trim() ?? "",
      options = a.option_codes ?? [];
    if (q.kind === "RATING") {
      if (a.answer_score == null && text !== "CHUA_SU_DUNG")
        throw new SurveyError(400, `Vui lòng chấm điểm: ${q.content}`);
      if (q.required && a.answer_score == null)
        throw new SurveyError(400, `Câu hỏi bắt buộc: ${q.content}`);
      if (
        options.length ||
        a.answer_number != null ||
        (a.answer_score != null && text)
      )
        throw new SurveyError(400, "Dữ liệu điểm không hợp lệ.");
    } else if (q.kind === "NUMBER") {
      if (
        a.answer_number == null ||
        !Number.isInteger(a.answer_number) ||
        (q.minimum != null && a.answer_number < q.minimum) ||
        (q.maximum != null && a.answer_number > q.maximum) ||
        a.answer_score != null ||
        text ||
        options.length
      )
        throw new SurveyError(400, `Giá trị không hợp lệ: ${q.content}`);
    } else if (q.kind === "CHOICE") {
      if (
        text ||
        a.answer_score != null ||
        a.answer_number != null ||
        options.length > q.maxChoices ||
        new Set(options).size !== options.length ||
        options.some((c) => !q.options.some((o) => o.code === c)) ||
        (q.required && !options.length)
      )
        throw new SurveyError(400, `Lựa chọn không hợp lệ: ${q.content}`);
      if (options.includes("none") && options.length > 1)
        throw new SurveyError(
          400,
          "Không chọn “không gặp vấn đề” cùng vấn đề khác.",
        );
    } else if (
      a.answer_score != null ||
      a.answer_number != null ||
      options.length ||
      (q.required && !text)
    )
      throw new SurveyError(400, `Câu trả lời không hợp lệ: ${q.content}`);
    if (
      a.answer_score != null ||
      a.answer_number != null ||
      text ||
      options.length
    )
      result.push({
        question: q,
        score: a.answer_score ?? null,
        number: a.answer_number ?? null,
        text: text || null,
        options: options.map((c) => q.options.find((o) => o.code === c)!),
      });
  }
  for (const q of questions)
    if (q.required && !result.some((a) => a.question.code === q.code))
      throw new SurveyError(400, `Thiếu câu bắt buộc: ${q.content}`);
  if (
    input.survey_type === "FULL" &&
    !result.some((a) => a.question.code.startsWith("EXP_"))
  )
    throw new SurveyError(
      400,
      "Vui lòng đánh giá trải nghiệm hoặc chọn Chưa sử dụng.",
    );
  return result;
}
