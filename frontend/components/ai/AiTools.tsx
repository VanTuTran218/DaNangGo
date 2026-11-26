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
  dark = false,
}: {
  loading: boolean;
  error: string;
  mode?: string;
  dark?: boolean;
}) {
  return (
    <>
      {loading && (
        <p
          role="status"
          className={`flex items-center gap-2 text-xs ${
            dark ? "text-[#E6D9B7]" : "text-teal-700"
          }`}
        >
          <LoaderCircle size={14} className="animate-spin" />
          Gô đang xử lý…
        </p>
      )}
      {error && (
        <p role="alert" className={`text-xs ${dark ? "text-rose-300" : "text-red-700"}`}>
          {error}
        </p>
      )}
      {mode === "fallback" && (
        <p className={`text-xs ${dark ? "text-[#F0B47C]" : "text-amber-700"}`}>
          Đang dùng gợi ý dự phòng từ dữ liệu và quy tắc của hệ thống.
        </p>
      )}
    </>
  );
}
export function AiItineraryInput({
  onApply,
  dark = false,
}: {
  onApply: (patch: Partial<ItineraryForm>) => void;
  dark?: boolean;
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

  if (dark) {
    return (
      <section className="space-y-3 rounded-2xl border border-[#2DD4BF]/26 bg-gradient-to-br from-[#0A222F]/90 via-[#071A24]/95 to-[#06141C]/95 p-4 text-sm text-[#D5E6EA] shadow-[inset_0_1px_0_rgba(45,212,191,0.12)]">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-[#FFFDF5]">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#2DD4BF]/30 bg-[#2DD4BF]/12 text-[#2DD4BF]">
              <Sparkles size={13} />
            </span>
            Mô tả chuyến đi cho Gô
          </h3>
          <span className="rounded-full border border-[#2DD4BF]/28 bg-[#2DD4BF]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5EEAD4]">
            AI Parser
          </span>
        </div>

        <textarea
          aria-label="Mô tả chuyến đi"
          value={text}
          maxLength={500}
          onChange={(e) => {
            setText(e.target.value);
            action.clear();
          }}
          placeholder="VD: Đi 3N2Đ cùng bạn gái, thích biển và hải sản, tổng ngân sách 5 triệu, khởi hành ngày mai…"
          className="auth-dark-input w-full resize-none rounded-xl border border-[#E6D9B7]/18 bg-[#041118]/92 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#FFFDF5] placeholder:text-[#7DA0AC]/75 outline-none transition-all focus:border-[#2DD4BF]/65 focus:ring-2 focus:ring-[#2DD4BF]/15"
          rows={2}
        />

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#0D9488] px-3.5 py-2 text-xs font-bold text-[#031417] shadow-[0_6px_18px_rgba(20,184,166,0.24)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            disabled={text.trim().length < 3 || action.loading}
            onClick={() => action.run((signal) => parseItinerary(text, signal))}
          >
            <Sparkles size={13} />
            Phân tích mô tả
          </button>
          <span className="text-[11px] text-[#8FB0BA]">
            Tự động điền ngân sách, số ngày &amp; sở thích
          </span>
        </div>

        <Status {...action} mode={action.data?.mode} dark />

        {action.data && (
          <div className="space-y-2.5 rounded-xl border border-[#E6D9B7]/18 bg-[#04121A]/90 p-3.5">
            <p className="text-xs leading-relaxed text-[#DCE8EA]">
              {action.data.notice}
            </p>
            {!action.data.request.off_topic && (
              <>
                <dl className="grid grid-cols-2 gap-2 text-xs text-[#9AB6BF]">
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
                    Số ngày:{" "}
                    <b className="text-[#FFFDF5]">
                      {action.data.request.days ?? "Chưa rõ"}
                    </b>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
                    Số khách:{" "}
                    <b className="text-[#FFFDF5]">
                      {action.data.request.guests ?? "Chưa rõ"}
                    </b>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
                    Ngân sách:{" "}
                    <b className="text-[#E6D9B7]">
                      {action.data.request.budget !== null
                        ? `${action.data.request.budget.toLocaleString("vi-VN")}đ`
                        : "Chưa rõ"}
                    </b>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
                    Khởi hành:{" "}
                    <b className="text-[#FFFDF5]">
                      {action.data.request.start_date ?? "Chưa rõ"}
                    </b>
                  </div>
                </dl>
                {action.data.request.missing.length > 0 && (
                  <p className="text-xs text-[#F0B47C]">
                    Cần bổ sung:{" "}
                    {action.data.request.missing
                      .map((k) => labels[k] ?? k)
                      .join(", ")}
                    .
                  </p>
                )}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E87B39] to-[#D46525] px-3.5 py-2 text-xs font-bold text-[#FFFDF5] shadow-[0_6px_18px_rgba(232,123,57,0.28)] transition-all hover:brightness-110 cursor-pointer"
                  onClick={apply}
                >
                  Xác nhận điền vào biểu mẫu
                </button>
              </>
            )}
          </div>
        )}
      </section>
    );
  }

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
    <section className="mb-8 space-y-3.5 rounded-[16px] border border-[#E6D9B7]/32 bg-[#091E27] p-6 sm:p-7 text-sm text-[#D5E4E4] shadow-[0_18px_46px_rgba(8,22,28,0.16)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#E6D9B7] mb-1">
            <Sparkles size={12} className="text-[#E87B39]" />
            <span>Trợ lý AI Gô</span>
          </p>
          <h3 className="home-serif text-lg sm:text-xl font-semibold text-[#FFFDF5]">
            Gô tổng hợp đánh giá
          </h3>
          <p className="text-xs text-[#CBD9DA]/80 mt-0.5">
            Chỉ sử dụng đánh giá đã duyệt; tối đa 100 đánh giá gần nhất.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-[#FFF8E9] hover:bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#102832] transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          disabled={action.loading}
          onClick={() =>
            action.run((signal) => getReviewSummary(placeId, signal))
          }
        >
          <Sparkles size={13} className="text-[#CB712D]" />
          <span>Tóm tắt đánh giá</span>
        </button>
      </div>
      <Status {...action} mode={action.data?.mode} dark />
      {action.data && (
        <div className="space-y-4 pt-3 border-t border-[#E6D9B7]/20">
          <p className="leading-relaxed text-[#FFFDF5]/92">{action.data.summary}</p>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="rounded-[12px] bg-white/[0.06] border border-[#E6D9B7]/20 p-4">
              <b className="text-xs uppercase tracking-[0.14em] text-[#E6D9B7]">Điểm được khen</b>
              <ul className="mt-2 list-disc pl-4 text-xs space-y-1 text-[#DCE8E8]">
                {action.data.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              {!action.data.strengths.length && (
                <p className="text-xs text-[#CBD9DA]/75 mt-1">Chưa đủ nhận xét lặp lại để kết luận.</p>
              )}
            </div>
            <div className="rounded-[12px] bg-white/[0.06] border border-[#E6D9B7]/20 p-4">
              <b className="text-xs uppercase tracking-[0.14em] text-[#F0B47C]">Điểm cần lưu ý</b>
              <ul className="mt-2 list-disc pl-4 text-xs space-y-1 text-[#DCE8E8]">
                {action.data.weaknesses.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              {!action.data.weaknesses.length && (
                <p className="text-xs text-[#CBD9DA]/75 mt-1">Chưa đủ nhận xét lặp lại để kết luận.</p>
              )}
            </div>
          </div>
        </div>
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
