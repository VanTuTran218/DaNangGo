'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bed, Plus, Edit2, EyeOff, Users, Building, AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import {
  addRoom,
  updateRoom,
  hideRoom,
  getRooms,
  type RoomInput,
  type RoomTypeItem,
} from '@/lib/api/accommodations';
import ToastNotification, { type ToastItem } from '@/components/ui/ToastNotification';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface RoomManagerProps {
  placeId: number;
  isLocked?: boolean;
}

const EMPTY_ROOM: RoomInput = { name: '', capacity: 2, pricePerNight: 500000, originalPrice: null, roomCount: 1 };
const fmt = (n: number) => n.toLocaleString('vi-VN');

export default function RoomManager({ placeId, isLocked = false }: RoomManagerProps) {
  const [rooms, setRooms] = useState<RoomTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastItem | null>(null);

  const [editing, setEditing] = useState<RoomTypeItem | null>(null);
  const [form, setForm] = useState<RoomInput | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [hiding, setHiding] = useState<RoomTypeItem | null>(null);
  const [hideLoading, setHideLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRooms(await getRooms(placeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách loại phòng.');
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openForm = (room?: RoomTypeItem) => {
    setEditing(room ?? null);
    setForm(room ? { ...room } : { ...EMPTY_ROOM });
    setFormError('');
  };
  const closeForm = () => {
    if (!saving) setForm(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) return setFormError('Vui lòng nhập tên loại phòng.');
    if (form.capacity < 1 || form.roomCount < 1) return setFormError('Sức chứa và số phòng phải ≥ 1.');
    if (form.pricePerNight < 0) return setFormError('Giá không được âm.');
    if (form.originalPrice != null && form.originalPrice < form.pricePerNight)
      return setFormError('Giá gốc không được thấp hơn giá bán.');

    const payload: RoomInput = { ...form, name: form.name.trim() };
    setSaving(true);
    try {
      if (editing) await updateRoom(placeId, editing.room_type_id, payload);
      else await addRoom(placeId, payload);
      setToast({ type: 'success', title: 'Thành công', message: editing ? 'Đã cập nhật loại phòng.' : 'Đã thêm loại phòng.' });
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể lưu loại phòng.');
    } finally {
      setSaving(false);
    }
  };

  const confirmHide = async () => {
    if (!hiding) return;
    setHideLoading(true);
    try {
      await hideRoom(placeId, hiding.room_type_id);
      setToast({ type: 'success', title: 'Đã ẩn', message: `Loại phòng "${hiding.name}" đã được ẩn.` });
      setHiding(null);
      await load();
    } catch (err) {
      setToast({ type: 'error', title: 'Lỗi', message: err instanceof Error ? err.message : 'Không thể ẩn loại phòng.' });
    } finally {
      setHideLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bed className="w-5 h-5 text-teal-600" /> Loại phòng & Bảng giá
          </h3>
          <p className="text-xs text-slate-500 mt-1">Thêm, sửa giá theo đêm, sức chứa và số lượng phòng.</p>
        </div>
        <button
          type="button"
          onClick={() => openForm()}
          disabled={isLocked}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          <Plus className="w-4 h-4" /> Thêm loại phòng
        </button>
      </div>

      {isLocked && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Cơ sở đang bị Admin khóa — không thể thay đổi loại phòng.
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center text-xs text-slate-500">
          <Loader2 className="w-7 h-7 animate-spin text-teal-600 mx-auto mb-2" /> Đang tải loại phòng...
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
          <p className="text-xs text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Thử lại
          </button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-dashed border-slate-300 text-center text-xs text-slate-500">
          Chưa có loại phòng nào đang hoạt động.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const discount =
              room.originalPrice && room.originalPrice > room.pricePerNight
                ? Math.round((1 - room.pricePerNight / room.originalPrice) * 100)
                : 0;
            return (
              <div key={room.room_type_id} className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-teal-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{room.name}</h4>
                  {discount > 0 && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600">-{discount}%</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {room.capacity} người</span>
                  <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {room.roomCount} phòng</span>
                </div>
                <div className="mt-3 p-3 bg-slate-50 rounded-2xl">
                  <span className="text-base font-extrabold text-teal-700">{fmt(room.pricePerNight)}₫</span>
                  <span className="text-xs text-slate-500">/đêm</span>
                  {discount > 0 && (
                    <span className="ml-2 text-xs text-slate-400 line-through">{fmt(room.originalPrice!)}₫</span>
                  )}
                </div>
                <div className="flex justify-end gap-1 pt-3 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openForm(room)}
                    disabled={isLocked}
                    title="Sửa loại phòng"
                    aria-label="Sửa loại phòng"
                    className="p-2 rounded-xl text-slate-600 hover:text-teal-600 hover:bg-teal-50 disabled:opacity-40"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHiding(room)}
                    disabled={isLocked}
                    title="Ẩn loại phòng"
                    aria-label="Ẩn loại phòng"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeForm}>
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Escape' && closeForm()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-form-title"
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 id="room-form-title" className="font-bold text-slate-900 text-sm">
                {editing ? 'Sửa loại phòng' : 'Thêm loại phòng'}
              </h3>
              <button type="button" onClick={closeForm} aria-label="Đóng" className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block font-bold text-slate-700">
              Tên loại phòng *
              <input
                autoFocus
                value={form.name}
                maxLength={100}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block font-bold text-slate-700">
                Sức chứa (người)
                <input
                  type="number" min={1} max={255} value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal"
                />
              </label>
              <label className="block font-bold text-slate-700">
                Số phòng
                <input
                  type="number" min={1} value={form.roomCount}
                  onChange={(e) => setForm({ ...form, roomCount: Number(e.target.value) })}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal"
                />
              </label>
              <label className="block font-bold text-slate-700">
                Giá mỗi đêm (₫)
                <input
                  type="number" min={0} step={10000} value={form.pricePerNight}
                  onChange={(e) => setForm({ ...form, pricePerNight: Number(e.target.value) })}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-teal-700"
                />
              </label>
              <label className="block font-bold text-slate-700">
                Giá gốc (tùy chọn)
                <input
                  type="number" min={0} step={10000} value={form.originalPrice ?? ''}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value === '' ? null : Number(e.target.value) })}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-normal"
                />
              </label>
            </div>

            {formError && (
              <p role="alert" className="text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {formError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeForm} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold">
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing ? 'Lưu thay đổi' : 'Thêm phòng'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(hiding)}
        onClose={() => setHiding(null)}
        onConfirm={confirmHide}
        title="Ẩn loại phòng"
        description={`Ẩn loại phòng "${hiding?.name ?? ''}"? Khách sẽ không còn thấy phòng này.`}
        confirmText="Ẩn phòng"
        variant="danger"
        loading={hideLoading}
      />
    </div>
  );
}
