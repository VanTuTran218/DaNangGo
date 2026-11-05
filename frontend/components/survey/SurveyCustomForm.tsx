"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest, apiPost } from "@/lib/api/client";
import { getSurveyRequestId, clearSurveyRequestId } from "@/lib/api/surveys";
import RatingStars from "./RatingStars";
import ConsentCheckbox from "./ConsentCheckbox";
interface Survey {
  id: number;
  title: string;
  description: string;
  questions: {
    code: string;
    question: string;
    type: "RATING" | "TEXT";
    required: boolean;
  }[];
}
export function SurveyPublicList() {
  const [rows, setRows] = useState<{ id: number; title: string }[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<typeof rows>("/api/surveys", { signal: controller.signal })
      .then((r) => setRows(r.data ?? []))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  if (!rows.length) return null;
  return (
    <section className="mb-6 rounded-2xl border border-teal-100 bg-white p-5">
      <h2 className="font-bold text-slate-800">Các khảo sát đang mở</h2>
      <div className="flex flex-wrap gap-3 mt-3">
        {rows.map((s) => (
          <Link
            key={s.id}
            href={`/khao-sat?surveyId=${s.id}`}
            className="rounded-xl bg-teal-50 text-teal-700 px-4 py-2 text-sm"
          >
            {s.title} →
          </Link>
        ))}
      </div>
    </section>
  );
}
export default function SurveyCustomForm({ id }: { id: number }) {
  const [survey, setSurvey] = useState<Survey>(),
    [error, setError] = useState(""),
    [answers, setAnswers] = useState<Record<string, string | number>>({}),
    [consent, setConsent] = useState(false),
    [pending, setPending] = useState(false),
    [done, setDone] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setSurvey(undefined);
    setAnswers({});
    setDone(false);
    setConsent(false);
    apiRequest<Survey>(`/api/surveys/${id}`, { signal: controller.signal })
      .then((r) => setSurvey(r.data))
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Không tải được khảo sát.");
      });
    return () => controller.abort();
  }, [id]);
  return (
    <main className="min-h-screen bg-slate-50 px-5 pt-28 pb-16">
      <section className="mx-auto max-w-2xl bg-white rounded-3xl border border-teal-100 shadow-sm p-6 sm:p-9">
        <Link href="/khao-sat" className="text-sm text-teal-700">
          ← Khảo sát du lịch
        </Link>
        <h1 className="font-bold text-2xl text-slate-900 mt-5">
          {survey?.title ?? "Khảo sát"}
        </h1>
        {survey && (
          <p className="text-sm text-slate-600 mt-2">{survey.description}</p>
        )}
        {done ? (
          <div
            role="status"
            className="mt-8 rounded-2xl bg-teal-50 p-6 text-teal-800"
          >
            Đã lưu phản hồi của bạn. Cảm ơn bạn đã đóng góp!
          </div>
        ) : survey ? (
          <form
            className="space-y-7 mt-8"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!consent) {
                setError("Bạn cần đồng ý chia sẻ dữ liệu để gửi khảo sát.");
                return;
              }
              if (
                survey.questions.some((q) => q.required && !answers[q.code])
              ) {
                setError("Vui lòng trả lời đầy đủ các câu hỏi bắt buộc.");
                return;
              }
              setPending(true);
              setError("");
              try {
                const result = await apiPost<{ responseId: number }>(
                  "/api/surveys/respond",
                  {
                    survey_type: "CUSTOM",
                    survey_id: id,
                    answers: survey.questions
                      .filter((q) => answers[q.code])
                      .map((q) => ({
                        question_code: q.code,
                        ...(q.type === "RATING"
                          ? { answer_score: Number(answers[q.code]) }
                          : { answer_text: String(answers[q.code]) }),
                      })),
                    metadata: {
                      request_id: getSurveyRequestId(
                        "CUSTOM",
                        id,
                        JSON.stringify(answers),
                      ),
                      consent_agreed: consent,
                    },
                  },
                );
                if (!result.data?.responseId)
                  throw new Error("Máy chủ chưa xác nhận lưu phản hồi.");
                clearSurveyRequestId("CUSTOM", id);
                setDone(true);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Chưa gửi được phản hồi.",
                );
              } finally {
                setPending(false);
              }
            }}
          >
            {survey.questions.map((q, index) => (
              <fieldset key={q.code}>
                <legend className="font-semibold text-sm text-slate-800 mb-3">
                  {index + 1}. {q.question}
                  {q.required ? " *" : ""}
                </legend>
                {q.type === "RATING" ? (
                  <RatingStars
                    value={Number(answers[q.code] ?? 0)}
                    onChange={(v) => setAnswers((a) => ({ ...a, [q.code]: v }))}
                  />
                ) : (
                  <textarea
                    aria-label={q.question}
                    required={q.required}
                    maxLength={1000}
                    rows={4}
                    value={String(answers[q.code] ?? "")}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [q.code]: e.target.value }))
                    }
                    className="w-full border rounded-xl p-3 text-sm"
                  />
                )}
              </fieldset>
            ))}
            <ConsentCheckbox checked={consent} onChange={setConsent} />
            <button
              disabled={pending}
              type="submit"
              className="bg-teal-600 text-white rounded-xl px-6 py-3 font-semibold disabled:opacity-50"
            >
              {pending ? "Đang lưu…" : "Gửi khảo sát"}
            </button>
          </form>
        ) : (
          !error && (
            <p role="status" className="mt-6">
              Đang tải khảo sát…
            </p>
          )
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-700 mt-5">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
