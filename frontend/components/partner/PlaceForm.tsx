'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MapWrapper from '@/components/map/MapWrapper';
import type { PartnerPlace, PartnerPlaceCategory } from '@/types/partner';
import { createPartnerPlace, updatePartnerPlace } from '@/lib/api/partner';
import { Check, ChevronRight, ChevronLeft, Plus, Trash2, MapPin, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface PlaceFormProps {
  initialData?: PartnerPlace;
}

const AREAS = ['Sơn Trà', 'Ngũ Hành Sơn', 'Hải Châu', 'Thanh Khê', 'Cẩm Lệ', 'Liên Chiểu', 'Hòa Vang'];
const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const DEFAULT_AMENITIES = ['Wifi miễn phí', 'Điều hòa', 'Thanh toán thẻ', 'Bãi đỗ xe', 'Hồ bơi', 'View biển'];

export default function PlaceForm({ initialData }: PlaceFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [toastError, setToastError] = useState('');

  // Form Fields State
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<PartnerPlaceCategory>(initialData?.category || 'luutru');
  const [description, setDescription] = useState(initialData?.description || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [area, setArea] = useState(initialData?.area || 'Sơn Trà');

  const [priceMin, setPriceMin] = useState(initialData?.priceMin || 200000);
  const [priceMax, setPriceMax] = useState(initialData?.priceMax || 1500000);
  const [priceUnit, setPriceUnit] = useState(initialData?.priceUnit || 'đêm');
  const [openHours, setOpenHours] = useState(initialData?.openHours || '08:00 - 22:00');
  const [openDays, setOpenDays] = useState<string[]>(initialData?.openDays || DAYS);

  const [amenities, setAmenities] = useState<string[]>(initialData?.amenities || ['Wifi miễn phí', 'Điều hòa']);
  const [customAmenity, setCustomAmenity] = useState('');
  const [images, setImages] = useState<string[]>(
    initialData?.images || ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80']
  );
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [lat, setLat] = useState(initialData?.lat || 16.0544);
  const [lng, setLng] = useState(initialData?.lng || 108.2022);

  // Field Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};
    if (currentStep === 1) {
      if (!name.trim()) errs.name = 'Vui lòng nhập tên cơ sở.';
      if (!description.trim()) errs.description = 'Vui lòng nhập mô tả chi tiết.';
      if (!address.trim()) errs.address = 'Vui lòng nhập địa chỉ chính xác.';
    } else if (currentStep === 2) {
      if (priceMin <= 0) errs.priceMin = 'Giá tối thiểu phải lớn hơn 0.';
      if (openDays.length === 0) errs.openDays = 'Vui lòng chọn ít nhất 1 ngày mở cửa.';
    } else if (currentStep === 3) {
      if (images.length === 0) errs.images = 'Vui lòng cung cấp ít nhất 1 hình ảnh URL.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => Math.min(4, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    setImages([...images, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleAddCustomAmenity = () => {
    if (customAmenity.trim() && !amenities.includes(customAmenity.trim())) {
      setAmenities([...amenities, customAmenity.trim()]);
      setCustomAmenity('');
    }
  };

  const toggleAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter((a) => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  const toggleDay = (day: string) => {
    if (openDays.includes(day)) {
      setOpenDays(openDays.filter((d) => d !== day));
    } else {
      setOpenDays([...openDays, day]);
    }
  };

  const handleSubmit = async (isSubmitForReview: boolean) => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setToastError('Vui lòng kiểm tra lại thông tin các bước trước khi lưu.');
      return;
    }

    setSubmitting(true);
    setToastError('');

    const payload = {
      name: name.trim(),
      category,
      description: description.trim(),
      address: address.trim(),
      area,
      priceMin,
      priceMax,
      priceUnit,
      openHours,
      openDays,
      amenities,
      images,
      lat,
      lng,
    };

    try {
      if (initialData) {
        await updatePartnerPlace(initialData.id, payload, isSubmitForReview);
      } else {
        await createPartnerPlace(payload, isSubmitForReview);
      }
      router.push('/partner/co-so');
    } catch (err: any) {
      setToastError(err?.message || 'Không thể lưu cơ sở. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-8">
      {/* Wizard Progress Bar */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6 overflow-x-auto">
        {[
          { num: 1, title: 'Thông tin cơ bản' },
          { num: 2, title: 'Giá & Giờ mở cửa' },
          { num: 3, title: 'Tiện ích & Hình ảnh' },
          { num: 4, title: 'Vị trí bản đồ' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2 min-w-fit px-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s.num
                  ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                  : step > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-xs font-semibold ${step === s.num ? 'text-gray-900' : 'text-gray-500'}`}>
              {s.title}
            </span>
            {s.num < 4 && <ChevronRight className="w-4 h-4 text-gray-300 ml-2" />}
          </div>
        ))}
      </div>

      {toastError && (
        <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">
          {toastError}
        </div>
      )}

      {/* STEP 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tên cơ sở dịch vụ *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Resort Furama Đà Nẵng, Quán Hải Sản Phố..."
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
            {errors.name && <p role="alert" className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Loại hình kinh doanh</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PartnerPlaceCategory)}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              >
                <option value="luutru">Khách sạn / Lưu trú</option>
                <option value="amthuc">Nhà hàng / Ẩm thực</option>
                <option value="diemdulich">Điểm tham quan / Tour</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Khu vực quận/huyện</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ chi tiết *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: 105 Võ Nguyên Giáp, Phường Khuê Mỹ, Quận Ngũ Hành Sơn"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
            {errors.address && <p role="alert" className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả chi tiết *</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu không gian, dịch vụ nổi bật, ưu đãi đặc biệt..."
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
            {errors.description && <p role="alert" className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>
        </div>
      )}

      {/* STEP 2: Price & Hours */}
      {step === 2 && (
        <div className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Giá tối thiểu (VNĐ) *</label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
              {errors.priceMin && <p role="alert" className="text-xs text-red-500 mt-1">{errors.priceMin}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Giá tối đa (VNĐ)</label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị tính</label>
              <input
                type="text"
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
                placeholder="VD: đêm, món, vé"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Khung giờ mở cửa</label>
            <input
              type="text"
              value={openHours}
              onChange={(e) => setOpenHours(e.target.value)}
              placeholder="VD: 07:00 - 22:30"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Ngày đón khách trong tuần *</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const selected = openDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      selected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {errors.openDays && <p role="alert" className="text-xs text-red-500 mt-1">{errors.openDays}</p>}
          </div>
        </div>
      )}

      {/* STEP 3: Amenities & Images */}
      {step === 3 && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Tiện ích & Dịch vụ đi kèm</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {DEFAULT_AMENITIES.map((item) => {
                const selected = amenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      selected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Thêm tiện ích khác..."
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                + Thêm
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-700">Hình ảnh quảng bá (URL Image) *</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Dán đường dẫn ảnh https://..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 px-4 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Thêm ảnh
              </button>
            </div>
            {errors.images && <p role="alert" className="text-xs text-red-500">{errors.images}</p>}

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((url, index) => (
                  <div key={index} className="relative group h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <Image src={url} alt={`Image ${index}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Location Map */}
      {step === 4 && (
        <div className="space-y-4 max-w-3xl">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Vị trí địa lý trên bản đồ Đà Nẵng</h3>
            <p className="text-xs text-gray-500">Tọa độ giúp khách tìm thấy địa điểm trên bản đồ tương tác.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Vĩ độ (Latitude)</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Kinh độ (Longitude)</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
              />
            </div>
          </div>

          <div className="h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-xs relative">
            <MapWrapper
              locations={[{ id: 1, name: name || 'Cơ sở mới', lat, lng, category }]}
              selectedId={1}
              onSelect={() => {}}
              zoomLevel={1}
              radius={5}
            />
          </div>
        </div>
      )}

      {/* Navigation & Submit Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-md"
            >
              Tiếp theo <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                {submitting ? 'Đang lưu...' : 'Lưu nháp'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors shadow-md shadow-orange-500/20"
              >
                {submitting ? 'Đang xử lý...' : 'Gửi duyệt cơ sở'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
