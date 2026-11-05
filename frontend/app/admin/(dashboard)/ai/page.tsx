"use client";
import { useEffect, useState } from "react";
import { useAiAction } from "@/hooks/useAiAction";
import { aiRequest, type AiMetrics, type SyncResult } from "@/lib/api/ai";
import FeedbackReadiness from "@/components/ai/FeedbackReadiness";
export default function AiOperationsPage() {
  const stats = useAiAction<AiMetrics>(),
    sync = useAiAction<{ saved: number; processed: number }>();
  const [progress, setProgress] = useState("");
  useEffect(() => {
    stats.run((signal) =>
      aiRequest<AiMetrics>("/admin/metrics", undefined, signal),
    );
  }, [stats.run]);
  const update = () =>
    sync.run(async (signal) => {
      let afterId = 0,
        saved = 0,
        processed = 0;
      while (true) {
        const result = await aiRequest<SyncResult>(
          "/admin/embeddings/sync",
          { afterId },
          signal,
        );
        saved += result.saved;
        processed += result.processed;
        setProgress(
          `Đã kiểm tra ${processed}/${result.total} địa điểm; cập nhật ${saved} địa điểm.`,
        );
        if (!result.hasMore) break;
        if (result.nextAfterId <= afterId)
          throw new Error("Không thể tiếp tục cập nhật.");
        afterId = result.nextAfterId;
      }
      return { saved, processed };
    });
  const labels: Record<string, string> = {
    chat: "Hội thoại",
    intent: "Hiểu ý định",
    itinerary: "Điền lịch trình",
    reviewSummary: "Tóm tắt đánh giá",
    reply: "Nháp phản hồi",
    moderation: "Hỗ trợ kiểm duyệt",
    description: "Nháp mô tả",
    survey: "Phân tích khảo sát",
    rewrite: "Hiểu từ khóa",
    embedding: "Gợi ý tương tự",
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vận hành trợ lý AI</h1>
      <FeedbackReadiness />
      <p className="text-sm text-slate-500">
        Số liệu từ lúc backend khởi động. Không ghi nội dung hội thoại hoặc API
        key vào bảng theo dõi.
      </p>
      <button
        className="rounded-xl bg-teal-600 px-4 py-2 text-sm text-white disabled:opacity-40"
        disabled={stats.loading}
        onClick={() =>
          stats.run((signal) =>
            aiRequest<AiMetrics>("/admin/metrics", undefined, signal),
          )
        }
      >
        Làm mới số liệu
      </button>
      {stats.error && (
        <p role="alert" className="text-red-700">
          {stats.error}
        </p>
      )}
      {stats.data && (
        <>
          <div className="rounded-2xl border bg-white p-5 text-sm">
            Model: <b>{stats.data.model}</b> · Khóa Gemini:{" "}
            {stats.data.keyConfigured ? "Đã cấu hình" : "Chưa cấu hình"} · Đang
            xử lý: {stats.data.activeRequests} · Cache:{" "}
            {stats.data.cacheEntries}
            {stats.data.cooldownSeconds > 0 && (
              <p className="mt-2 text-amber-700">
                Nhà cung cấp đang giới hạn; chế độ dự phòng đang được sử dụng.
              </p>
            )}
          </div>
          <div className="overflow-auto rounded-2xl border bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100">
                <tr>
                  {[
                    "Tác vụ",
                    "Lượt gọi",
                    "Thành công",
                    "Dự phòng",
                    "Thử lại",
                    "Dùng cache",
                    "Thời gian TB",
                  ].map((h) => (
                    <th key={h} className="p-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.data.tasks).map(([task, s]) => (
                  <tr key={task} className="border-t">
                    <td className="p-3">{labels[task] ?? task}</td>
                    <td>{s.calls}</td>
                    <td>{s.success}</td>
                    <td>{s.fallback}</td>
                    <td>{s.retries}</td>
                    <td>{s.cacheHits}</td>
                    <td>
                      {Math.round(s.durationMs / Math.max(1, s.calls))} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <section className="space-y-3 rounded-2xl border border-teal-100 bg-white p-5">
        <h2 className="font-bold">Dữ liệu gợi ý địa điểm tương tự</h2>
        <p className="text-sm text-slate-600">
          Cập nhật các địa điểm công khai mới hoặc đã thay đổi. Chỉ đưa thông
          tin địa điểm công khai vào embedding; giá và trạng thái luôn được đọc
          lại từ database.
        </p>
        <button
          className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
          disabled={sync.loading}
          onClick={update}
        >
          {sync.loading ? "Đang cập nhật…" : "Cập nhật dữ liệu gợi ý"}
        </button>
        {sync.loading && (
          <button className="ml-3 text-xs underline" onClick={sync.clear}>
            Dừng chờ
          </button>
        )}
        <p role="status" className="text-xs">
          {progress}
        </p>
        {sync.error && (
          <p role="alert" className="text-xs text-red-700">
            {sync.error} Những địa điểm đã xử lý được giữ lại; có thể thử lại.
          </p>
        )}
        {sync.data && (
          <p className="text-sm text-teal-700">
            Hoàn tất: đã kiểm tra {sync.data.processed} địa điểm, cập nhật{" "}
            {sync.data.saved} địa điểm.
          </p>
        )}
      </section>
    </div>
  );
}
