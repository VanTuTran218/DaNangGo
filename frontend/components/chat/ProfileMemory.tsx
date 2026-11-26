"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Brain, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { chatRequest } from "@/lib/api/chat";

type Preference = { key: string; label: string; sensitive: boolean };
function Manager({ close, theme = "light" }: { close: () => void; theme?: "light" | "dark" }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Preference[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const abort = useRef(new AbortController());
  const isDark = theme === "dark";

  async function load() {
    setError(""); setBusy(true);
    try { const result = await chatRequest<{ preferences: Preference[] }>("/profile", { signal: abort.current.signal }); setItems(result.preferences); }
    catch (e) { if (!abort.current.signal.aborted) setError(e instanceof Error ? e.message : "Chưa tải được sở thích."); }
    finally { if (!abort.current.signal.aborted) setBusy(false); }
  }
  useEffect(() => {
    const controller = new AbortController(); abort.current = controller;
    dialog.current?.showModal();
    if (user) void load();
    return () => { controller.abort(); };
    // A fresh manager mounts for each account, preventing a previous account's result being shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <dialog
      ref={dialog}
      onCancel={close}
      onClose={close}
      className={
        isDark
          ? "m-auto w-[min(92vw,440px)] rounded-3xl border border-[#E6D9B7]/28 bg-[#071922]/96 p-6 text-[#CBD9DA] shadow-[0_32px_72px_rgba(2,10,15,0.75)] backdrop-blur-2xl backdrop:bg-[#020A0F]/65"
          : "m-auto w-[min(92vw,440px)] rounded-3xl bg-white p-6 text-slate-700 shadow-xl backdrop:bg-slate-900/40"
      }
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className={isDark ? "text-lg font-bold text-[#FFFDF5]" : "text-lg font-bold text-teal-900"}>
          Sở thích đã lưu
        </h2>
        <button
          autoFocus
          type="button"
          onClick={close}
          aria-label="Đóng sở thích"
          className={isDark ? "rounded-full p-1.5 text-[#E6D9B7] hover:bg-[#0E2A38] cursor-pointer" : "cursor-pointer"}
        >
          <X size={20} />
        </button>
      </div>
      <p className={isDark ? "my-3 text-sm text-[#CBD9DA]/85 leading-relaxed" : "my-3 text-sm"}>
        Chỉ những sở thích bạn đồng ý lưu mới dùng cho các chuyến sau. Điều kiện chuyến hiện tại có thể thay đổi trong chat.
      </p>
      {!user ? (
        <p className={isDark ? "text-sm text-[#94B0B3] rounded-2xl bg-[#0A222E] border border-[#E6D9B7]/16 p-3.5" : "text-sm"}>
          Bạn đang là khách. Gô chỉ giữ ngữ cảnh tạm trong hội thoại. Hãy đăng nhập nếu muốn lưu lâu dài.
        </p>
      ) : (
        <>
          {items && (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.key}
                  className={
                    isDark
                      ? "flex items-center justify-between gap-3 rounded-xl border border-[#E6D9B7]/20 bg-[#0A222E] px-3.5 py-2.5 text-sm text-[#FFFDF5]"
                      : "flex items-center justify-between gap-3 rounded-xl bg-teal-50 px-3 py-2 text-sm"
                  }
                >
                  <span>
                    {item.label}
                    {item.sensitive ? " · Thông tin dị ứng" : ""}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    className={isDark ? "text-[#F87171] underline cursor-pointer" : "text-rose-700 underline"}
                    onClick={async () => {
                      setBusy(true); setError("");
                      try { await chatRequest("/profile", { method: "DELETE", body: JSON.stringify({ keys: [item.key] }), signal: abort.current.signal }); await load(); }
                      catch (e) { if (!abort.current.signal.aborted) { setError(e instanceof Error ? e.message : "Chưa xóa được."); setBusy(false); } }
                    }}
                  >
                    Xóa
                  </button>
                </li>
              ))}
            </ul>
          )}
          {items?.length === 0 && (
            <p className={isDark ? "text-sm text-[#94B0B3]" : "text-sm"}>
              Chưa có sở thích được lưu. Bạn có thể nói “Hãy lưu tôi thích biển” trong chat.
            </p>
          )}
          {busy && <p role="status" className="mt-3 text-sm text-[#E6D9B7]">Đang xử lý…</p>}
          {error && (
            <div role="alert" className={isDark ? "mt-3 text-sm text-[#FCA5A5]" : "mt-3 text-sm text-rose-700"}>
              {error}
              <button type="button" className="ml-2 underline" onClick={() => void load()}>
                Thử lại
              </button>
            </div>
          )}
          {!!items?.length && (
            <button
              type="button"
              disabled={busy}
              className={isDark ? "mt-4 text-sm text-[#FCA5A5] underline cursor-pointer" : "mt-4 text-sm text-rose-700 underline"}
              onClick={async () => {
                setBusy(true); setError("");
                try { await chatRequest("/profile", { method: "DELETE", body: JSON.stringify({ all: true }), signal: abort.current.signal }); await load(); }
                catch (e) { if (!abort.current.signal.aborted) { setError(e instanceof Error ? e.message : "Chưa xóa được."); setBusy(false); } }
              }}
            >
              Xóa tất cả sở thích đã lưu
            </button>
          )}
        </>
      )}
    </dialog>
  );
}
export default function ProfileMemory({ theme = "light" }: { theme?: "light" | "dark" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const isDark = theme === "dark";
  return (
    <>
      <button
        type="button"
        title="Sở thích đã lưu"
        aria-label="Sở thích đã lưu"
        className={
          isDark
            ? "grid h-9 w-9 place-items-center rounded-[11px] border border-[#E6D9B7]/22 bg-[#091F2A]/88 text-[#E6D9B7] transition-all hover:-translate-y-px hover:border-[#E6D9B7]/55 hover:bg-[#0E2C3A] hover:text-[#FFFDF5] cursor-pointer"
            : "rounded-lg p-2 hover:bg-white/15"
        }
        onClick={() => setOpen(true)}
      >
        <Brain size={17} />
      </button>
      {open && createPortal(<Manager key={user?.id ?? "guest"} close={() => setOpen(false)} theme={theme} />, document.body)}
    </>
  );
}
