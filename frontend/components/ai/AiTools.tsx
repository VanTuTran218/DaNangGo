"use client";
import { useState } from "react";
import { Sparkles, LoaderCircle } from "lucide-react";
import { useAiAction } from "@/hooks/useAiAction";
import {
  parseItinerary,
  getReviewSummary,
  draftReply,
  draftDescription,
  rewriteSearch,
  scanReviews,
  type TripResult,
  type SummaryResult,
  type DraftResult,
  type DescriptionResult,
  type ModerationResult,
} from "@/lib/api/ai";
import type { ItineraryForm } from "@/components/itinerary/AiWizardModal";

const button =
  "inline-flex items-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50";
const box =
  "space-y-3 rounded-2xl border border-teal-100 bg-teal-50/50 p-4 text-sm text-slate-700";
function Status({
  loading,
  error,
  mode,
}: {
  loading: boolean;
  error: string;
  mode?: string;
}) {
  return (
    <>
      {loading && (
        <p
          role="status"
          className="flex items-center gap-2 text-xs text-teal-700"
        >
          <LoaderCircle size={14} className="animate-spin" />
          Gô đang xử lý…
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
      {mode === "fallback" && (
        <p className="text-xs text-amber-700">
          Đang dùng gợi ý dự phòng từ dữ liệu và quy tắc của hệ thống.
        </p>
      )}
    </>
  );
}
export function AiItineraryInput({
  onApply,
}: {
  onApply: (patch: Partial<ItineraryForm>) => void;
}) {
  const [text, setText] = useState("");
  const action = useAiAction<TripResult>();
  const labels: Record<string, string> = {
    days: "số ngày",
    guests: "số khách",
    budget: "ngân sách",
    start_date: "ngày khởi hành",
  };
  const apply = () => {
    const trip = action.data?.request;
    if (!trip || trip.off_topic) return;
    const needs = trip.needs.flatMap((need) =>
      need === "stay"
        ? ["accommodation" as const]
        : need === "food"
          ? ["food" as const]
          : need === "sight" || need === "entertainment"
            ? ["attractions" as const]
            : [],
    );
    const interests = trip.interests
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const prefs = [
      ["bien", "Biển & Nghỉ dưỡng"],
      ["am thuc", "Ẩm thực địa phương"],
      ["hai san", "Ẩm thực địa phương"],
      ["van hoa", "Di sản & Văn hoá"],
      ["chup anh", "Check-in sống ảo"],
      ["check", "Check-in sống ảo"],
      ["mao hiem", "Phiêu lưu mạo hiểm"],
    ]
      .filter(([key]) => interests.includes(key))
      .map(([, value]) => value);
    onApply({
      days: trip.days ?? 0,
      guestCount: trip.guests ?? 0,
      budget: trip.budget ?? 0,
      startDate: trip.start_date ?? "",
      ...(needs.length ? { needs: [...new Set(needs)] } : {}),
      ...(prefs.length ? { prefs: [...new Set(prefs)] } : {}),
    });
  };
  return (
    <section className={box}>
      <h3 className="flex items-center gap-2 font-bold text-teal-800">
        <Sparkles size={16} />
        Mô tả chuyến đi cho Gô
      </h3>
      <textarea
        aria-label="Mô tả chuyến đi"
        value={text}
        maxLength={500}
        onChange={(e) => {
          setText(e.target.value);
          action.clear();
        }}
        placeholder="Đi 3N2Đ cùng bạn gái, thích biển và hải sản, tổng ngân sách 5 triệu, khởi hành ngày mai…"
        className="w-full rounded-xl border bg-white p-3 text-sm"
        rows={3}
      />
      <button
        type="button"
        className={button}
        disabled={text.trim().length < 3 || action.loading}
        onClick={() => action.run((signal) => parseItinerary(text, signal))}
      >
        Phân tích mô tả
      </button>
      <Status {...action} mode={action.data?.mode} />
      {action.data && (
        <div className="space-y-2">
          <p>{action.data.notice}</p>
          {!action.data.request.off_topic && (
            <>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  Số ngày: <b>{action.data.request.days ?? "Chưa rõ"}</b>
                </div>
                <div>
                  Số khách: <b>{action.data.request.guests ?? "Chưa rõ"}</b>
                </div>
                <div>
                  Ngân sách:{" "}
                  <b>
                    {action.data.request.budget !== null
                      ? `${action.data.request.budget.toLocaleString("vi-VN")}đ`
                      : "Chưa rõ"}
                  </b>
                </div>
                <div>
                  Khởi hành:{" "}
                  <b>{action.data.request.start_date ?? "Chưa rõ"}</b>
                </div>
              </dl>
              {action.data.request.missing.length > 0 && (
                <p className="text-xs text-amber-700">
                  Cần bổ sung:{" "}
                  {action.data.request.missing
                    .map((k) => labels[k] ?? k)
                    .join(", ")}
                  .
                </p>
              )}
              <button type="button" className={button} onClick={apply}>
                Xác nhận điền vào biểu mẫu
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
export function AiReviewSummary({ placeId }: { placeId: number }) {
  const action = useAiAction<SummaryResult>();
  return (
    <section className={`${box} mb-8`}>
      <h3 className="font-bold text-teal-900">Gô tổng hợp đánh giá</h3>
      <p className="text-xs">
        Chỉ sử dụng đánh giá đã duyệt; tối đa 100 đánh giá gần nhất.
      </p>
      <button
        type="button"
        className={button}
        disabled={action.loading}
        onClick={() =>
          action.run((signal) => getReviewSummary(placeId, signal))
        }
      >
        Tóm tắt đánh giá
      </button>
      <Status {...action} mode={action.data?.mode} />
      {action.data && (
        <>
          <p>{action.data.summary}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <b>Điểm được khen</b>
              <ul className="mt-2 list-disc pl-4 text-xs">
                {action.data.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              {!action.data.strengths.length && (
                <p className="text-xs">Chưa đủ nhận xét lặp lại để kết luận.</p>
              )}
            </div>
            <div>
              <b>Điểm cần lưu ý</b>
              <ul className="mt-2 list-disc pl-4 text-xs">
                {action.data.weaknesses.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              {!action.data.weaknesses.length && (
                <p className="text-xs">Chưa đủ nhận xét lặp lại để kết luận.</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
export function AiReplyAssistant({
  reviewId,
  onApply,
}: {
  reviewId: string;
  onApply: (draft: string) => void;
}) {
  const action = useAiAction<DraftResult>();
  return (
    <section className={box}>
      <button
        type="button"
        className={button}
        disabled={action.loading}
        onClick={() => action.run((signal) => draftReply(reviewId, signal))}
      >
        <Sparkles size={14} />
        Gợi ý trả lời
      </button>
      <Status {...action} mode={action.data?.mode} />
      {action.data && (
        <>
          <p className="whitespace-pre-wrap text-xs">{action.data.draft}</p>
          <p className="text-xs text-slate-500">{action.data.notice}</p>
          <button
            type="button"
            className={button}
            onClick={() => onApply(action.data!.draft)}
          >
            Dùng bản nháp này
          </button>
        </>
      )}
    </section>
  );
}
export function AiDescriptionAssistant({
  name,
  type = "food",
  admin = false,
  onApply,
}: {
  name: string;
  type?: "food" | "stay" | "sight";
  admin?: boolean;
  onApply: (draft: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const action = useAiAction<DescriptionResult>();
  return (
    <section className={`${box} mt-3`}>
      <h4 className="font-semibold">Gô hỗ trợ viết mô tả</h4>
      <textarea
        aria-label="Ghi chú cho mô tả AI"
        value={notes}
        rows={3}
        maxLength={800}
        onChange={(e) => {
          setNotes(e.target.value);
          action.clear();
        }}
        placeholder="Nhập các thông tin có thật: món nổi bật, không gian, nhóm khách phù hợp…"
        className="w-full rounded-xl border bg-white p-3 text-xs"
      />
      <button
        type="button"
        className={button}
        disabled={
          action.loading || name.trim().length < 2 || notes.trim().length < 10
        }
        onClick={() =>
          action.run((signal) =>
            draftDescription(name, type, notes, admin, signal),
          )
        }
      >
        Soạn nháp mô tả
      </button>
      <Status {...action} mode={action.data?.mode} />
      {action.data && (
        <>
          <p className="whitespace-pre-wrap text-xs">
            {action.data.description}
          </p>
          {action.data.missingInfo.map((info) => (
            <p key={info} className="text-xs text-slate-500">
              • {info}
            </p>
          ))}
          <p className="text-xs">{action.data.notice}</p>
          <button
            type="button"
            className={button}
            onClick={() => onApply(action.data!.description)}
          >
            Áp dụng vào ô mô tả
          </button>
        </>
      )}
    </section>
  );
}
export function AiSearchRewrite({
  query,
  onApply,
}: {
  query: string;
  onApply: (query: string) => void;
}) {
  const action = useAiAction<{ mode: string; query: string; notice: string }>();
  return (
    <section className="mt-3 space-y-2 text-sm text-white">
      <button
        type="button"
        className="rounded-xl border border-white/30 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-40"
        disabled={query.trim().length < 3 || action.loading}
        onClick={() => action.run((signal) => rewriteSearch(query, signal))}
      >
        <Sparkles className="mr-1 inline" size={14} />
        Gô hiểu lại từ khóa
      </button>
      <Status {...action} mode={action.data?.mode} />
      {action.data && (
        <p>
          Gợi ý:{" "}
          <button
            type="button"
            onClick={() => {
              onApply(action.data!.query);
              action.clear();
            }}
            className="rounded-lg bg-white px-3 py-1 font-bold text-teal-800"
          >
            {action.data.query} — Dùng gợi ý
          </button>
          <span className="mt-1 block text-xs text-white/80">
            {action.data.notice}
          </span>
        </p>
      )}
    </section>
  );
}
const flags: Record<string, string> = {
  spam: "Spam",
  advertising: "Quảng cáo",
  abusive: "Xúc phạm",
  irrelevant: "Lạc đề",
  personal_info: "Thông tin cá nhân",
  suspicious_pattern: "Dấu hiệu bất thường",
};
export function AiModeration({ ids }: { ids: number[] }) {
  const action = useAiAction<ModerationResult>();
  return (
    <section className={box}>
      <h3 className="font-bold">Gô hỗ trợ kiểm duyệt</h3>
      <button
        type="button"
        className={button}
        disabled={action.loading || !ids.length}
        onClick={() =>
          action.run((signal) => scanReviews(ids.slice(0, 50), signal))
        }
      >
        Kiểm tra {Math.min(50, ids.length)} đánh giá đang lọc
      </button>
      <Status {...action} mode={action.data?.mode} />
      {action.data && (
        <>
          <p className="text-xs">
            {action.data.notice} Đã kiểm tra {action.data.analyzedCount} đánh
            giá.
          </p>
          {!action.data.items.length && (
            <p className="text-xs">
              Chưa phát hiện dấu hiệu cần gắn cờ; quản trị viên vẫn cần kiểm tra
              nội dung.
            </p>
          )}
          {action.data.items.map((item) => (
            <div
              key={item.review_id}
              className="rounded-xl bg-white p-3 text-xs"
            >
              <b>Đánh giá #{item.review_id}</b>
              <p>{item.flags.map((f) => flags[f] ?? f).join(" · ")}</p>
              <p>{item.reason}</p>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
