'use client';

import { useState } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Event, EventAction } from '@/types/event';
import { changeSchema, rescheduleSchema, toLocalInput, type ChangeValues } from '@/lib/events/schema';
import { eventFieldErrors } from '@/services/events';
import { Modal, Field, Spinner, inputClass, buttonClass, primaryClass } from './FormUI';

const titles: Record<EventAction, string> = { reschedule: 'Đổi lịch sự kiện', postpone: 'Hoãn sự kiện', cancel: 'Hủy sự kiện' };

export default function StatusChangeModal({ action, event, onClose, onConfirm, onDirtyChange }: {
  action: EventAction; event: Event; onClose: () => void;
  onConfirm: (data: ChangeValues) => Promise<void>; onDirtyChange: (dirty: boolean) => void;
}) {
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ChangeValues>({
    resolver: zodResolver(action === 'reschedule' ? rescheduleSchema : changeSchema),
    defaultValues: { startAt: toLocalInput(event.startAt), endAt: toLocalInput(event.endAt), changeNote: '' },
    mode: 'onTouched',
  });
  const submit = handleSubmit(async data => {
    setServerError('');
    if (action === 'reschedule' && data.startAt === toLocalInput(event.startAt) && data.endAt === toLocalInput(event.endAt)) {
      setError('startAt', { type: 'manual', message: 'Vui lòng thay đổi thời gian bắt đầu hoặc kết thúc.' }, { shouldFocus: true });
      return;
    }
    try { await onConfirm(data); }
    catch (error) {
      for (const [field, message] of Object.entries(eventFieldErrors(error))) {
        if (['startAt', 'endAt', 'changeNote'].includes(field)) setError(field as FieldPath<ChangeValues>, { type: 'server', message }, { shouldFocus: true });
      }
      setServerError(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  });
  return <Modal title={titles[action]} onClose={onClose} busy={isSubmitting}>
    <form onSubmit={submit} noValidate onChange={() => onDirtyChange(true)} className="space-y-5">
      <p className="text-sm leading-6 text-slate-600">{action === 'reschedule' ? 'Chọn lịch mới theo giờ Đà Nẵng (UTC+7). Ghi chú sẽ hiển thị cho người xem.' : `Xác nhận ${action === 'cancel' ? 'hủy' : 'hoãn'} “${event.name}”? Ghi chú sẽ hiển thị cho người xem.${action === 'cancel' ? ' Sự kiện đã hủy không thể đổi lịch hoặc đăng lại.' : ''}`}</p>
      <fieldset disabled={isSubmitting} className="space-y-5">
        {action === 'reschedule' && <div className="grid gap-4 sm:grid-cols-2">
          <Field id="change-startAt" label="Bắt đầu mới *" error={errors.startAt?.message}>
            <input id="change-startAt" type="datetime-local" {...register('startAt')} className={inputClass} aria-invalid={!!errors.startAt} aria-describedby="change-startAt-error" />
          </Field>
          <Field id="change-endAt" label="Kết thúc mới *" error={errors.endAt?.message}>
            <input id="change-endAt" type="datetime-local" {...register('endAt')} className={inputClass} aria-invalid={!!errors.endAt} aria-describedby="change-endAt-error" />
          </Field>
        </div>}
        <Field id="changeNote" label="Ghi chú thay đổi *" error={errors.changeNote?.message}>
          <textarea id="changeNote" rows={4} {...register('changeNote')} className={inputClass} placeholder="Lý do thay đổi và thông tin người tham dự cần biết…" aria-invalid={!!errors.changeNote} aria-describedby="changeNote-error" />
        </Field>
      </fieldset>
      {serverError && <p role="alert" className="text-sm text-red-600">{serverError}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" disabled={isSubmitting} onClick={onClose} className={buttonClass}>Quay lại</button>
        <button type="submit" disabled={isSubmitting} className={action === 'cancel' ? `${primaryClass} bg-red-600! hover:bg-red-700!` : primaryClass}>{isSubmitting && <Spinner />}{isSubmitting ? 'Đang cập nhật…' : `Xác nhận ${action === 'reschedule' ? 'đổi lịch' : action === 'postpone' ? 'hoãn' : 'hủy'}`}</button>
      </div>
    </form>
  </Modal>;
}
