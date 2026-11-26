'use client';

import type { Event } from '@/types/event';
import { EVENT_TYPES, STATUS_LABELS, TICKET_TYPES } from '@/types/event';
import { formatEventDate, isHttpUrl } from '@/lib/events/schema';
import { EventImage, Modal } from './FormUI';

export default function EventPreviewModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const placeLabel = [event.locationName, event.address, event.district].filter(Boolean).join(' — ');
  const canAttend = event.status !== 'POSTPONED' && event.status !== 'CANCELLED';
  const link = (url: string | undefined, text: string) => url && isHttpUrl(url) ? <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0284C7] underline underline-offset-4">{text} ↗</a> : null;
  return <Modal title="Xem trước sự kiện" onClose={onClose}>
    <article className="space-y-5 break-words">
      {isHttpUrl(event.imageUrl) && <EventImage url={event.imageUrl} />}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">{EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] ?? event.eventType}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{STATUS_LABELS[event.status]}</span>
        {event.isFeatured && <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">★ Nổi bật</span>}
      </div>
      <h3 className="text-2xl font-bold text-slate-900">{event.name}</h3>
      <p className="text-sm font-medium text-slate-700">{event.shortDescription}</p>
      {event.changeNote && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Thông báo: {event.changeNote}</p>}
      <dl className="space-y-3 text-sm">
        <div><dt className="font-semibold">Thời gian · UTC+7</dt><dd>{formatEventDate(event.startAt)} – {formatEventDate(event.endAt)}{event.isAllDay && ' · Cả ngày'}</dd></div>
        <div><dt className="font-semibold">Địa điểm</dt><dd>{placeLabel}</dd></div>
        <div><dt className="font-semibold">Vé tham dự</dt><dd>{TICKET_TYPES[event.ticketType]}{event.ticketPriceDisplay && ` · ${event.ticketPriceDisplay}`}</dd></div>
        {event.registrationDeadline && <div><dt className="font-semibold">Hạn đăng ký</dt><dd>{formatEventDate(event.registrationDeadline)}</dd></div>}
        {event.organizerName && <div><dt className="font-semibold">Ban tổ chức</dt><dd>{event.organizerName}{event.organizerContact && ` · ${event.organizerContact}`}</dd></div>}
      </dl>
      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{event.description || 'Chưa có mô tả.'}</p>
      <div className="flex flex-wrap gap-5 text-sm">
        {canAttend && event.ticketType === 'PAID' && link(event.ticketUrl, 'Mua vé')}
        {canAttend && event.ticketType === 'FREE_REGISTRATION' && link(event.ticketUrl, 'Đăng ký tham dự')}
        {link(event.officialSourceUrl, 'Nguồn chính thức')}
      </div>
      <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">Đây là bản xem trước, chưa lưu hoặc đăng các thay đổi.</p>
    </article>
  </Modal>;
}
