'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Eye, Save, Send } from 'lucide-react';
import type { Event, EventAction } from '@/types/event';
import { canChangeStatus, EVENT_TYPES, STATUS_LABELS, TICKET_TYPES } from '@/types/event';
import { draftSchema, eventSchema, formatEventDate, isHttpUrl, toEvent, toFormValues, type ChangeValues, type EventFormValues } from '@/lib/events/schema';
import { changeEventStatus, createEvent, eventFieldErrors, updateEvent } from '@/services/events';
import PlaceSelect from './PlaceSelect';
import StatusChangeModal from './StatusChangeModal';
import EventPreviewModal from './EventPreviewModal';
import { useUnsavedChanges } from './useUnsavedChanges';
import { Field, EventImage, Spinner, inputClass, buttonClass, primaryClass } from './FormUI';

type TextField = 'name' | 'imageUrl' | 'shortDescription' | 'startAt' | 'endAt' | 'locationName' | 'address' | 'district' | 'ticketPriceDisplay' | 'ticketUrl' | 'registrationDeadline' | 'organizerName' | 'organizerContact' | 'officialSourceUrl';
type Toast = { kind: 'success' | 'error'; message: string };

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <h2 className="text-base font-bold text-slate-900">{title}</h2>
    {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
    <div className="mt-5 space-y-5">{children}</div>
  </section>;
}

export default function EventForm({ initialData }: { initialData?: Event }) {
  const [saved, setSaved] = useState(initialData);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [preview, setPreview] = useState<Event | null>(null);
  const [action, setAction] = useState<EventAction | null>(null);
  const [modalDirty, setModalDirty] = useState(false);
  const status = saved?.status ?? 'DRAFT';
  const editing = !!saved?.id;
  const { register, control, watch, getValues, getFieldState, setValue, setError, clearErrors, reset, handleSubmit, formState } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema), defaultValues: toFormValues(initialData), mode: 'onTouched', reValidateMode: 'onChange',
  });
  const { errors, isDirty, isSubmitting } = formState;
  const disabled = busy || isSubmitting;
  const [placeMode, ticketType, imageUrl] = watch(['placeMode', 'ticketType', 'imageUrl']);
  useUnsavedChanges(isDirty || modalDirty);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.kind === 'error' ? 9000 : 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  function reportError(error: unknown) {
    const knownFields = toFormValues();
    let focus = true;
    for (const [field, message] of Object.entries(eventFieldErrors(error))) {
      if (Object.hasOwn(knownFields, field)) {
        setError(field as FieldPath<EventFormValues>, { type: 'server', message }, { shouldFocus: focus });
        focus = false;
      }
    }
    setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Không thể lưu sự kiện. Vui lòng thử lại.' });
  }

  async function persist(values: EventFormValues, publish = false) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    clearErrors();
    try {
      const payload = toEvent(values, saved);
      let result = saved?.id
        ? await updateEvent(saved.id, payload)
        : await createEvent(payload, publish ? 'PUBLISHED' : 'DRAFT');
      setSaved(result);
      reset(toFormValues(result));
      if (publish && result.status === 'DRAFT' && result.id) {
        result = await changeEventStatus(result.id, 'PUBLISHED');
      }
      if (publish && result.status !== 'PUBLISHED') throw new Error('Máy chủ chưa xác nhận đăng sự kiện.');
      setSaved(result);
      reset(toFormValues(result));
      setToast({ kind: 'success', message: publish ? 'Đã đăng sự kiện thành công.' : result.status === 'DRAFT' ? 'Đã lưu bản nháp.' : 'Đã lưu thay đổi.' });
    } catch (error) { reportError(error); }
    finally { lock.current = false; setBusy(false); }
  }

  function validateDraft() {
    clearErrors();
    const result = draftSchema.safeParse(getValues());
    if (!result.success) {
      result.error.issues.forEach((issue, index) => {
        setError(issue.path.join('.') as FieldPath<EventFormValues>, { type: 'manual', message: issue.message }, { shouldFocus: index === 0 });
      });
      return;
    }
    return result.data;
  }

  async function confirmStatus(data: ChangeValues) {
    if (!saved?.id || !action || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const nextStatus = { reschedule: 'RESCHEDULED', postpone: 'POSTPONED', cancel: 'CANCELLED' } as const;
      const result = await changeEventStatus(saved.id, nextStatus[action], data);
      if (result.status !== nextStatus[action]) throw new Error('Máy chủ chưa xác nhận trạng thái mới.');
      setSaved(result);
      reset(toFormValues(result));
      setAction(null);
      setModalDirty(false);
      setToast({ kind: 'success', message: `Đã cập nhật: ${STATUS_LABELS[result.status].toLowerCase()}.` });
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Không thể cập nhật trạng thái.' });
      throw error; // Modal nhận lỗi theo từng trường.
    } finally { lock.current = false; setBusy(false); }
  }

  const errorFor = (name: FieldPath<EventFormValues>) => getFieldState(name, formState).error?.message;
  function textField(name: TextField, label: string, type = 'text', placeholder?: string, hint?: string) {
    const error = errorFor(name);
    return <Field id={name} label={label} error={error} hint={hint}>
      <input id={name} type={type} {...register(name)} readOnly={editing && status !== 'DRAFT' && (name === 'startAt' || name === 'endAt')} className={inputClass} placeholder={placeholder} aria-invalid={!!error}
        aria-describedby={[error ? `${name}-error` : '', hint ? `${name}-hint` : ''].filter(Boolean).join(' ') || undefined} />
    </Field>;
  }

  const invalid = () => setToast({ kind: 'error', message: 'Vui lòng kiểm tra các trường được đánh dấu.' });

  return <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
    <header className="space-y-4">
      <p className="text-sm text-slate-500">Quản trị <span className="px-2">/</span> <Link href="/admin/su-kien" className="underline">Sự kiện</Link> <span className="px-2">/</span> {editing ? 'Chỉnh sửa' : 'Tạo mới'}</p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-[#0284C7]"><CalendarDays className="size-6" /></span>
          <div><h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{editing ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</h1>
            <p className="mt-1 text-sm text-slate-500">Kết nối du khách với những trải nghiệm tại Đà Nẵng.</p></div>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${status === 'CANCELLED' ? 'bg-red-50 text-red-700' : status === 'DRAFT' ? 'bg-slate-200 text-slate-600' : 'bg-sky-100 text-sky-800'}`}>{STATUS_LABELS[status]}</span>
      </div>
      {saved?.updatedAt && <p className="text-xs text-slate-500">Lần lưu gần nhất: {formatEventDate(saved.updatedAt)} (UTC+7)</p>}
      {saved?.id && !initialData && <Link href={`/admin/su-kien/${encodeURIComponent(saved.id)}`} className="inline-block text-sm font-semibold text-[#0284C7] underline">Mở trang chỉnh sửa đã lưu ↗</Link>}
    </header>

    <form noValidate onSubmit={handleSubmit(values => persist(values, status === 'DRAFT'), invalid)} className="space-y-6">
      <fieldset disabled={disabled} className="min-w-0 space-y-6">
        <Section title="Thông tin sự kiện" subtitle="Các trường có dấu * là bắt buộc khi đăng.">
          {textField('name', 'Tên sự kiện *', 'text', 'Ví dụ: Lễ hội âm nhạc bên sông Hàn')}
          {textField('shortDescription', 'Mô tả ngắn *')}
          <Field id="description" label="Mô tả sự kiện" error={errors.description?.message}>
            <textarea id="description" rows={5} {...register('description')} className={`${inputClass} resize-y`} placeholder="Giới thiệu hoạt động, lịch trình và những điều du khách cần biết…" aria-invalid={!!errors.description} aria-describedby="description-error" />
          </Field>
          <Field id="eventType" label="Loại sự kiện *" error={errors.eventType?.message}>
            <select id="eventType" {...register('eventType')} className={inputClass} aria-invalid={!!errors.eventType} aria-describedby="eventType-error">
              <option value="">Chọn loại sự kiện</option>
              {Object.entries(EVENT_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </Field>
          {textField('imageUrl', 'Ảnh bìa (URL) *', 'url', 'https://…')}
          {isHttpUrl(imageUrl) && <EventImage url={imageUrl} />}
        </Section>

        <Section title="Thời gian & địa điểm" subtitle="Toàn bộ thời gian sử dụng giờ Đà Nẵng (UTC+7).">
          {editing && status !== 'DRAFT' && <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-800">Lịch đã công bố. Dùng nút “Đổi lịch” ở phần cập nhật trạng thái để chọn lịch mới và ghi rõ lý do.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {textField('startAt', 'Thời gian bắt đầu *', 'datetime-local')}
            {textField('endAt', 'Thời gian kết thúc *', 'datetime-local')}
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" {...register('isAllDay')} className="size-5 accent-sky-600" />Sự kiện cả ngày</label>
          {errors.isAllDay?.message && <p role="alert" className="text-sm text-red-600">{errors.isAllDay.message}</p>}
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-700">Địa điểm tổ chức *</legend>
            <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:flex-row sm:gap-6">
              <label className="flex min-h-8 cursor-pointer items-center gap-2"><input type="radio" value="existing" {...register('placeMode')} className="size-4 accent-sky-600" />Chọn địa điểm có sẵn</label>
              <label className="flex min-h-8 cursor-pointer items-center gap-2"><input type="radio" value="new" {...register('placeMode', { onChange: () => {
                setValue('placeId', '', { shouldDirty: true });
                setValue('latitude', undefined, { shouldDirty: true });
                setValue('longitude', undefined, { shouldDirty: true });
                clearErrors('placeId');
              } })} className="size-4 accent-sky-600" />Nhập địa điểm mới</label>
            </div>
          </fieldset>
          {placeMode === 'existing' ? <Field id="placeId" label="Địa điểm có sẵn *" error={errors.placeId?.message}>
            <Controller name="placeId" control={control} render={({ field }) => <PlaceSelect value={field.value} currentName={getValues('locationName')} onChange={place => {
              field.onChange(place?.id ?? '');
              const options = { shouldDirty: true, shouldValidate: true };
              setValue('locationName', place?.name ?? '', options);
              setValue('address', place?.address ?? '', options);
              setValue('district', place?.district ?? '', options);
              setValue('latitude', place?.latitude, options);
              setValue('longitude', place?.longitude, options);
            }} onBlur={field.onBlur} inputRef={field.ref} invalid={!!errors.placeId} describedBy={errors.placeId ? 'placeId-error' : undefined} />} />
          </Field> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {textField('locationName', 'Tên địa điểm *')}
            {textField('address', 'Địa chỉ *')}
            {textField('district', 'Quận/huyện *')}
          </div>
        </Section>

        <Section title="Vé & đăng ký">
          <Field id="ticketType" label="Hình thức tham dự" error={errors.ticketType?.message}>
            <select id="ticketType" {...register('ticketType')} className={inputClass} aria-invalid={!!errors.ticketType} aria-describedby={errors.ticketType ? 'ticketType-error' : undefined}>
              {Object.entries(TICKET_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </Field>
          {textField('ticketPriceDisplay', 'Giá vé hiển thị', 'text', 'Ví dụ: 50.000đ – 100.000đ')}
          {textField('ticketUrl', ticketType === 'FREE_REGISTRATION' ? 'Link đăng ký *' : 'Link mua vé hoặc đăng ký', 'url', 'https://…')}
          {textField('registrationDeadline', 'Hạn chót đăng ký (UTC+7)', 'datetime-local')}
        </Section>

        <Section title="Nguồn thông tin & hiển thị">
          {textField('organizerName', 'Ban tổ chức')}
          {textField('organizerContact', 'Liên hệ ban tổ chức')}
          {textField('officialSourceUrl', 'Nguồn chính thức', 'url', 'https://…')}
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold"><input type="checkbox" {...register('isFeatured')} className="size-5 rounded accent-sky-600" />Đánh dấu nổi bật</label>
        </Section>
      </fieldset>

      {editing && <Section title="Cập nhật trạng thái">
        {saved?.changeNote && <p className="whitespace-pre-wrap rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Ghi chú hiện tại: {saved.changeNote}</p>}
        <p className="text-sm text-slate-500">{status === 'CANCELLED' ? 'Sự kiện đã hủy. Không thể đổi lịch, hoãn hoặc đăng lại.' : status === 'DRAFT' ? 'Đăng sự kiện trước khi sử dụng các thao tác đổi lịch, hoãn hoặc hủy.' : isDirty ? 'Lưu thay đổi trước khi cập nhật trạng thái.' : 'Thay đổi trạng thái sẽ được lưu ngay, kèm ghi chú công khai.'}</p>
        <div className="flex flex-wrap gap-3">
          {(['reschedule', 'postpone', 'cancel'] as const).map(item => <button key={item} type="button" disabled={disabled || isDirty || !canChangeStatus(status, item)} onClick={() => { setModalDirty(false); setAction(item); }} className={`${buttonClass} ${item === 'cancel' ? 'border-red-200 text-red-600' : ''}`}>{item === 'reschedule' ? 'Đổi lịch' : item === 'postpone' ? 'Hoãn' : 'Hủy'}</button>)}
        </div>
      </Section>}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p role="status" className="text-xs text-slate-500">{disabled ? 'Đang xử lý…' : isDirty ? '● Có thay đổi chưa lưu' : 'Tất cả thay đổi đã được lưu hoặc chưa có chỉnh sửa.'}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex lg:flex-wrap">
            <button type="button" disabled={disabled} onClick={status === 'DRAFT' ? () => {
              const values = validateDraft();
              if (values) void persist(values);
            } : handleSubmit(values => persist(values), invalid)} className={buttonClass}>{busy ? <Spinner /> : <Save className="size-4" />}{status === 'DRAFT' ? 'Lưu bản nháp' : 'Lưu thay đổi'}</button>
            <button type="button" disabled={disabled} onClick={status === 'DRAFT' ? () => {
              const values = validateDraft();
              if (values) setPreview(toEvent(values, saved));
            } : handleSubmit(values => setPreview(toEvent(values, saved)), invalid)} className={buttonClass}><Eye className="size-4" />Xem trước</button>
            {status === 'DRAFT' && <button type="submit" disabled={disabled} className={primaryClass}>{busy ? <Spinner /> : <Send className="size-4" />}Đăng sự kiện</button>}
          </div>
        </div>
      </div>
    </form>

    <div aria-live="polite" aria-atomic="true" className="fixed right-4 bottom-4 z-[100] w-[calc(100%-2rem)] max-w-sm">
      {toast && <div role={toast.kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl border p-4 text-sm shadow-lg ${toast.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'}`}>
        <span className="flex-1">{toast.message}</span><button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)} className="px-1 font-bold">✕</button>
      </div>}
    </div>
    {preview && <EventPreviewModal event={preview} onClose={() => setPreview(null)} />}
    {action && saved && <StatusChangeModal key={action} action={action} event={saved} onConfirm={confirmStatus} onDirtyChange={setModalDirty} onClose={() => {
      if (!modalDirty || window.confirm('Bỏ các thay đổi chưa lưu trong hộp thoại?')) { setAction(null); setModalDirty(false); }
    }} />}
  </div>;
}
