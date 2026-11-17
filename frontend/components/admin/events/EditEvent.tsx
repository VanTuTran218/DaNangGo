'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Event } from '@/types/event';
import { getEvent } from '@/services/events';
import EventForm from './EventForm';
import { buttonClass, Spinner } from './FormUI';

export default function EditEvent({ id }: { id: string }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getEvent(id, controller.signal).then(result => { if (!controller.signal.aborted) setEvent(result); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Không thể tải sự kiện.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, retry]);
  if (loading) return <div role="status" className="flex items-center gap-3 p-8 text-sm text-slate-600"><Spinner />Đang tải sự kiện…</div>;
  if (error) return <div className="space-y-4 rounded-2xl border border-red-200 bg-white p-6">
    <p role="alert">{error}</p>
    <div className="flex flex-wrap gap-3">
      <button type="button" className={buttonClass} onClick={() => setRetry(value => value + 1)}>Thử lại</button>
      <Link href="/admin/su-kien" className={buttonClass}>Về danh sách sự kiện</Link>
    </div>
  </div>;
  if (!event) return null;
  return <EventForm key={event.id} initialData={event} />;
}
