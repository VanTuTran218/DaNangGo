"use client";
import { useEffect, useState } from "react";
import { useAiAction } from "@/hooks/useAiAction";
import {
  aiRequest,
  type SurveyListItem,
  type SurveyReport,
} from "@/lib/api/ai";
export default function AiSurveyReport() {
  const [selected, setSelected] = useState("");
  const action = useAiAction<SurveyReport>();
  const listing = useAiAction<SurveyListItem[]>();
  const surveys = listing.data ?? [];
  const load = () =>
    listing.run((signal) =>
      aiRequest<SurveyListItem[]>("/admin/surveys", undefined, signal),
    );
  useEffect(() => {
    listing.run((signal) =>
      aiRequest<SurveyListItem[]>("/admin/surveys", undefined, signal),
    );
  }, [listing.run]);
  return (
    <section className="space-y-3 rounded-2xl border border-teal-100 bg-teal-50/50 p-5">
      <h2 className="font-bold text-teal-900">
        Gô phân tích khảo sát từ database
      </h2>
      <p className="text-xs text-slate-600">
        Chỉ đọc phản hồi đã gửi. Thông tin liên hệ và tên riêng được ẩn trước
        khi phân tích.
      </p>
      {listing.error && (
        <p role="alert" className="text-xs text-red-700">
          {listing.error}
          <button type="button" className="ml-2 underline" onClick={load}>
            Tải lại
          </button>
        </p>
      )}
      <button
        type="button"
        onClick={load}
        disabled={listing.loading}
        className="text-xs text-teal-700 underline"
      >
        Tải lại danh sách khảo sát
      </button>
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Khảo sát để phân tích AI"
          className="max-w-full rounded-xl border bg-white p-2 text-sm"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            action.clear();
          }}
        >
          <option value="">Chọn khảo sát thật</option>
          {surveys.map((s) => (
            <option key={s.survey_id} value={s.survey_id}>
              {s.title} ({s.response_count} phản hồi)
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selected || action.loading}
          className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
          onClick={() =>
            action.run((signal) =>
              aiRequest<SurveyReport>(
                `/admin/surveys/${selected}/report`,
                undefined,
                signal,
              ),
            )
          }
        >
          {action.loading ? "Đang tổng hợp…" : "Phân tích phản hồi"}
        </button>
      </div>
      {listing.loading && (
        <p role="status" className="text-xs text-slate-500">
          Đang tải khảo sát…
        </p>
      )}
      {!surveys.length && !listing.loading && !listing.error && (
        <p className="text-xs text-slate-500">
          Chưa có khảo sát trong database để lựa chọn.
        </p>
      )}
      {action.error && (
        <p role="alert" className="text-xs text-red-700">
          {action.error}
        </p>
      )}
      {action.data && (
        <div className="space-y-3 text-sm">
          <h3 className="font-semibold">{action.data.title}</h3>
          <p>{action.data.overview}</p>
          <p className="text-xs">
            Đã gửi: {action.data.stats.responses} phiếu ·{" "}
            {action.data.stats.rating_count} câu trả lời chấm điểm · Điểm trung
            bình:{" "}
            {action.data.stats.average_score === null
              ? "Chưa có"
              : Number(action.data.stats.average_score).toFixed(2) + "/5"}
          </p>
          {!!action.data.stats.nps_count && (
            <p className="text-xs">
              Điểm giới thiệu trung bình:{" "}
              {Number(action.data.stats.nps_average).toFixed(2)}/10 (
              {action.data.stats.nps_count} lượt). Điểm này được tính riêng với
              mức hài lòng /5.
            </p>
          )}
          {action.data.mode === "fallback" && (
            <p className="text-xs text-amber-700">
              Đang nhóm chủ đề bằng quy tắc dự phòng.
            </p>
          )}
          {!!action.data.choiceStats?.length && (
            <details className="rounded-xl bg-white p-3">
              <summary className="cursor-pointer font-semibold">
                Thống kê các lựa chọn
              </summary>
              <ul className="space-y-2 mt-3 text-xs">
                {action.data.choiceStats.map((item, index) => (
                  <li key={index}>
                    {item.question}: <b>{item.option}</b> — {item.count} lượt
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {action.data.themes.map((theme, i) => (
              <div
                key={`${theme.name}-${i}`}
                className="rounded-xl bg-white p-3"
              >
                <b>{theme.name}</b>
                <p className="text-xs">
                  {theme.mentions} lượt nhắc trong mẫu{" "}
                  {action.data!.sampleCount} câu trả lời.
                </p>
              </div>
            ))}
          </div>
          {action.data.topIssues.length > 0 && (
            <p className="text-xs">
              Chủ đề cần quan tâm: {action.data.topIssues.join(", ")}.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
