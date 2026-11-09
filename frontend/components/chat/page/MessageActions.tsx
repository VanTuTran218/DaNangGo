"use client";

import { useState } from "react";
import Link from "next/link";
import { ThumbsUp, ThumbsDown, Save, SlidersHorizontal } from "lucide-react";
import { chatRequest } from "@/lib/api/chat";
import type { ChatMessage } from "@/types/chat";
import styles from "./ChatPage.module.css";

type Props = {
  message: ChatMessage;
  sessionId: number;
  onUpdate: (message: ChatMessage) => void;
};
export function Feedback({ message, sessionId, onUpdate }: Props) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  return (
    <span className={styles.feedback}>
      {(["helpful", "unhelpful"] as const).map((vote) => (
        <button
          key={vote}
          type="button"
          disabled={pending}
          aria-pressed={message.feedback === vote}
          aria-label={
            vote === "helpful"
              ? "Câu trả lời hữu ích"
              : "Câu trả lời chưa hữu ích"
          }
          onClick={async () => {
            setPending(true);
            setError("");
            try {
              onUpdate(
                await chatRequest<ChatMessage>(
                  `/sessions/${sessionId}/messages/${encodeURIComponent(message.id)}`,
                  {
                    method: "PATCH",
                    body: JSON.stringify({
                      action: "feedback",
                      vote: message.feedback === vote ? null : vote,
                    }),
                  },
                ),
              );
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Chưa lưu được đánh giá.",
              );
            } finally {
              setPending(false);
            }
          }}
        >
          {vote === "helpful" ? (
            <ThumbsUp size={14} />
          ) : (
            <ThumbsDown size={14} />
          )}
        </button>
      ))}
      {error && <small role="status">{error}</small>}
    </span>
  );
}
export function PlanActions({
  message,
  sessionId,
  onUpdate,
  onAdjust,
}: Props & { onAdjust: (text: string) => void }) {
  const plan = message.travelPlan!;
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false),
    [notice, setNotice] = useState(""),
    [login, setLogin] = useState(false);
  const [food, setFood] = useState(String(plan.costs.foodAllowance ?? 0)),
    [transport, setTransport] = useState(
      plan.costs.transportAllowance == null
        ? ""
        : String(plan.costs.transportAllowance),
    ),
    [percent, setPercent] = useState(
      plan.costs.contingencyPercent == null
        ? ""
        : String(plan.costs.contingencyPercent),
    );
  const request = async (body: unknown) => {
    setPending(true);
    setNotice("");
    setLogin(false);
    try {
      const updated = await chatRequest<ChatMessage>(
        `/sessions/${sessionId}/messages/${encodeURIComponent(message.id)}`,
        { method: "PATCH", body: JSON.stringify(body) },
      );
      onUpdate(updated);
      setNotice(
        updated.savedItineraryId
          ? "Đã lưu bản nháp vào Lịch trình."
          : "Đã cập nhật các khoản dự trù.",
      );
    } catch (e) {
      const text =
        e instanceof Error ? e.message : "Chưa thực hiện được thao tác.";
      setNotice(text);
      setLogin(text.includes("đăng nhập"));
    } finally {
      setPending(false);
    }
  };
  return (
    <div className={styles.planActions}>
      <div className={styles.actionButtons}>
        {message.savedItineraryId ? (
          <Link href={`/lich-trinh/${message.savedItineraryId}`}>
            Mở lịch trình đã lưu ↗
          </Link>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => request({ action: "save" })}
          >
            <Save size={15} />
            Lưu lịch trình này
          </button>
        )}
        {!message.savedItineraryId && (
          <button
            type="button"
            disabled={pending}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <SlidersHorizontal size={15} />
            Dự trù chi phí
          </button>
        )}
        {plan.groups.some(group => group.title.startsWith("Lưu trú")) && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onAdjust("Tôi muốn đổi khách sạn trong lịch trình vừa tạo")}
          >
            Đổi khách sạn
          </button>
        )}
      </div>
      {open && !message.savedItineraryId && (
        <form
          className={styles.costForm}
          onSubmit={(e) => {
            e.preventDefault();
            request({
              action: "costs",
              food: Number(food),
              transport: Number(transport),
              contingencyPercent: Number(percent),
            });
          }}
        >
          <p>
            Nhập dự trù cho toàn nhóm, toàn chuyến. Gô không coi đây là giá dịch
            vụ hay tiền đã chi.
          </p>
          <label>
            Ăn uống dự kiến (đ)
            <input
              type="number"
              min="0"
              max="1000000000"
              step="1"
              required
              value={food}
              onChange={(e) => setFood(e.target.value)}
            />
          </label>
          <label>
            Di chuyển dự kiến (đ)
            <input
              type="number"
              min="0"
              max="1000000000"
              step="1"
              required
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              placeholder="Bạn nhập mức dự trù"
            />
          </label>
          <label>
            Dự phòng (%)
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              required
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="0–50%"
            />
          </label>
          <button type="submit" disabled={pending}>
            Cập nhật dự trù
          </button>
        </form>
      )}
      {plan.costs.projectedSubtotal != null && (
        <div className={styles.costEstimate}>
          <span>
            Di chuyển dự kiến:{" "}
            {(plan.costs.transportAllowance ?? 0).toLocaleString("vi-VN")}đ
          </span>
          <span>
            Dự phòng dự kiến:{" "}
            {(plan.costs.contingencyAllowance ?? 0).toLocaleString("vi-VN")}đ
          </span>
          <strong>
            Tổng dự kiến: {plan.costs.projectedSubtotal.toLocaleString("vi-VN")}
            đ
          </strong>
          {plan.budget != null && (
            <span>
              {plan.costs.projectedSubtotal > plan.budget
                ? "Vượt dự trù ngân sách: "
                : "Ngân sách còn lại dự kiến: "}
              {Math.abs(
                plan.budget - plan.costs.projectedSubtotal,
              ).toLocaleString("vi-VN")}
              đ
            </span>
          )}
          <small>
            Gồm các khoản đã có giá trong dữ liệu và dự trù bạn nhập. Khoản chưa
            có giá vẫn chưa được tính.
          </small>
        </div>
      )}
      {message.savedItineraryId && (
        <small>
          Muốn sửa bản đã lưu, mở trang Lịch trình. Thay đổi trong chat không tự
          ghi đè bản đã lưu.
        </small>
      )}
      {notice && (
        <p role="status">
          {notice}{" "}
          {login && <Link href="/dang-nhap?redirect=%2Fchat">Đăng nhập</Link>}
        </p>
      )}
    </div>
  );
}
