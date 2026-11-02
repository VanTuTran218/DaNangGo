"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2, MapPin, CalendarDays, ChevronDown } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  deleteManagedItinerary,
  getItineraryActivityOptions,
  getManagedItinerary,
  updateManagedItinerary,
} from "@/lib/api/itineraries";
import type { ItineraryCatalogOption, ManagedItinerary, ManagedItineraryItem } from "@/types/itinerary";

const ITEM_TYPES: Array<{ value: Exclude<ManagedItineraryItem["type"], "transport">; label: string }> = [
  { value: "attraction", label: "Tham quan" },
  { value: "food", label: "Ăn uống" },
  { value: "entertainment", label: "Giải trí" },
  { value: "hotel", label: "Lưu trú" },
];
const MEAL_PERIOD_LABELS: Record<string, string> = {
  BREAKFAST: "Bữa sáng",
  LUNCH: "Bữa trưa",
  SNACK: "Ăn nhẹ buổi chiều",
  DINNER: "Bữa tối",
};

export default function ManagedItineraryPage({
  params,
}: {
  params: Promise<{ itineraryId: string }>;
}) {
  const { itineraryId } = use(params);
  const router = useRouter();
  const [itinerary, setItinerary] = useState<ManagedItinerary | null>(null);
  const [activityOptions, setActivityOptions] = useState<ItineraryCatalogOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addingActivity, setAddingActivity] = useState<{
    day: number;
    time: string;
    type: Exclude<ManagedItineraryItem["type"], "transport">;
    catalogPlaceId: number | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    getManagedItinerary(itineraryId)
      .then((saved) => { if (active) setItinerary(saved); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Không thể tải lịch trình.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [itineraryId]);

  useEffect(() => {
    let active = true;
    getItineraryActivityOptions()
      .then((options) => { if (active) setActivityOptions(options); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách hoạt động.");
      });
    return () => { active = false; };
  }, []);

  const estimatedTotal = useMemo(() => {
    if (!itinerary) return 0;
    return itinerary.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
      + Math.ceil(itinerary.budget * 0.08);
  }, [itinerary]);

  const updateItem = (index: number, update: Partial<ManagedItineraryItem>) => {
    setItinerary((current) => current ? {
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item),
    } : current);
  };

  const changeItemType = (index: number, type: Exclude<ManagedItineraryItem["type"], "transport">) => {
    const item = itinerary?.items[index];
    if (!item) return;
    updateItem(index, {
      type,
      title: "",
      description: "",
      location: "",
      imageUrl: undefined,
      catalogPlaceId: undefined,
      unitPrice: 0,
      quantity: itinerary?.guestCount ?? 1,
      estimatedCost: 0,
      durationMinutes: null,
    });
    setNotice("");
    setError("");
  };

  const selectCatalogOption = (index: number, catalogPlaceId: number) => {
    const item = itinerary?.items[index];
    const place = activityOptions.find((option) =>
      option.catalogPlaceId === catalogPlaceId && option.itemType === item?.type,
    );
    if (!place) return;
    if (!item) return;
    const quantity = place.itemType === "hotel"
      ? place.priceBasis === "PER_ROOM"
        ? Math.ceil((itinerary?.guestCount ?? 1) / (place.roomCapacity ?? 1))
        : itinerary?.guestCount ?? 1
      : itinerary?.guestCount ?? 1;
    updateItem(index, {
      catalogPlaceId: place.catalogPlaceId,
      title: place.name,
      description: place.description,
      location: place.address,
      imageUrl: place.imageUrl,
      unitPrice: place.price,
      quantity,
      estimatedCost: place.price * quantity,
      durationMinutes: place.durationMinutes,
    });
    const typeLabel = ITEM_TYPES.find((type) => type.value === place.itemType)?.label.toLowerCase();
    setNotice(`Đã chọn ${place.name}; thông tin ${typeLabel}, địa điểm và giá đã được cập nhật.`);
    setError("");
  };

  const changeGuestCount = (guestCount: number) => {
    setItinerary((current) => current ? {
      ...current,
      guestCount,
      items: current.items.map((item) => {
        if (item.type === "transport") return item;
        const option = activityOptions.find((candidate) =>
          candidate.catalogPlaceId === item.catalogPlaceId && candidate.itemType === item.type,
        );
        const quantity = option?.itemType === "hotel" && option.priceBasis === "PER_ROOM"
          ? Math.ceil(guestCount / (option.roomCapacity ?? 1))
          : guestCount;
        return { ...item, quantity, estimatedCost: item.unitPrice * quantity };
      }),
    } : current);
  };

  const createActivity = () => {
    if (!itinerary || !addingActivity?.catalogPlaceId) {
      setError("Vui lòng chọn một hoạt động trong danh sách.");
      return;
    }
    const place = activityOptions.find((option) =>
      option.catalogPlaceId === addingActivity.catalogPlaceId && option.itemType === addingActivity.type,
    );
    if (!place) {
      setError("Hoạt động đã chọn không còn trong danh sách. Vui lòng chọn lại.");
      return;
    }
    const quantity = place.itemType === "hotel" && place.priceBasis === "PER_ROOM"
      ? Math.ceil(itinerary.guestCount / (place.roomCapacity ?? 1))
      : itinerary.guestCount;
    setItinerary((current) => current ? {
      ...current,
      items: [...current.items, {
        id: `new-${Date.now()}`,
        day: addingActivity.day,
        time: addingActivity.time,
        title: place.name,
        description: place.description,
        type: place.itemType,
        location: place.address,
        imageUrl: place.imageUrl,
        catalogPlaceId: place.catalogPlaceId,
        estimatedCost: place.price * quantity,
        unitPrice: place.price,
        quantity,
        durationMinutes: place.durationMinutes,
      }],
    } : current);
    setAddingActivity(null);
    setNotice(`Đã thêm ${place.name} vào ngày ${addingActivity.day}.`);
    setError("");
  };

  const saveChanges = async () => {
    if (!itinerary || isSaving) return;
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateManagedItinerary(itineraryId, {
        title: itinerary.title,
        startDate: itinerary.startDate,
        dayCount: itinerary.dayCount,
        guestCount: itinerary.guestCount,
        budget: itinerary.budget,
        items: itinerary.items,
      });
      setItinerary(updated);
      setNotice("Đã lưu thay đổi lịch trình.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không thể lưu thay đổi.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeItinerary = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa lịch trình "${itinerary?.title ?? ""}" không?`)) return;
    try {
      await deleteManagedItinerary(itineraryId);
      router.push("/lich-trinh");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa lịch trình.");
    }
  };

  if (isLoading) {
    return <PageShell><div className="py-24 text-center text-gray-500">Đang tải lịch trình...</div></PageShell>;
  }

  if (!itinerary) {
    return (
      <PageShell>
        <section className="mx-auto max-w-3xl py-20 text-center">
          <p role="alert" className="mb-6 text-red-600">{error || "Không tìm thấy lịch trình."}</p>
          <Link href="/lich-trinh" className="inline-flex items-center gap-2 font-semibold text-emerald-700"><ArrowLeft size={18} /> Về quản lý lịch trình</Link>
        </section>
      </PageShell>
    );
  }

  const inputClass = "mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <PageShell>
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-24 sm:px-6">
        <Link href="/lich-trinh" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-emerald-700">
          <ArrowLeft size={17} /> Quản lý lịch trình
        </Link>

        <header className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><MapPin size={16} /> Đà Nẵng</p>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Chỉnh sửa lịch trình</h1>
            <p className="mt-2 text-sm text-gray-500">Thêm, sửa, xóa hoạt động và cập nhật thông tin chuyến đi.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={removeItinerary} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
              <Trash2 size={16} /> Xóa lịch
            </button>
            <button type="button" onClick={saveChanges} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={16} /> {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </header>

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

        <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900"><CalendarDays size={19} className="text-emerald-600" /> Thông tin chuyến đi</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-gray-700 sm:col-span-2 lg:col-span-3">
              Tên lịch trình
              <input className={inputClass} maxLength={200} value={itinerary.title} onChange={(event) => setItinerary({ ...itinerary, title: event.target.value })} />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Ngày bắt đầu
              <input type="date" className={inputClass} value={itinerary.startDate} onChange={(event) => setItinerary({ ...itinerary, startDate: event.target.value })} />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Số ngày (tối đa 3)
              <select className={inputClass} value={itinerary.dayCount} onChange={(event) => {
                const dayCount = Number(event.target.value);
                setItinerary({ ...itinerary, dayCount, items: itinerary.items.filter((item) => item.day <= dayCount) });
              }}>
                {[1, 2, 3].map((day) => <option key={day} value={day}>{day} ngày</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Số người
              <input type="number" min={1} step={1} className={inputClass} value={itinerary.guestCount} onChange={(event) => changeGuestCount(Number(event.target.value))} />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Ngân sách (VND)
              <input type="number" min={1} step={10000} className={inputClass} value={itinerary.budget} onChange={(event) => setItinerary({ ...itinerary, budget: Number(event.target.value) })} />
            </label>
          </div>
        </section>

        <section className="mb-8 space-y-6">
          {Array.from({ length: itinerary.dayCount }, (_, index) => index + 1).map((day) => {
            const items = itinerary.items
              .map((item, index) => ({ item, index }))
              .filter(({ item }) => item.day === day && item.type !== "transport")
              .sort((left, right) => left.item.time.localeCompare(right.item.time));
            return (
              <div key={day} className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Ngày {day}</h2>
                  <button type="button" onClick={() => {
                    setAddingActivity((current) => current?.day === day ? null : {
                      day,
                      time: "13:30",
                      type: "attraction",
                      catalogPlaceId: null,
                    });
                    setError("");
                  }} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                    <Plus size={16} /> {addingActivity?.day === day ? "Đóng biểu mẫu" : "Thêm hoạt động"}
                  </button>
                </div>
                {addingActivity?.day === day && (
                  <form className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4" onSubmit={(event) => {
                    event.preventDefault();
                    createActivity();
                  }}>
                    <h3 className="mb-3 font-semibold text-gray-900">Tạo hoạt động mới · Ngày {day}</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="text-xs font-medium text-gray-600">Loại hoạt động
                        <select className={inputClass} value={addingActivity.type} onChange={(event) => setAddingActivity({
                          ...addingActivity,
                          type: event.target.value as Exclude<ManagedItineraryItem["type"], "transport">,
                          catalogPlaceId: null,
                        })}>
                          {ITEM_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                      </label>
                      <label className="text-xs font-medium text-gray-600">Giờ
                        <input type="time" required className={inputClass} value={addingActivity.time} onChange={(event) => setAddingActivity({ ...addingActivity, time: event.target.value })} />
                      </label>
                      <label className="text-xs font-medium text-gray-600 sm:col-span-2">
                        Chọn {ITEM_TYPES.find((type) => type.value === addingActivity.type)?.label.toLowerCase()}
                        <select required className={inputClass} value={addingActivity.catalogPlaceId ?? ""} onChange={(event) => setAddingActivity({
                          ...addingActivity,
                          catalogPlaceId: event.target.value ? Number(event.target.value) : null,
                        })}>
                          <option value="" disabled>Chọn từ danh sách</option>
                          {activityOptions.filter((place) => place.itemType === addingActivity.type).map((place) => (
                            <option key={place.catalogPlaceId} value={place.catalogPlaceId}>
                              {place.name}
                              {place.mealPeriod ? ` · ${MEAL_PERIOD_LABELS[place.mealPeriod]}` : ""}
                              {` · ${place.address} · ${place.price.toLocaleString("vi-VN")}đ`}
                            </option>
                          ))}
                        </select>
                        {activityOptions.filter((place) => place.itemType === addingActivity.type).length === 0 && (
                          <span className="mt-1 block font-normal text-amber-700">Chưa có lựa chọn cho loại hoạt động này.</span>
                        )}
                      </label>
                    </div>
                    {addingActivity.catalogPlaceId && (() => {
                      const selected = activityOptions.find((place) =>
                        place.catalogPlaceId === addingActivity.catalogPlaceId && place.itemType === addingActivity.type,
                      );
                      return selected ? (
                        <p className="mt-3 text-sm text-gray-600">
                          {selected.address} · {selected.price.toLocaleString("vi-VN")}đ
                          {selected.priceBasis === "PER_ROOM"
                            ? ` / phòng · ${Math.ceil(itinerary.guestCount / (selected.roomCapacity ?? 1))} phòng dự kiến`
                            : ` / người · ${itinerary.guestCount} người`}
                        </p>
                      ) : null;
                    })()}
                    <div className="mt-4 flex justify-end gap-2">
                      <button type="button" onClick={() => setAddingActivity(null)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                        Hủy
                      </button>
                      <button type="submit" disabled={!addingActivity.catalogPlaceId} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                        Thêm vào lịch
                      </button>
                    </div>
                  </form>
                )}
                {items.length === 0 ? <p className="py-4 text-sm text-gray-500">Chưa có hoạt động trong ngày này.</p> : (
                  <div className="space-y-4">
                    {items.map(({ item, index: itemIndex }, displayIndex) => (
                      <article key={item.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hoạt động {displayIndex + 1}</span>
                          <button type="button" onClick={() => setItinerary({
                            ...itinerary,
                            items: itinerary.items.filter((_, index) => index !== itemIndex),
                          })} aria-label={`Xóa ${item.title}`} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <label className="text-xs font-medium text-gray-600">Giờ
                            <input type="time" className={inputClass} value={item.time} onChange={(event) => updateItem(itemIndex, { time: event.target.value })} />
                          </label>
                          <label className="text-xs font-medium text-gray-600">Loại hoạt động
                            {item.type === "transport" ? (
                              <div className={`${inputClass} text-gray-400`}>Hoạt động hệ thống</div>
                            ) : (
                              <select className={inputClass} value={item.type} onChange={(event) => {
                                changeItemType(itemIndex, event.target.value as Exclude<ManagedItineraryItem["type"], "transport">);
                              }}>
                                {ITEM_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                              </select>
                            )}
                          </label>
                          <label className="text-xs font-medium text-gray-600">Ngày
                            <select className={inputClass} value={item.day} onChange={(event) => updateItem(itemIndex, { day: Number(event.target.value) })}>
                              {Array.from({ length: itinerary.dayCount }, (_, dayIndex) => dayIndex + 1).map((dayNumber) => <option key={dayNumber} value={dayNumber}>Ngày {dayNumber}</option>)}
                            </select>
                          </label>
                          {item.type !== "transport" && (
                            <label className="text-xs font-medium text-gray-600 sm:col-span-2 lg:col-span-3">
                              {ITEM_TYPES.find((type) => type.value === item.type)?.label}
                              <span className="relative block">
                                <select
                                  className={`${inputClass} appearance-none pr-10`}
                                  value={item.catalogPlaceId ?? ""}
                                  onChange={(event) => selectCatalogOption(itemIndex, Number(event.target.value))}
                                >
                                  <option value="" disabled>Chọn {ITEM_TYPES.find((type) => type.value === item.type)?.label.toLowerCase()}</option>
                                  {activityOptions.filter((place) => place.itemType === item.type).map((place) => (
                                    <option key={place.catalogPlaceId} value={place.catalogPlaceId}>
                                      {place.name}
                                      {place.mealPeriod ? ` · ${MEAL_PERIOD_LABELS[place.mealPeriod]}` : ""}
                                      {` · ${place.address} · ${place.price.toLocaleString("vi-VN")}đ`}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              </span>
                              {activityOptions.filter((place) => place.itemType === item.type).length === 0 && <span className="mt-1 block text-xs font-normal text-amber-700">Chưa có lựa chọn cho loại hoạt động này.</span>}
                            </label>
                          )}
                          {item.type !== "transport" && item.imageUrl && (
                            <div className="flex items-end sm:col-span-2 lg:col-span-1">
                              <img
                                src={item.imageUrl}
                                alt={`Ảnh minh họa ${item.title}`}
                                className="h-24 w-full rounded-lg border border-gray-200 object-cover"
                              />
                            </div>
                          )}
                          {item.type !== "transport" && (
                            <>
                              <label className="text-xs font-medium text-gray-600">Đơn giá (VND)
                                <input type="number" className={`${inputClass} bg-gray-50 text-gray-600`} value={item.unitPrice} readOnly />
                              </label>
                              <label className="text-xs font-medium text-gray-600">Số lượng tính giá
                                <input type="number" min={1} step={1} className={inputClass} value={item.quantity} onChange={(event) => updateItem(itemIndex, { quantity: Number(event.target.value) })} />
                              </label>
                              <div className="text-xs font-medium text-gray-600 sm:col-span-2">
                                Địa điểm
                                <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-sm font-normal text-gray-700">{item.location || "Địa điểm sẽ hiển thị sau khi chọn."}</p>
                              </div>
                              <div className="text-xs font-medium text-gray-600 sm:col-span-2">
                                Mô tả
                                <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-sm font-normal text-gray-700">{item.description || "Mô tả sẽ hiển thị sau khi chọn."}</p>
                              </div>
                            </>
                          )}
                        </div>
                        <p className="mt-3 text-right text-xs text-gray-500">
                          Thành tiền: {(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <section className="flex flex-col gap-2 rounded-2xl bg-gray-900 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm text-gray-300">Dự toán (đã gồm khoản dự phòng 8%)</p>
            <p className="mt-1 text-2xl font-bold">{estimatedTotal.toLocaleString("vi-VN")}đ</p>
          </div>
          <p className={`text-sm font-semibold ${estimatedTotal > itinerary.budget ? "text-amber-300" : "text-emerald-300"}`}>
            {estimatedTotal > itinerary.budget ? `Vượt ngân sách ${(estimatedTotal - itinerary.budget).toLocaleString("vi-VN")}đ` : `Còn lại ${(itinerary.budget - estimatedTotal).toLocaleString("vi-VN")}đ`}
          </p>
        </section>
      </main>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50"><Navbar />{children}<Footer /></div>;
}
