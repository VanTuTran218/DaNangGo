'use client';

import Link from 'next/link';
import { CalendarDays, Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatEventDate } from '@/lib/events/schema';
import { listEvents } from '@/services/events';
import { STATUS_LABELS, type Event, type EventStatus } from '@/types/event';
import { buttonClass, inputClass, primaryClass, Spinner } from './FormUI';

type Filter = 'ALL' | EventStatus;
type Result =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; events: Event[]; totalPages: number };

export default function EventList() {
  const [query, setQuery] = useState<{ status: Filter; page: number }>({ status: 'ALL', page: 1 });
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Result>({ state: 'loading' });
  const { status, page } = query;

  useEffect(() => {
    const controller = new AbortController();
    listEvents(status, page, controller.signal).then(({ events, totalPages }) => {
      if (controller.signal.aborted) return;
      if (page > totalPages) {
        setQuery({ status, page: totalPages });
        return;
      }
      setResult({ state: 'ready', events, totalPages });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({
        state: 'error', message: error instanceof Error ? error.message : 'Không thể tải danh sách sự kiện.',
      });
    });
    return () => controller.abort();
  }, [status, page, retry]);

  function changeQuery(nextStatus: Filter, nextPage: number) {
    setResult({ state: 'loading' });
    setQuery({ status: nextStatus, page: nextPage });
    if (nextStatus === status && nextPage === page) setRetry(value => value + 1);
  }

  return <section className="mx-auto max-w-7xl space-y-6 pb-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700"><CalendarDays className="size-6" aria-hidden="true" /></span>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Quản lý sự kiện</h1>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/su-kien/duyet" className={buttonClass}>Duyệt đề xuất</Link>
        <Link href="/admin/su-kien/tao-moi" className={primaryClass}><Plus className="size-4" aria-hidden="true" />Tạo sự kiện</Link>
      </div>
    </header>

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
        <label htmlFor="event-status" className="text-sm font-semibold text-slate-700">Trạng thái</label>
        <select id="event-status" value={status} onChange={event => changeQuery(event.target.value as Filter, 1)} className={`${inputClass} max-w-52`}>
          <option value="ALL">Tất cả</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>

      {result.state === 'loading' && <p role="status" className="flex items-center gap-3 p-6 text-sm text-slate-600"><Spinner />Đang tải sự kiện…</p>}
      {result.state === 'error' && <div className="space-y-3 p-6">
        <p role="alert" className="text-sm text-red-700">{result.message}</p>
        <button type="button" className={buttonClass} onClick={() => changeQuery(status, page)}>Thử lại</button>
      </div>}
      {result.state === 'ready' && (result.events.length === 0
        ? <p className="p-6 text-sm text-slate-600">{status === 'ALL' ? 'Chưa có sự kiện.' : 'Không có sự kiện ở trạng thái này.'}</p>
        : <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>{['Tên sự kiện', 'Thời gian (UTC+7)', 'Địa điểm', 'Trạng thái', 'Cập nhật', 'Thao tác'].map(label =>
                <th scope="col" key={label} className="px-4 py-3 font-semibold">{label}</th>
              )}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.events.map(event => <tr key={event.id} className="align-top text-slate-700">
                <th scope="row" className="px-4 py-4 font-semibold text-slate-900">{event.name}</th>
                <td className="whitespace-nowrap px-4 py-4"><div>{formatEventDate(event.startAt)}</div><div className="mt-1 text-slate-500">{formatEventDate(event.endAt)}</div></td>
                <td className="px-4 py-4">{event.locationName || '—'}{event.district && <div className="mt-1 text-slate-500">{event.district}</div>}</td>
                <td className="px-4 py-4"><span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium">{STATUS_LABELS[event.status] ?? event.status}</span></td>
                <td className="whitespace-nowrap px-4 py-4">{formatEventDate(event.updatedAt ?? '')}</td>
                <td className="px-4 py-4"><Link href={`/admin/su-kien/${event.id}`} className={`${buttonClass} whitespace-nowrap`} aria-label={`Chỉnh sửa ${event.name}`}><Pencil className="size-4" aria-hidden="true" />Sửa</Link></td>
              </tr>)}
            </tbody>
          </table>
        </div>)}
      {result.state === 'ready' && result.totalPages > 1 && <nav aria-label="Phân trang sự kiện" className="flex items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm">
        <button type="button" className={buttonClass} disabled={page === 1} onClick={() => changeQuery(status, page - 1)}>Trước</button>
        <span>Trang {page} / {result.totalPages}</span>
        <button type="button" className={buttonClass} disabled={page >= result.totalPages} onClick={() => changeQuery(status, page + 1)}>Sau</button>
      </nav>}
    </div>
  </section>;
}
