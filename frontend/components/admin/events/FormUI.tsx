'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

export const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 aria-invalid:border-red-500 disabled:bg-slate-100';
export const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-50';
export const primaryClass = `${buttonClass} border-transparent! bg-[#0284C7]! text-white! hover:bg-[#0EA5E9]!`;

export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return <div className="min-w-0 space-y-1.5">
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}</label>
    {children}
    {hint && <p id={`${id}-hint`} className="text-xs leading-5 text-slate-500">{hint}</p>}
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-red-600">{error}</p>}
  </div>;
}

export function Spinner() { return <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />; }

export function Modal({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/55">
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <h2 id={titleId} className="text-lg font-bold">{title}</h2>
      <button type="button" onClick={onClose} disabled={busy} aria-label="Đóng hộp thoại" className={`${buttonClass} size-11 p-0!`}>✕</button>
    </div>
    <div className="p-5">{children}</div>
  </dialog>;
}

export function EventImage({ url }: { url: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => { if (ref.current) ref.current.hidden = false; }, [url]);
  if (!url) return null;
  // Ảnh quản trị lấy từ URL bất kỳ; không cần cấu hình remotePatterns của next/image.
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img ref={ref} src={url} alt="Ảnh sự kiện" referrerPolicy="no-referrer" className="max-h-64 w-full object-cover" onLoad={() => { if (ref.current) ref.current.hidden = false; }} onError={() => { if (ref.current) ref.current.hidden = true; }} />
    <p className="px-3 py-2 text-xs text-slate-500">Ảnh xem trước · Nếu ảnh không hiển thị, hãy kiểm tra URL và quyền truy cập ảnh.</p>
  </div>;
}
