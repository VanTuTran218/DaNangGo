'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { PartnerPlace, PartnerPlaceStatus } from '@/types/partner';
import { createPartnerPlace, updatePartnerPlace } from '@/lib/api/partner';
import { getDistricts, getCuisines, type CategoryItem } from '@/lib/api/categories';
import { ApiError } from '@/lib/api/client';
import FormSection from './FormSection';
import ImageUploader from './ImageUploader';
import MapPicker from './MapPicker';
import AdminSection from './AdminSection';
import {
  Store,
  DollarSign,
  PhoneCall,
  Image as ImageIcon,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Save,
  Check,
  Send,
  Lock,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ToastNotification, { type ToastItem } from '@/components/ui/ToastNotification';
import { getFriendlyErrorMessage, extractFieldErrors } from '@/lib/utils/formatError';

interface PlaceFormProps {
  initialData?: PartnerPlace;
  isAdminMode?: boolean;
  onSuccess?: (place: PartnerPlace) => void;
}

export default function PlaceForm({
  initialData,
  isAdminMode = false,
  onSuccess,
}: PlaceFormProps) {
  const router = useRouter();

  // Dynamic Categories State
  const [districts, setDistricts] = useState<CategoryItem[]>([]);
  const [cuisines, setCuisines] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form Fields State
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [districtId, setDistrictId] = useState<number | undefined>(
    initialData?.districtId || undefined
  );
  const [cuisineId, setCuisineId] = useState<number | undefined>(
    initialData?.cuisineId || undefined
  );

  const [priceMin, setPriceMin] = useState<number>(initialData?.priceMin ?? 50000);
  const [priceMax, setPriceMax] = useState<number | undefined>(
    initialData?.priceMax ?? 300000
  );
  const [openHours, setOpenHours] = useState(initialData?.openHours || '08:00 - 22:00');

  const [phone, setPhone] = useState(initialData?.phone || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [bookingUrl, setBookingUrl] = useState(initialData?.bookingUrl || '');

  const [images, setImages] = useState<string[]>(
    initialData?.images && initialData.images.length > 0
      ? initialData.images
      : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80']
  );

  const [lat, setLat] = useState<number>(initialData?.lat || 16.0544);
  const [lng, setLng] = useState<number>(initialData?.lng || 108.2022);

  // Admin Section State
  const [partnerId, setPartnerId] = useState<number | null>(
    initialData?.partnerId ?? null
  );
  const [status, setStatus] = useState<PartnerPlaceStatus>(
    initialData?.status || 'PENDING'
  );

  // Validation Errors & Submission State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastItem | null>(null);

  const isPlaceLocked = initialData?.status === 'LOCKED' && !isAdminMode;

  // Load Districts and Cuisines
  useEffect(() => {
    let isMounted = true;
    async function fetchCategories() {
      try {
        const [dList, cList] = await Promise.all([getDistricts(), getCuisines()]);
        if (isMounted) {
          setDistricts(dList);
          setCuisines(cList);
          if (!districtId && dList.length > 0) {
            setDistrictId(dList[0].id);
          }
          if (!cuisineId && cList.length > 0) {
            setCuisineId(cList[0].id);
          }
        }
      } catch (err) {
        console.error('Không thể nạp danh mục:', err);
      } finally {
        if (isMounted) setLoadingCategories(false);
      }
    }
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Validation function
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Tên nhà hàng là bắt buộc.';
    } else if (name.trim().length > 200) {
      errs.name = 'Tên nhà hàng không được vượt quá 200 ký tự.';
    }

    if (!address.trim()) {
      errs.address = 'Địa chỉ cơ sở là bắt buộc.';
    }

    if (!districtId) {
      errs.districtId = 'Vui lòng chọn Quận/Huyện.';
    }

    if (priceMin < 0) {
      errs.priceMin = 'Giá tối thiểu phải lớn hơn hoặc bằng 0.';
    }

    if (priceMax !== undefined && priceMax < priceMin) {
      errs.priceMax = 'Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.';
    }

    if (bookingUrl.trim()) {
      const url = bookingUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        errs.bookingUrl = 'URL đặt bàn phải bắt đầu bằng http:// hoặc https://';
      }
    }

    if (website.trim()) {
      const url = website.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        errs.website = 'Website phải bắt đầu bằng http:// hoặc https://';
      }
    }

    if (images.length === 0) {
      errs.images = 'Vui lòng cung cấp ít nhất 1 hình ảnh URL cho cơ sở.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Live validate booking_url
  const handleBookingUrlChange = (val: string) => {
    setBookingUrl(val);
    const trimmed = val.trim();
    if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setErrors((prev) => ({
        ...prev,
        bookingUrl: 'URL đặt bàn phải bắt đầu bằng http:// hoặc https://',
      }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.bookingUrl;
        return next;
      });
    }
  };

  // Completion Checklist calculations
  const checklist = [
    { label: 'Tên & mô tả quán', valid: Boolean(name.trim() && description.trim()) },
    { label: 'Địa chỉ & quận/huyện', valid: Boolean(address.trim() && districtId) },
    { label: 'Loại hình ẩm thực', valid: Boolean(cuisineId) },
    { label: 'Khoảng giá & giờ mở cửa', valid: priceMin >= 0 && Boolean(openHours.trim()) },
    { label: 'Ít nhất 1 hình ảnh', valid: images.length > 0 },
    { label: 'Vị trí tọa độ bản đồ', valid: Boolean(lat && lng) },
  ];
  const completedCount = checklist.filter((c) => c.valid).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  // Form Submission
  const handleSubmit = async (isSubmitForReview: boolean) => {
    if (!validateForm()) {
      setToast({
        type: 'error',
        title: 'Dữ liệu chưa hợp lệ',
        message: 'Vui lòng kiểm tra và sửa các trường thông tin được đánh dấu đỏ.',
      });
      return;
    }

    setSubmitting(true);
    setToast(null);

    const payload = {
      name: name.trim(),
      category: 'amthuc' as const,
      description: description.trim(),
      address: address.trim(),
      area: districts.find((d) => d.id === districtId)?.name || 'Đà Nẵng',
      districtId,
      cuisineId,
      priceMin,
      priceMax,
      priceUnit: 'món',
      openHours: openHours.trim(),
      openDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
      amenities: ['Wifi miễn phí', 'Điều hòa', 'Thanh toán thẻ'],
      images,
      lat,
      lng,
      bookingUrl: bookingUrl.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      partnerId: isAdminMode && partnerId ? partnerId : undefined,
      status: isAdminMode ? status : isSubmitForReview ? 'PENDING' : 'HIDDEN',
    };

    const isPlaceLocked = initialData?.status === 'LOCKED' && !isAdminMode;
    if (isPlaceLocked) {
      setToast({
        type: 'error',
        title: 'Thao tác bị khóa',
        message: 'Địa điểm này đang bị Quản trị viên khóa (LOCKED). Chỉ Admin mới có quyền mở khóa hoặc chỉnh sửa.',
      });
      return;
    }

    try {
      let savedPlace: PartnerPlace;
      if (initialData) {
        savedPlace = await updatePartnerPlace(initialData.id, payload, isSubmitForReview);
        setToast({
          type: 'success',
          title: 'Thành công',
          message: 'Đã cập nhật thông tin nhà hàng thành công!',
        });
      } else {
        savedPlace = await createPartnerPlace(payload, isSubmitForReview);
        setToast({
          type: 'success',
          title: 'Thành công',
          message: isSubmitForReview
            ? 'Đã gửi duyệt cơ sở ẩm thực thành công! Ban quản trị sẽ sớm phê duyệt.'
            : 'Đã lưu bản nháp cơ sở thành công!',
        });
      }

      if (onSuccess) {
        onSuccess(savedPlace);
      } else {
        setTimeout(() => {
          router.push(isAdminMode ? '/admin/dia-diem' : '/partner/co-so');
        }, 1200);
      }
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err);
      const fieldErrs = extractFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrs }));
      }
      setToast({
        type: 'error',
        title: 'Lỗi cập nhật cơ sở',
        message: msg,
        action:
          err?.status === 401
            ? {
                label: 'Đăng nhập lại',
                href: '/dang-nhap?redirect=/partner/co-so',
              }
            : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCuisineName = cuisines.find((c) => c.id === cuisineId)?.name;
  const selectedDistrictName = districts.find((d) => d.id === districtId)?.name;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Cảnh báo khi quán đang bị Admin khóa (LOCKED) */}
      {initialData?.status === 'LOCKED' && !isAdminMode && (
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
              Cơ sở ẩm thực đang bị Quản trị viên khóa (LOCKED)
            </h4>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              Địa điểm này hiện đang ở trạng thái khóa quản trị. Bạn chỉ có quyền xem thông tin cơ sở mà không thể thực hiện chỉnh sửa, ẩn/hiện hoặc cập nhật thực đơn món ăn. Vui lòng liên hệ Quản trị viên DanangGo nếu cần hỗ trợ mở khóa.
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Grid: 8/12 Form Sections + 4/12 Sticky Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ==================== LEFT 8/12: FORM SECTIONS ==================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1: Thông tin cơ bản */}
          <FormSection
            icon={<Store className="w-5 h-5" />}
            title="1. Thông tin cơ bản"
            description="Tên nhà hàng, giới thiệu không gian và vị trí phân loại"
          >
            <div className="space-y-5">
              {/* Tên cơ sở */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Tên quán / Cơ sở kinh doanh *</span>
                  {name.trim() && !errors.name && (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Hợp lệ
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
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
                    placeholder="VD: Nhà hàng Hải Sản Bé Mặn, Bún Chả Cá 109..."
                    className={`w-full px-4 py-3 text-sm bg-slate-50 border rounded-2xl focus:bg-white focus:outline-none transition-all ${
                      errors.name
                        ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20'
                        : 'border-slate-300 focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500'
                    }`}
                  />
                </div>
                {errors.name && (
                  <motion.p
                    initial={{ x: -4 }}
                    animate={{ x: [-4, 4, -2, 2, 0] }}
                    className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                  </motion.p>
                )}
              </div>

              {/* Quận / Huyện & Loại ẩm thực */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quận / Huyện */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quận / Huyện Đà Nẵng *
                  </label>
                  {loadingCategories ? (
                    <div className="h-11 bg-slate-100 rounded-2xl animate-pulse" />
                  ) : (
                    <select
                      value={districtId ?? ''}
                      onChange={(e) => setDistrictId(Number(e.target.value))}
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all font-medium text-slate-800"
                    >
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.districtId && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.districtId}
                    </p>
                  )}
                </div>

                {/* Loại ẩm thực */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Loại hình ẩm thực
                  </label>
                  {loadingCategories ? (
                    <div className="h-11 bg-slate-100 rounded-2xl animate-pulse" />
                  ) : (
                    <select
                      value={cuisineId ?? ''}
                      onChange={(e) => setCuisineId(Number(e.target.value))}
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all font-medium text-slate-800"
                    >
                      {cuisines.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
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
                  type="text"
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
                  placeholder="VD: Lô 14 Võ Nguyên Giáp, Phường Mân Thái, Sơn Trà"
                  className={`w-full px-4 py-3 text-sm bg-slate-50 border rounded-2xl focus:bg-white focus:outline-none transition-all ${
                    errors.address
                      ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500'
                  }`}
                />
                {errors.address && (
                  <motion.p
                    initial={{ x: -4 }}
                    animate={{ x: [-4, 4, -2, 2, 0] }}
                    className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.address}
                  </motion.p>
                )}
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Mô tả quán & Không gian ẩm thực</span>
                  <span className="text-[11px] text-slate-400">
                    {description.length} ký tự
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Giới thiệu không gian phục vụ, các món ăn đặc sắc làm nên thương hiệu, không gian biển, máy lạnh..."
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all leading-relaxed"
                />
              </div>
            </div>
          </FormSection>

          {/* SECTION 2: Giá & Giờ mở cửa */}
          <FormSection
            icon={<DollarSign className="w-5 h-5" />}
            title="2. Khoảng giá & Giờ phục vụ"
            description="Mức giá trung bình và khung giờ đón khách mỗi ngày"
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Giá tối thiểu */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giá tối thiểu (VNĐ) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600 font-bold text-sm">
                      ₫
                    </span>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={priceMin}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPriceMin(val);
                        if (errors.priceMin) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.priceMin;
                            return next;
                          });
                        }
                      }}
                      className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 font-semibold text-slate-900 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hiển thị: ₫{priceMin.toLocaleString('vi-VN')}
                  </p>
                  {errors.priceMin && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.priceMin}
                    </p>
                  )}
                </div>

                {/* Giá tối đa */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giá tối đa (VNĐ)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600 font-bold text-sm">
                      ₫
                    </span>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      value={priceMax ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        setPriceMax(val);
                        if (errors.priceMax) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.priceMax;
                            return next;
                          });
                        }
                      }}
                      placeholder="Không bắt buộc"
                      className="w-full pl-9 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 font-semibold text-slate-900 transition-all"
                    />
                  </div>
                  {priceMax !== undefined && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Hiển thị: ₫{priceMax.toLocaleString('vi-VN')}
                    </p>
                  )}
                  {errors.priceMax && (
                    <motion.p
                      initial={{ x: -4 }}
                      animate={{ x: [-4, 4, -2, 2, 0] }}
                      className="text-xs text-rose-500 font-medium mt-1"
                    >
                      {errors.priceMax}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Giờ mở cửa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Khung giờ đón khách trong ngày
                </label>
                <input
                  type="text"
                  value={openHours}
                  onChange={(e) => setOpenHours(e.target.value)}
                  placeholder="VD: 07:00 - 22:30, hoặc 10:00 - 14:00 & 16:30 - 22:00"
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          </FormSection>

          {/* SECTION 3: Liên hệ & Đặt bàn */}
          <FormSection
            icon={<PhoneCall className="w-5 h-5" />}
            title="3. Liên hệ & Đặt bàn trực tuyến"
            description="Số điện thoại gọi bàn và liên kết đặt chỗ phục vụ khách du lịch"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Điện thoại */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0905 123 456"
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all font-mono"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Trang web nhà hàng (Website)
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://nhahangdanang.vn"
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all font-mono text-xs"
                  />
                  {errors.website && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.website}
                    </p>
                  )}
                </div>
              </div>

              {/* URL Đặt bàn */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Liên kết đặt bàn trực tuyến (Booking URL)</span>
                  <span className="text-[11px] text-slate-400">
                    Bắt đầu bằng http:// hoặc https://
                  </span>
                </label>
                <input
                  type="url"
                  value={bookingUrl}
                  onChange={(e) => handleBookingUrlChange(e.target.value)}
                  placeholder="https://pasgo.vn/dat-cho/..., hoặc https://order.pos365.vn/..."
                  className={`w-full px-4 py-3 text-sm bg-slate-50 border rounded-2xl focus:bg-white focus:outline-none transition-all font-mono text-xs ${
                    errors.bookingUrl
                      ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500'
                  }`}
                />
                {errors.bookingUrl && (
                  <motion.p
                    initial={{ x: -4 }}
                    animate={{ x: [-4, 4, -2, 2, 0] }}
                    className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.bookingUrl}
                  </motion.p>
                )}
              </div>
            </div>
          </FormSection>

          {/* SECTION 4: Hình ảnh */}
          <FormSection
            icon={<ImageIcon className="w-5 h-5" />}
            title="4. Hình ảnh quảng bá cơ sở"
            description="Ảnh bìa chính và các hình ảnh không gian quán thu hút khách"
          >
            <ImageUploader
              images={images}
              onChange={setImages}
              error={errors.images}
            />
          </FormSection>

          {/* SECTION 5: Vị trí bản đồ */}
          <FormSection
            icon={<MapPin className="w-5 h-5" />}
            title="5. Vị trí trên bản đồ du lịch Đà Nẵng"
            description="Tọa độ GPS giúp khách du lịch chỉ đường và định vị trên bản đồ tương tác"
          >
            <MapPicker
              lat={lat}
              lng={lng}
              placeName={name}
              onLatChange={setLat}
              onLngChange={setLng}
            />
          </FormSection>

          {/* SECTION 6: (Chỉ khi isAdminMode) Quản trị Admin */}
          {isAdminMode && (
            <FormSection
              icon={<ShieldAlert className="w-5 h-5" />}
              title="6. Quản trị hệ thống (Admin Portal)"
              description="Chỉ định đối tác sở hữu và thiết lập trạng thái duyệt / Khóa cơ sở"
              badge="ADMIN MODE"
              isHighlight={true}
            >
              <AdminSection
                partnerId={partnerId}
                onPartnerIdChange={setPartnerId}
                status={status}
                onStatusChange={setStatus}
              />
            </FormSection>
          )}
        </div>

        {/* ==================== RIGHT 4/12: STICKY SUMMARY & ACTIONS ==================== */}
        <div className="lg:col-span-4 sticky top-6 space-y-6">
          {/* Card Preview */}
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
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-teal-600 font-bold text-xs bg-teal-50">
                  Chưa có ảnh
                </div>
              )}
              {selectedCuisineName && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-xs text-teal-800 text-[11px] font-bold shadow-xs">
                  {selectedCuisineName}
                </span>
              )}
            </div>

            {/* Title & Info */}
            <div>
              <h4 className="font-extrabold text-base text-slate-900 truncate">
                {name.trim() || 'Tên nhà hàng chưa nhập'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {selectedDistrictName || 'Đà Nẵng'} - {address.trim() || 'Chưa có địa chỉ'}
              </p>
              <p className="text-xs font-bold text-orange-600 mt-2">
                ₫{priceMin.toLocaleString('vi-VN')}{' '}
                {priceMax ? `- ₫${priceMax.toLocaleString('vi-VN')}` : ''}
              </p>
            </div>

            {/* Progress Bar & Checklist */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Tiến độ điền thông tin</span>
                <span className="text-teal-700">{progressPercent}%</span>
              </div>

              {/* Animated Progress Bar */}
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              {/* Checklist items */}
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
              {/* Primary Save / Submit */}
              {isPlaceLocked ? (
                <button
                  type="button"
                  disabled
                  title="Quán đang bị Admin khóa"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-400 font-bold text-xs sm:text-sm cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>Quán đang bị Admin khóa</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit(true)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/25 transition-all active:scale-97 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu thông tin...</span>
                    </>
                  ) : initialData ? (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi duyệt cơ sở</span>
                    </>
                  )}
                </button>
              )}

              {/* Secondary Save Draft (only when creating) */}
              {!initialData && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-97"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu nháp (Chưa công khai)</span>
                </button>
              )}

              {/* Cancel Button */}
              <Link
                href={isAdminMode ? '/admin/dia-diem' : '/partner/co-so'}
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
          href={isAdminMode ? '/admin/dia-diem' : '/partner/co-so'}
          className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
        >
          Hủy
        </Link>
        {isPlaceLocked ? (
          <button
            type="button"
            disabled
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-400 font-bold text-xs border border-rose-200 cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            <span>Quán đang bị Admin khóa</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : initialData ? (
              'Lưu thay đổi'
            ) : (
              'Gửi duyệt quán'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
