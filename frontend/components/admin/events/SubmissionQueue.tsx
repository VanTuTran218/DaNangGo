'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { formatEventDate, isHttpUrl, parseEventDate } from '@/lib/events/schema';
import { getSubmission, listSubmissions, reviewSubmission, type Submission, type SubmissionStatus, type SubmissionSummary } from '@/services/event-submissions';
import { buttonClass, EventImage, Field, inputClass, Modal, primaryClass, Spinner } from './FormUI';

const labels: Record<SubmissionStatus, string> = {
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối',
};

type Queue = { items: SubmissionSummary[]; totalPages: number };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể xử lý đề xuất. Vui lòng thử lại.';
}

export default function SubmissionQueue() {
  const [status, setStatus] = useState<SubmissionStatus>('PENDING');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [queue, setQueue] = useState<Queue>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<number>();

  useEffect(() => {
    const controller = new AbortController();
    listSubmissions(status, page, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      if (page > 1 && result.items.length === 0) setPage(page - 1);
      else setQueue(result);
    }).catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); });
    return () => controller.abort();
  }, [status, page, reload]);

  function clearQueue() {
    setQueue(undefined);
    setError('');
  }

  function changePage(nextPage: number) {
    clearQueue();
    setPage(nextPage);
  }

  return <section className="mx-auto max-w-6xl space-y-5 pb-8">
    <Link href="/admin/su-kien" className="text-sm font-medium text-sky-700 underline">Về quản lý sự kiện</Link>
    <h1 className="text-2xl font-bold text-slate-900">Duyệt đề xuất sự kiện</h1>
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        <label htmlFor="submission-filter" className="text-sm font-semibold">Trạng thái</label>
        <select id="submission-filter" className={`${inputClass} max-w-52`} value={status} onChange={event => {
          clearQueue();
          setStatus(event.target.value as SubmissionStatus);
          setPage(1);
        }}>
          {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      {error ? <div className="space-y-3 p-5">
        <p role="alert" className="text-sm text-red-700">{error}</p>
        <button type="button" className={buttonClass} onClick={() => { clearQueue(); setReload(value => value + 1); }}>Thử lại</button>
      </div> : !queue ? <p role="status" className="flex items-center gap-2 p-5 text-sm"><Spinner />Đang tải đề xuất…</p>
        : queue.items.length === 0 ? <p className="p-5 text-sm text-slate-600">Không có đề xuất ở trạng thái này.</p>
          : <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr>
                {['Sự kiện', 'Ban tổ chức', 'Ngày gửi', 'Trạng thái', 'Thao tác'].map(label => <th key={label} scope="col" className="p-4">{label}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">{queue.items.map(item => <tr key={item.submission_id}>
                <th scope="row" className="p-4">{item.title}</th>
                <td className="p-4">{item.organizer_name}</td>
                <td className="p-4">{formatEventDate(parseEventDate(item.submitted_at))}</td>
                <td className="p-4">{labels[item.status]}</td>
                <td className="p-4"><button type="button" className={buttonClass} onClick={() => { setNotice(''); setSelected(item.submission_id); }} aria-label={`Xem đề xuất ${item.title}`}>Xem</button></td>
              </tr>)}</tbody>
            </table>
          </div>}
      {queue && queue.totalPages > 1 && <nav aria-label="Phân trang đề xuất" className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 text-sm">
        <button type="button" className={buttonClass} disabled={page <= 1} onClick={() => changePage(page - 1)}>Trước</button>
        <span>Trang {page} / {queue.totalPages}</span>
        <button type="button" className={buttonClass} disabled={page >= queue.totalPages} onClick={() => changePage(page + 1)}>Sau</button>
      </nav>}
    </div>
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
    {selected !== undefined && <SubmissionReview key={selected} id={selected} onClose={() => setSelected(undefined)} onReviewed={decision => {
      setSelected(undefined);
      setNotice(decision === 'APPROVED' ? 'Đã duyệt đề xuất.' : 'Đã từ chối đề xuất.');
      clearQueue();
      setReload(value => value + 1);
    }} />}
  </section>;
}

function SubmissionReview({ id, onClose, onReviewed }: {
  id: number;
  onClose: () => void;
  onReviewed: (decision: 'APPROVED' | 'REJECTED') => void;
}) {
  const [submission, setSubmission] = useState<Submission>();
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>();
  const [reason, setReason] = useState('');
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    getSubmission(id, controller.signal).then(result => {
      if (!controller.signal.aborted) setSubmission(result);
    }).catch(error => {
      if (!controller.signal.aborted) setLoadError(errorMessage(error));
    });
    return () => controller.abort();
  }, [id, retry]);

  async function confirmReview() {
    if (!decision || saving.current || submission?.status !== 'PENDING') return;
    if (decision === 'REJECTED' && !reason.trim()) return;
    saving.current = true;
    setBusy(true);
    setSaveError('');
    try {
      await reviewSubmission(id, decision, reason);
      onReviewed(decision);
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return <Modal title="Chi tiết đề xuất" onClose={onClose} busy={busy}>
    {loadError ? <div className="space-y-3">
      <p role="alert" className="text-sm text-red-700">{loadError}</p>
      <button type="button" className={buttonClass} onClick={() => { setLoadError(''); setRetry(value => value + 1); }}>Thử lại</button>
    </div> : !submission ? <p role="status" className="flex gap-2 text-sm"><Spinner />Đang tải chi tiết…</p>
      : <div className="space-y-4">
        <h3 className="break-words text-xl font-bold">{submission.title}</h3>
        {submission.cover_image && isHttpUrl(submission.cover_image) && <EventImage url={submission.cover_image} />}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold">Ban tổ chức</dt><dd>{submission.organizer_name}</dd></div>
          <div><dt className="font-semibold">Trạng thái</dt><dd>{labels[submission.status]}</dd></div>
          <div><dt className="font-semibold">Địa điểm</dt><dd>{[submission.location_name, submission.address].filter(Boolean).join(' · ') || '—'}</dd></div>
          <div><dt className="font-semibold">Thời gian (UTC+7)</dt><dd>{formatEventDate(parseEventDate(submission.start_time))} – {formatEventDate(parseEventDate(submission.end_time))}</dd></div>
        </dl>
        <p className="whitespace-pre-wrap break-words text-sm">{submission.description}</p>
        {submission.source_url && isHttpUrl(submission.source_url) && <a href={submission.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-700 underline">Nguồn thông tin</a>}
        {submission.rejection_reason && <p className="whitespace-pre-wrap break-words rounded-xl bg-red-50 p-3 text-sm text-red-800">Lý do từ chối: {submission.rejection_reason}</p>}
        {submission.status === 'PENDING' && (!decision ? <div className="flex flex-wrap gap-3">
          <button type="button" className={primaryClass} onClick={() => setDecision('APPROVED')}>Duyệt</button>
          <button type="button" className={buttonClass} onClick={() => setDecision('REJECTED')}>Từ chối</button>
        </div> : <form className="space-y-3" onSubmit={event => { event.preventDefault(); void confirmReview(); }}>
          {decision === 'APPROVED'
            ? <p className="text-sm">Xác nhận duyệt đề xuất này?</p>
            : <Field id="submission-reason" label="Lý do từ chối">
              <textarea id="submission-reason" rows={3} required maxLength={500} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} className={inputClass} />
            </Field>}
          {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" className={buttonClass} disabled={busy} onClick={() => { setDecision(undefined); setSaveError(''); }}>Quay lại</button>
            <button type="submit" className={primaryClass} disabled={busy || (decision === 'REJECTED' && !reason.trim())}>
              {busy && <Spinner />}{decision === 'APPROVED' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
            </button>
          </div>
        </form>)}
      </div>}
  </Modal>;
}
