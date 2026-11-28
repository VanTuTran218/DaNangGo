'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AiDescriptionAssistant } from '@/components/ai/AiTools';
import type { PartnerPlace } from '@/types/partner';
import { getDistricts, type CategoryItem } from '@/lib/api/categories';
import {
  createAccommodation,
  updateAccommodation,
  accommodationTypeLabel,
  AMENITY_LIST,
  ACCOMMODATION_TYPE_OPTIONS,
  type AccommodationType,
  type RoomInput,
} from '@/lib/api/accommodations';
import FormSection from './FormSection';
import ImageUploader from './ImageUploader';
import MapPicker from './MapPicker';
import ToastNotification, { type ToastItem } from '@/components/ui/ToastNotification';
import {
  Building2,
  Bed,
  PhoneCall,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Save,
  Send,
  Lock,
  Check,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';

interface AccommodationFormProps {
  initialData?: PartnerPlace;
  onSuccess?: (placeId: number) => void;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 text-sm bg-slate-50 border rounded-2xl focus:bg-white focus:outline-none transition-all disabled:opacity-60 ${
    hasError
      ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20'
      : 'border-slate-300 focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500'
  }`;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <motion.p
      initial={{ x: -4 }}
      animate={{ x: [-4, 4, -2, 2, 0] }}
      className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1"
    >
      <AlertCircle className="w-3.5 h-3.5" /> {msg}
    </motion.p>
  );
}

export default function AccommodationForm({ initialData, onSuccess }: AccommodationFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);
  const isLocked = initialData?.status === 'LOCKED';

  const [districts, setDistricts] = useState<CategoryItem[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);

  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [districtId, setDistrictId] = useState<number | undefined>(initialData?.districtId);
  const [accommodationType, setAccommodationType] = useState<AccommodationType>(
    initialData?.accommodationType ?? 'HOTEL',
  );
  const [starRating, setStarRating] = useState<number | null>(initialData?.starRating ?? null);
  const [checkInTime, setCheckInTime] = useState(initialData?.checkInTime ?? '14:00');
  const [checkOutTime, setCheckOutTime] = useState(initialData?.checkOutTime ?? '12:00');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [website, setWebsite] = useState(initialData?.website ?? '');
  const [bookingUrl, setBookingUrl] = useState(initialData?.bookingUrl ?? '');
  const [amenityIds, setAmenityIds] = useState<number[]>(initialData?.amenityIds ?? [1, 4]);
  const [images, setImages] = useState<string[]>(
    initialData?.images && initialData.images.length > 0
      ? initialData.images
      : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80']
  );
  const [lat, setLat] = useState(initialData?.lat ?? 16.0544);
  const [lng, setLng] = useState(initialData?.lng ?? 108.2022);
  const [rooms, setRooms] = useState<RoomInput[]>([
    { name: 'Phòng Tiêu chuẩn', capacity: 2, pricePerNight: 600000, roomCount: 5 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastItem | null>(null);

  useEffect(() => {
    getDistricts()
      .then((data) => {
        setDistricts(data);
        setDistrictId((cur) => cur ?? data[0]?.id);
      })
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, []);

  const toggleAmenity = (id: number) =>
    setAmenityIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  const updateRoomAt = (idx: number, patch: Partial<RoomInput>) =>
    setRooms((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Vui lòng nhập tên cơ sở lưu trú.';
    if (!address.trim()) e.address = 'Vui lòng nhập địa chỉ.';
    if (!districtId) e.districtId = 'Vui lòng chọn quận/huyện.';
    if (checkInTime && !TIME_RE.test(checkInTime)) e.checkInTime = 'Giờ phải có dạng HH:mm.';
    if (checkOutTime && !TIME_RE.test(checkOutTime)) e.checkOutTime = 'Giờ phải có dạng HH:mm.';
    if (phone.trim()) {
      const cleanedPhone = phone.trim().replace(/\s+/g, '');
      if (!/^\d{8,15}$/.test(cleanedPhone)) {
        e.phone = 'Số điện thoại cơ sở không hợp lệ (chỉ chấp nhận chữ số)';
      }
    }
    if (website.trim() && !/^https?:\/\//i.test(website.trim())) {
      e.website = 'Website phải bắt đầu bằng http:// hoặc https://';
    }
    if (bookingUrl.trim() && !/^https?:\/\//i.test(bookingUrl.trim())) {
      e.bookingUrl = 'Link đặt phòng phải bắt đầu bằng http:// hoặc https://';
    }
    if (images.length === 0) e.images = 'Vui lòng thêm ít nhất 1 ảnh.';
    if (!isEditing) {
      rooms.forEach((r, i) => {
        if (!r.name.trim()) e[`room-${i}`] = 'Tên loại phòng là bắt buộc.';
        else if (r.capacity < 1 || r.roomCount < 1 || r.pricePerNight < 0)
          e[`room-${i}`] = 'Sức chứa, số phòng phải ≥ 1 và giá không âm.';
      });
    }
    setErrors(e);
    const priorityOrder = ['bookingUrl', 'phone', 'website', 'checkInTime', 'checkOutTime', 'name', 'address', 'districtId', 'images'];
    const firstKey = priorityOrder.find((k) => Boolean(e[k])) || Object.keys(e)[0];
    if (firstKey && typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        const el = document.getElementById(`acc-field-${firstKey}`);
        if (el) {
          const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 160);
          window.scrollTo({ top, behavior: 'smooth' });
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof (el as HTMLElement).focus === 'function') {
            (el as HTMLElement).focus({ preventScroll: true });
          }
        }
      });
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (isLocked || submitting) return;
    if (!validate()) {
      setToast({
        type: 'error',
        title: 'Dữ liệu chưa hợp lệ',
        message: 'Vui lòng kiểm tra và sửa các trường thông tin được đánh dấu đỏ.',
      });
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      address: address.trim(),
      districtId: Number(districtId),
      latitude: lat,
      longitude: lng,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      bookingUrl: bookingUrl.trim() || undefined,
      accommodationType,
      starRating,
      checkInTime: checkInTime || null,
      checkOutTime: checkOutTime || null,
      amenityIds,
      images,
    };

    setSubmitting(true);
    setToast(null);
    try {
      if (isEditing && initialData) {
        const placeId = Number(initialData.placeId ?? initialData.id);
        await updateAccommodation(placeId, payload);
        setToast({ type: 'success', title: 'Đã lưu', message: 'Thông tin cơ sở lưu trú đã được cập nhật.' });
        onSuccess?.(placeId);
      } else {
        const placeId = await createAccommodation({
          ...payload,
          rooms: rooms.map((r) => ({ ...r, name: r.name.trim() })),
        });
        setToast({ type: 'success', title: 'Tạo thành công', message: 'Đang chuyển sang trang quản lý loại phòng...' });
        if (onSuccess) onSuccess(placeId);
        else setTimeout(() => router.push(`/partner/co-so/${placeId}/sua?tab=rooms`), 1000);
      }
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Không thể lưu',
        message: err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDistrictName = districts.find((d) => d.id === districtId)?.name;
  const selectedTypeLabel = accommodationTypeLabel(accommodationType);
  const minRoomPrice = isEditing
    ? initialData?.priceMin ?? 0
    : rooms.length > 0
    ? Math.min(...rooms.map((r) => Number(r.pricePerNight) || 0))
    : 0;

  const checklist = [
    { label: 'Tên & mô tả nơi lưu trú', valid: Boolean(name.trim() && description.trim()) },
    { label: 'Địa chỉ & quận/huyện', valid: Boolean(address.trim() && districtId) },
    { label: 'Loại hình & giờ nhận/trả phòng', valid: Boolean(accommodationType && checkInTime && checkOutTime) },
    { label: 'Tiện nghi phục vụ khách', valid: amenityIds.length > 0 },
    ...(isEditing
      ? []
      : [
          {
            label: 'Loại phòng & giá mỗi đêm',
            valid: rooms.length > 0 && rooms.every((r) => r.name.trim() && r.pricePerNight >= 0 && r.capacity >= 1),
          },
        ]),
    { label: 'Ít nhất 1 hình ảnh', valid: images.length > 0 },
    { label: 'Vị trí tọa độ bản đồ', valid: Boolean(lat && lng) },
  ];
  const completedCount = checklist.filter((c) => c.valid).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Cảnh báo khi cơ sở lưu trú đang bị Admin khóa (LOCKED) */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-4 shadow-xs"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-rose-900">
              Cơ sở lưu trú đang bị Quản trị viên khóa (LOCKED)
            </h4>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              Địa điểm này hiện đang ở trạng thái khóa quản trị. Bạn chỉ có quyền xem thông tin cơ sở mà không thể thực hiện chỉnh sửa, ẩn/hiện hoặc cập nhật danh sách phòng. Vui lòng liên hệ Quản trị viên DanangGo nếu cần hỗ trợ mở khóa.
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Grid: 8/12 Form Sections + 4/12 Sticky Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ==================== LEFT 8/12: FORM SECTIONS ==================== */}
        <fieldset disabled={isLocked} className="lg:col-span-8 space-y-6">
          {/* SECTION 1: Thông tin cơ bản */}
          <FormSection
            icon={<Building2 className="w-5 h-5" />}
            title="1. Thông tin cơ bản"
            description="Tên nơi lưu trú, loại hình, hạng sao, giờ nhận/trả phòng và giới thiệu không gian"
          >
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Tên cơ sở lưu trú *</span>
                  {name.trim() && !errors.name && (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Hợp lệ
                    </span>
                  )}
                </label>
                <input
                  id="acc-field-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  maxLength={200}
                  placeholder="VD: Khách sạn Sông Hàn, Homestay Mộc Miên, Resort Mỹ Khê..."
                  className={inputCls(!!errors.name)}
                />
                <FieldError msg={errors.name} />
              </div>

              {/* Quận / Huyện & Địa chỉ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quận / Huyện Đà Nẵng *
                  </label>
                  {loadingDistricts ? (
                    <div className="h-11 bg-slate-100 rounded-2xl animate-pulse" />
                  ) : (
                    <select
                      id="acc-field-districtId"
                      value={districtId ?? ''}
                      onChange={(e) => {
                        setDistrictId(Number(e.target.value) || undefined);
                        if (errors.districtId) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.districtId;
                            return next;
                          });
                        }
                      }}
                      className={`${inputCls(!!errors.districtId)} font-medium text-slate-800`}
                    >
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <FieldError msg={errors.districtId} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Loại hình lưu trú
                  </label>
                  <select
                    value={accommodationType}
                    onChange={(e) => setAccommodationType(e.target.value as AccommodationType)}
                    className={`${inputCls()} font-medium text-slate-800`}
                  >
                    {ACCOMMODATION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Địa chỉ chi tiết */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Địa chỉ chính xác *</span>
                  {address.trim() && !errors.address && (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Hợp lệ
                    </span>
                  )}
                </label>
                <input
                  id="acc-field-address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.address;
                        return next;
                      });
                    }
                  }}
                  maxLength={255}
                  placeholder="VD: 120 Võ Nguyên Giáp, Phường Phước Mỹ, Sơn Trà"
                  className={inputCls(!!errors.address)}
                />
                <FieldError msg={errors.address} />
              </div>

              {/* Hạng sao & Giờ nhận/trả phòng */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hạng sao</label>
                  <select
                    value={starRating ?? ''}
                    onChange={(e) => setStarRating(e.target.value ? Number(e.target.value) : null)}
                    className={`${inputCls()} font-medium text-slate-800`}
                  >
                    <option value="">Không xếp hạng</option>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <option key={s} value={s}>
                        {s} sao {'⭐'.repeat(s)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Giờ nhận phòng (Check-in)</label>
                  <input
                    id="acc-field-checkInTime"
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className={inputCls(!!errors.checkInTime)}
                  />
                  <FieldError msg={errors.checkInTime} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Giờ trả phòng (Check-out)</label>
                  <input
                    id="acc-field-checkOutTime"
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className={inputCls(!!errors.checkOutTime)}
                  />
                  <FieldError msg={errors.checkOutTime} />
                </div>
              </div>

              {/* Mô tả chi tiết + AI Assistant */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Mô tả cơ sở & Trải nghiệm lưu trú</span>
                  <span className="text-[11px] text-slate-400">
                    {description.length} ký tự
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Giới thiệu không gian nghỉ dưỡng, tầm nhìn hướng biển/sông Hàn, tiện ích nổi bật và dịch vụ chăm sóc khách..."
                  className={`${inputCls()} leading-relaxed`}
                />
                {!isLocked && (
                  <AiDescriptionAssistant
                    key={name}
                    name={name}
                    type="stay"
                    onApply={setDescription}
                  />
                )}
              </div>
            </div>
          </FormSection>

          {/* SECTION 2: Tiện nghi & Loại phòng ban đầu */}
          <FormSection
            icon={<Sparkles className="w-5 h-5" />}
            title="2. Tiện nghi & Loại phòng lưu trú"
            description="Các tiện ích đi kèm và cấu hình bảng giá loại phòng phục vụ du khách"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tiện nghi nổi bật tại cơ sở
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {AMENITY_LIST.map((a) => {
                    const checked = amenityIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAmenity(a.id)}
                        aria-pressed={checked}
                        className={`p-3 rounded-2xl border text-left text-xs flex items-center gap-2.5 transition-all ${
                          checked
                            ? 'border-teal-500 bg-teal-50 text-teal-900 font-bold shadow-2xs'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            checked ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </span>
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isEditing && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-teal-600" />
                        Danh sách loại phòng ban đầu
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Bạn có thể thêm hoặc chỉnh sửa chi tiết từng hạng phòng sau khi tạo trong tab Loại phòng & Bảng giá.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {rooms.map((room, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Loại phòng #{idx + 1}</span>
                          {rooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setRooms((prev) => prev.filter((_, i) => i !== idx))}
                              aria-label="Xóa loại phòng"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <label className="col-span-2 font-bold text-slate-700">
                            Tên loại phòng *
                            <input
                              id={`acc-field-room-${idx}`}
                              value={room.name}
                              onChange={(e) => updateRoomAt(idx, { name: e.target.value })}
                              maxLength={100}
                              placeholder="VD: Phòng Deluxe Hướng Biển"
                              className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                            />
                          </label>
                          <label className="font-bold text-slate-700">
                            Sức chứa (khách)
                            <input
                              type="number"
                              min={1}
                              max={255}
                              value={room.capacity}
                              onChange={(e) => updateRoomAt(idx, { capacity: Number(e.target.value) })}
                              className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                            />
                          </label>
                          <label className="font-bold text-slate-700">
                            Số lượng phòng
                            <input
                              type="number"
                              min={1}
                              value={room.roomCount}
                              onChange={(e) => updateRoomAt(idx, { roomCount: Number(e.target.value) })}
                              className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                            />
                          </label>
                          <label className="col-span-2 font-bold text-slate-700">
                            Giá mỗi đêm (VNĐ) *
                            <div className="relative mt-1.5">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-600 font-bold text-sm">
                                ₫
                              </span>
                              <input
                                type="number"
                                min={0}
                                step={10000}
                                value={room.pricePerNight}
                                onChange={(e) => updateRoomAt(idx, { pricePerNight: Number(e.target.value) })}
                                className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                              />
                            </div>
                          </label>
                        </div>
                        <FieldError msg={errors[`room-${idx}`]} />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setRooms((prev) => [...prev, { name: '', capacity: 2, pricePerNight: 800000, roomCount: 1 }])
                      }
                      className="w-full py-2.5 rounded-2xl border border-dashed border-teal-300 text-teal-700 bg-teal-50/50 hover:bg-teal-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Thêm loại phòng mới
                    </button>
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* SECTION 3: Liên hệ & Đặt phòng */}
          <FormSection
            icon={<PhoneCall className="w-5 h-5" />}
            title="3. Liên hệ & Đặt phòng trực tuyến"
            description="Số điện thoại lễ tân và liên kết đặt phòng phục vụ khách du lịch"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số điện thoại lễ tân / Liên hệ
                  </label>
                  <input
                    id="acc-field-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.phone;
                          return next;
                        });
                      }
                    }}
                    maxLength={20}
                    placeholder="VD: 0905 123 456"
                    className={`${inputCls(!!errors.phone)} font-mono`}
                  />
                  <FieldError msg={errors.phone} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Trang web cơ sở (Website)
                  </label>
                  <input
                    id="acc-field-website"
                    type="text"
                    value={website}
                    onChange={(e) => {
                      setWebsite(e.target.value);
                      if (errors.website) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.website;
                          return next;
                        });
                      }
                    }}
                    maxLength={255}
                    placeholder="https://khachsandanang.vn"
                    className={`${inputCls(!!errors.website)} font-mono text-xs`}
                  />
                  <FieldError msg={errors.website} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Liên kết đặt phòng trực tuyến (Booking URL)</span>
                  <span className="text-[11px] text-slate-400">
                    Bắt đầu bằng http:// hoặc https://
                  </span>
                </label>
                <input
                  id="acc-field-bookingUrl"
                  type="text"
                  value={bookingUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBookingUrl(val);
                    const trimmed = val.trim();
                    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
                      setErrors((prev) => ({
                        ...prev,
                        bookingUrl: 'Link đặt phòng phải bắt đầu bằng http:// hoặc https://',
                      }));
                    } else if (errors.bookingUrl) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.bookingUrl;
                        return next;
                      });
                    }
                  }}
                  maxLength={255}
                  placeholder="https://booking.com/hotel/vn/..., hoặc https://traveloka.com/..."
                  className={`${inputCls(!!errors.bookingUrl)} font-mono text-xs`}
                />
                <FieldError msg={errors.bookingUrl} />
              </div>
            </div>
          </FormSection>

          {/* SECTION 4: Hình ảnh */}
          <FormSection
            icon={<ImageIcon className="w-5 h-5" />}
            title="4. Hình ảnh quảng bá cơ sở"
            description="Ảnh bìa chính và các hình ảnh phòng nghỉ, sảnh đón khách thu hút du khách"
          >
            <div id="acc-field-images" tabIndex={-1}>
              <ImageUploader images={images} onChange={setImages} error={errors.images} />
            </div>
          </FormSection>

          {/* SECTION 5: Vị trí bản đồ */}
          <FormSection
            icon={<MapPin className="w-5 h-5" />}
            title="5. Vị trí trên bản đồ du lịch Đà Nẵng"
            description="Tọa độ GPS giúp khách du lịch chỉ đường và định vị trên bản đồ tương tác"
          >
            <MapPicker lat={lat} lng={lng} placeName={name} onLatChange={setLat} onLngChange={setLng} />
          </FormSection>
        </fieldset>

        {/* ==================== RIGHT 4/12: STICKY SUMMARY & ACTIONS ==================== */}
        <div className="lg:col-span-4 sticky top-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs overflow-hidden space-y-4"
          >
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Xem trước hiển thị thẻ
            </h3>

            {/* Thumbnail Preview */}
            <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
              {images[0] ? (
                <Image
                  src={images[0]}
                  alt="Ảnh xem trước"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-teal-600 font-bold text-xs bg-teal-50">
                  Chưa có ảnh
                </div>
              )}
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-xs text-teal-800 text-[11px] font-bold shadow-xs">
                {selectedTypeLabel}
                {starRating ? ` • ${starRating} ⭐` : ''}
              </span>
            </div>

            {/* Title & Info */}
            <div>
              <h4 className="font-extrabold text-base text-slate-900 truncate">
                {name.trim() || 'Tên nơi lưu trú chưa nhập'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {selectedDistrictName || 'Đà Nẵng'} - {address.trim() || 'Chưa có địa chỉ'}
              </p>
              <p className="text-xs font-bold text-orange-600 mt-2">
                Từ ₫{minRoomPrice.toLocaleString('vi-VN')} / đêm
              </p>
            </div>

            {/* Progress Bar & Checklist */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Tiến độ điền thông tin</span>
                <span className="text-teal-700">{progressPercent}%</span>
              </div>

              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                {checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-[11px] font-medium"
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        item.valid
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {item.valid ? (
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      ) : (
                        <span className="w-1 h-1 rounded-full bg-slate-400" />
                      )}
                    </div>
                    <span
                      className={
                        item.valid ? 'text-slate-700 font-semibold' : 'text-slate-400'
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons (Desktop) */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 hidden sm:block">
              {isLocked ? (
                <button
                  type="button"
                  disabled
                  title="Cơ sở đang bị Admin khóa"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-400 font-bold text-xs sm:text-sm cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>Cơ sở đang bị Admin khóa</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/25 transition-all active:scale-97 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu thông tin...</span>
                    </>
                  ) : isEditing ? (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Tạo cơ sở lưu trú</span>
                    </>
                  )}
                </button>
              )}

              <Link
                href="/partner/co-so"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Hủy và quay lại danh sách</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 flex items-center justify-between gap-3 shadow-lg">
        <Link
          href="/partner/co-so"
          className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
        >
          Hủy
        </Link>
        {isLocked ? (
          <button
            type="button"
            disabled
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-400 font-bold text-xs border border-rose-200 cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            <span>Cơ sở đang bị Admin khóa</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              'Lưu thay đổi'
            ) : (
              'Tạo cơ sở lưu trú'
            )}
          </button>
        )}
      </div>
    </form>
  );
}
