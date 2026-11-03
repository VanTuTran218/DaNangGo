'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { PartnerPlace } from '@/types/partner';
import { getDistricts, type CategoryItem } from '@/lib/api/categories';
import {
  createAccommodation,
  updateAccommodation,
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
} from 'lucide-react';

interface AccommodationFormProps {
  initialData?: PartnerPlace;
  onSuccess?: (placeId: number) => void;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 text-sm bg-slate-50 border rounded-2xl focus:bg-white focus:outline-none transition-all disabled:opacity-60 ${
    hasError
      ? 'border-rose-400 ring-2 ring-rose-400/20'
      : 'border-slate-300 focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500'
  }`;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1">
      <AlertCircle className="w-3.5 h-3.5" /> {msg}
    </p>
  );
}

export default function AccommodationForm({ initialData, onSuccess }: AccommodationFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);
  const isLocked = initialData?.status === 'LOCKED';

  const [districts, setDistricts] = useState<CategoryItem[]>([]);

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
  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
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
      .catch(() => setDistricts([]));
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
    if (bookingUrl && !/^https?:\/\//i.test(bookingUrl))
      e.bookingUrl = 'Link phải bắt đầu bằng http:// hoặc https://';
    if (images.length === 0) e.images = 'Vui lòng thêm ít nhất 1 ảnh.';
    if (!isEditing) {
      rooms.forEach((r, i) => {
        if (!r.name.trim()) e[`room-${i}`] = 'Tên loại phòng là bắt buộc.';
        else if (r.capacity < 1 || r.roomCount < 1 || r.pricePerNight < 0)
          e[`room-${i}`] = 'Sức chứa, số phòng phải ≥ 1 và giá không âm.';
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLocked || submitting) return;
    if (!validate()) {
      setToast({ type: 'error', title: 'Thiếu thông tin', message: 'Vui lòng kiểm tra các trường được đánh dấu đỏ.' });
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {isLocked && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          Cơ sở đang bị Admin khóa — bạn không thể chỉnh sửa cho đến khi được mở khóa.
        </div>
      )}

      <fieldset disabled={isLocked} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Thông tin cơ bản */}
          <FormSection
            icon={<Building2 className="w-5 h-5" />}
            title="1. Thông tin cơ sở lưu trú"
            description="Tên, loại hình, hạng sao và giờ nhận/trả phòng"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên cơ sở <span className="text-rose-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={200}
                  placeholder="VD: Khách sạn Sông Hàn, Homestay Mộc Miên..."
                  className={inputCls(!!errors.name)}
                />
                <FieldError msg={errors.name} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Loại hình</label>
                <div className="flex flex-wrap gap-2">
                  {ACCOMMODATION_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAccommodationType(opt.value)}
                      aria-pressed={accommodationType === opt.value}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        accommodationType === opt.value
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-teal-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hạng sao</label>
                  <select
                    value={starRating ?? ''}
                    onChange={(e) => setStarRating(e.target.value ? Number(e.target.value) : null)}
                    className={inputCls()}
                  >
                    <option value="">Không xếp hạng</option>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <option key={s} value={s}>
                        {s} sao
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Giờ nhận phòng</label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className={inputCls(!!errors.checkInTime)}
                  />
                  <FieldError msg={errors.checkInTime} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Giờ trả phòng</label>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className={inputCls(!!errors.checkOutTime)}
                  />
                  <FieldError msg={errors.checkOutTime} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mô tả</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Giới thiệu không gian, vị trí, trải nghiệm lưu trú..."
                  className={inputCls()}
                />
              </div>
            </div>
          </FormSection>

          {/* 2. Địa chỉ */}
          <FormSection
            icon={<MapPin className="w-5 h-5" />}
            title="2. Địa chỉ & Vị trí"
            description="Quận/huyện, địa chỉ và tọa độ trên bản đồ"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quận / Huyện <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={districtId ?? ''}
                    onChange={(e) => setDistrictId(Number(e.target.value) || undefined)}
                    className={inputCls(!!errors.districtId)}
                  >
                    <option value="">-- Chọn quận/huyện --</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <FieldError msg={errors.districtId} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Địa chỉ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    maxLength={255}
                    placeholder="VD: 120 Võ Nguyên Giáp, Sơn Trà"
                    className={inputCls(!!errors.address)}
                  />
                  <FieldError msg={errors.address} />
                </div>
              </div>
              <MapPicker lat={lat} lng={lng} placeName={name} onLatChange={setLat} onLngChange={setLng} />
            </div>
          </FormSection>

          {/* 3. Tiện nghi */}
          <FormSection
            icon={<Sparkles className="w-5 h-5" />}
            title="3. Tiện nghi"
            description="Chọn các tiện nghi cơ sở đang cung cấp"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITY_LIST.map((a) => {
                const checked = amenityIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAmenity(a.id)}
                    aria-pressed={checked}
                    className={`p-3 rounded-xl border text-left text-xs flex items-center gap-2 transition-all ${
                      checked
                        ? 'border-teal-500 bg-teal-50 text-teal-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" />}
                    </span>
                    {a.name}
                  </button>
                );
              })}
            </div>
          </FormSection>

          {/* 4. Loại phòng ban đầu (chỉ khi tạo mới) */}
          {!isEditing && (
            <FormSection
              icon={<Bed className="w-5 h-5" />}
              title="4. Loại phòng ban đầu"
              description="Có thể thêm/sửa chi tiết sau trong tab Loại phòng & Bảng giá"
            >
              <div className="space-y-3">
                {rooms.map((room, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Loại phòng #{idx + 1}</span>
                      {rooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setRooms((prev) => prev.filter((_, i) => i !== idx))}
                          aria-label="Xóa loại phòng"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <label className="col-span-2 font-semibold text-slate-600">
                        Tên phòng
                        <input
                          value={room.name}
                          onChange={(e) => updateRoomAt(idx, { name: e.target.value })}
                          maxLength={100}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                        />
                      </label>
                      <label className="font-semibold text-slate-600">
                        Sức chứa
                        <input
                          type="number"
                          min={1}
                          max={255}
                          value={room.capacity}
                          onChange={(e) => updateRoomAt(idx, { capacity: Number(e.target.value) })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                        />
                      </label>
                      <label className="font-semibold text-slate-600">
                        Số phòng
                        <input
                          type="number"
                          min={1}
                          value={room.roomCount}
                          onChange={(e) => updateRoomAt(idx, { roomCount: Number(e.target.value) })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                        />
                      </label>
                      <label className="col-span-2 font-semibold text-slate-600">
                        Giá mỗi đêm (₫)
                        <input
                          type="number"
                          min={0}
                          step={10000}
                          value={room.pricePerNight}
                          onChange={(e) => updateRoomAt(idx, { pricePerNight: Number(e.target.value) })}
                          className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-teal-700"
                        />
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
                  className="w-full py-2.5 rounded-2xl border border-dashed border-teal-300 text-teal-700 bg-teal-50/50 hover:bg-teal-50 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Thêm loại phòng
                </button>
              </div>
            </FormSection>
          )}
        </div>

        <div className="space-y-6">
          <FormSection
            icon={<ImageIcon className="w-5 h-5" />}
            title="Hình ảnh"
            description="Ảnh đầu tiên là ảnh bìa"
          >
            <ImageUploader images={images} onChange={setImages} error={errors.images} />
          </FormSection>

          <FormSection
            icon={<PhoneCall className="w-5 h-5" />}
            title="Liên hệ & Đặt phòng"
            description="Hotline, website và link đặt phòng"
          >
            <div className="space-y-4">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                placeholder="Số điện thoại lễ tân"
                className={inputCls()}
              />
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                maxLength={255}
                placeholder="Website (https://...)"
                className={inputCls()}
              />
              <div>
                <input
                  value={bookingUrl}
                  onChange={(e) => setBookingUrl(e.target.value)}
                  maxLength={255}
                  placeholder="Link đặt phòng (https://...)"
                  className={inputCls(!!errors.bookingUrl)}
                />
                <FieldError msg={errors.bookingUrl} />
              </div>
            </div>
          </FormSection>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <button
              type="submit"
              disabled={submitting || isLocked}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-teal-600/20 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                <Save className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isEditing ? 'Lưu thay đổi' : 'Tạo cơ sở lưu trú'}
            </button>
            <Link
              href="/partner/co-so"
              className="block w-full py-3 text-center rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
            >
              Hủy & quay lại
            </Link>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
