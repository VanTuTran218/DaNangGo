"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { aiRequest, type FeedbackReadinessReport } from "@/lib/api/ai";
import { useAiAction } from "@/hooks/useAiAction";

function ShareLink({
  path,
  label,
  origin,
}: {
  path: string;
  label: string;
  origin: string;
}) {
  const [notice, setNotice] = useState("");
  const url = origin + path;
  return (
    <div className="mt-2 space-y-2">
      <label className="block text-xs text-slate-500">
        Liên kết {label}
        <input
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-700"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <Link
          className="font-semibold text-teal-700 underline"
          href={path}
          target="_blank"
          rel="noopener noreferrer"
        >
          Mở biểu mẫu
        </Link>
        <button
          type="button"
          className="rounded-lg border px-3 py-2 font-semibold hover:bg-teal-50"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setNotice("Đã sao chép liên kết.");
            } catch {
              setNotice(
                "Chưa sao chép được. Bạn có thể chọn liên kết trong ô phía trên và sao chép thủ công.",
              );
            }
          }}
        >
          Sao chép liên kết
        </button>
        <span role="status">{notice}</span>
      </div>
    </div>
  );
}
export default function FeedbackReadiness() {
  const report = useAiAction<FeedbackReadinessReport>();
  const [origin, setOrigin] = useState(""),
    [local, setLocal] = useState(false);
  useEffect(() => {
    setOrigin(window.location.origin);
    setLocal(
      ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname),
    );
  }, []);
  const load = () =>
    report.run((signal) =>
      aiRequest<FeedbackReadinessReport>(
        "/admin/feedback-readiness",
        undefined,
        signal,
      ),
    );
  useEffect(() => {
    report.run((signal) =>
      aiRequest<FeedbackReadinessReport>(
        "/admin/feedback-readiness",
        undefined,
        signal,
      ),
    );
  }, [report.run]);
  return (
    <section className="space-y-5 rounded-2xl border border-teal-100 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">
            Phản hồi cho AI: còn thiếu dữ liệu gì?
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Số liệu từ database. Trạng thái sẵn sàng là điều kiện chạy tính
            năng, chưa khẳng định dữ liệu đại diện cho tất cả du khách.
          </p>
        </div>
        <button
          type="button"
          disabled={report.loading}
          onClick={load}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {report.loading ? "Đang kiểm tra…" : "Kiểm tra dữ liệu"}
        </button>
      </div>
      {report.error && (
        <p role="alert" className="text-sm text-red-700">
          {report.error} Chưa xác định được số liệu; vui lòng thử lại.
        </p>
      )}
      {report.data && (
        <>
          <p className="text-sm text-slate-600">
            {report.data.counts.approvedReviews} đánh giá đã duyệt ·{" "}
            {report.data.counts.pendingReviews} đánh giá chờ duyệt ·{" "}
            {report.data.counts.submittedResponses} phiếu khảo sát đã gửi ·{" "}
            {report.data.counts.textAnswers} góp ý văn bản.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {report.data.features.map((feature) => (
              <div
                key={feature.key}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{feature.label}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs ${feature.ready ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-800"}`}
                  >
                    {feature.ready ? "Có dữ liệu" : "Chưa có dữ liệu"}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  {feature.available} {feature.unit}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {feature.requirement}
                </p>
                <Link
                  href={feature.href}
                  className="mt-3 inline-block text-xs font-semibold text-teal-700 underline"
                >
                  Mở trang quản lý
                </Link>
              </div>
            ))}
          </div>
          <div>
            <h3 className="font-bold">Liên kết mời khảo sát</h3>
            <p className="mt-1 text-sm text-slate-500">
              Mời người đã trải nghiệm tự trả lời. Không điền hộ hoặc yêu cầu
              chấm điểm tích cực.
            </p>
            {local && (
              <p className="mt-2 text-xs text-amber-800">
                Liên kết localhost chỉ dùng trên máy này. Để chia sẻ cho du
                khách, mở trang bằng địa chỉ website đã triển khai rồi sao chép
                liên kết.
              </p>
            )}
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {report.data.surveys.map((survey) => (
                <div key={survey.id} className="min-w-0 rounded-xl border p-4">
                  <h4 className="text-sm font-semibold">{survey.title}</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    {survey.submitted} phiếu đã gửi · {survey.textAnswers} góp ý
                    văn bản
                  </p>
                  {survey.canCollect ? (
                    <ShareLink
                      path={survey.href}
                      label={survey.title}
                      origin={origin}
                    />
                  ) : (
                    <p className="mt-3 text-xs text-amber-800">
                      Khảo sát đã đóng, hết hạn hoặc không dành cho khách du lịch;
                      kiểm tra trong quản lý khảo sát trước khi mời trả lời.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold">Đánh giá theo địa điểm</h3>
            <p className="mt-1 text-xs text-slate-500">
              Hiển thị {report.data.places.length}/
              {report.data.counts.placesTotal} địa điểm công khai, ưu tiên nơi
              đã có đánh giá. Đánh giá mới cần quản trị viên duyệt trước khi AI
              tổng hợp.
            </p>
            <div className="mt-3 grid max-h-[560px] gap-3 overflow-auto md:grid-cols-2">
              {report.data.places.map((place) => (
                <div key={place.id} className="min-w-0 rounded-xl border p-4">
                  <h4 className="text-sm font-semibold">{place.name}</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    {place.approved} đã duyệt · {place.pending} chờ duyệt ·{" "}
                    {place.remaining
                      ? `Cần thêm ${place.remaining} đã duyệt để tổng hợp`
                      : "Đủ điều kiện tổng hợp"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {place.partnerApproved
                      ? "Có đối tác đã duyệt để thử nháp phản hồi."
                      : "Chưa gắn đối tác đã duyệt; chưa thử được nháp phản hồi đối tác."}
                  </p>
                  <ShareLink
                    path={place.href}
                    label={`đánh giá ${place.name}`}
                    origin={origin}
                  />
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Cập nhật {new Date(report.data.checkedAt).toLocaleString("vi-VN")}.
            Liên kết chỉ được sao chép trên máy bạn; hệ thống không tự gửi lời
            mời.
          </p>
        </>
      )}
    </section>
  );
}
