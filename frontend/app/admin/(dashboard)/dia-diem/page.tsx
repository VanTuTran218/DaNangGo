"use client";

import { useState } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  getContentPlaces,
  lockContentPlace,
  unlockContentPlace,
} from "@/lib/api/admin-content";
import type { ContentPlaceItem } from "@/types/admin-content";
import DataTable, { Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Eye, Lock, Unlock, X, MapPin, Building2 } from "lucide-react";

const CATEGORY_LABEL: Record<ContentPlaceItem["category"], string> = {
  luutru: "Lưu trú",
  amthuc: "Ẩm thực",
  diemdulich: "Điểm du lịch",
};

const selectClass =
  "px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function Thumb({
  src,
  name,
  size,
}: {
  src: string | null;
  name: string;
  size: string;
}) {
  return (
    <div
      className={`relative ${size} rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <Building2 className="w-5 h-5 text-gray-400" />
      )}
    </div>
  );
}

export default function AdminPlacesPage() {
  const [catFilter, setCatFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPlace, setSelectedPlace] = useState<ContentPlaceItem | null>(
    null,
  );
  const [lockingPlace, setLockingPlace] = useState<ContentPlaceItem | null>(
    null,
  );
  const [unlockingPlace, setUnlockingPlace] = useState<ContentPlaceItem | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const {
    data: places,
    loading,
    error,
    reload,
  } = useAsyncData(
    () =>
      getContentPlaces({
        category: catFilter as ContentPlaceItem["category"] | "ALL",
        status: statusFilter as ContentPlaceItem["status"] | "ALL",
      }),
    [catFilter, statusFilter],
  );

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLock = async (reason?: string) => {
    if (!lockingPlace) return;
    setActionLoading(true);
    try {
      showToast(await lockContentPlace(lockingPlace.id, reason ?? ""));
      setLockingPlace(null);
      reload();
    } catch (err) {
      showToast(errorMessage(err, "Khóa địa điểm thất bại"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockingPlace) return;
    setActionLoading(true);
    try {
      showToast(await unlockContentPlace(unlockingPlace.id));
      setUnlockingPlace(null);
      reload();
    } catch (err) {
      showToast(errorMessage(err, "Mở khóa địa điểm thất bại"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<ContentPlaceItem>[] = [
    {
      key: "name",
      header: "Địa điểm",
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <Thumb src={p.imageUrl} name={p.name} size="w-12 h-12" />
          <div>
            <p className="font-bold text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-500">
              {[p.address, p.districtName].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Phân loại",
      render: (p) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
          {CATEGORY_LABEL[p.category]}
        </span>
      ),
    },
    { key: "priceText", header: "Khoảng giá" },
    {
      key: "status",
      header: "Trạng thái",
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedPlace(p)}
            title="Xem chi tiết"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-teal-600"
          >
            <Eye className="w-4 h-4" />
          </button>
          {p.status === "LOCKED" ? (
            <button
              onClick={() => setUnlockingPlace(p)}
              disabled={actionLoading}
              title="Mở khóa"
              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50"
            >
              <Unlock className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setLockingPlace(p)}
              disabled={actionLoading}
              title="Khóa địa điểm"
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Quản lý nội dung địa điểm
        </h1>
        <p className="text-sm text-gray-500">
          Xem toàn bộ địa điểm trên hệ thống, khóa hoặc mở khóa địa điểm vi
          phạm.
        </p>
      </div>

      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-teal-50 text-teal-700 border-teal-200"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="Đóng thông báo">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error ? (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700">
          <p className="font-semibold mb-2" role="alert">
            {error}
          </p>
          <button
            onClick={reload}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-xs"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <DataTable
          data={places || []}
          columns={columns}
          loading={loading}
          searchPlaceholder="Tìm theo tên địa điểm, địa chỉ..."
          searchField={(p) => `${p.name} ${p.address} ${p.districtName}`}
          rowKey={(p) => p.id}
          filterSlot={
            <>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className={selectClass}
              >
                <option value="ALL">Tất cả loại hình</option>
                <option value="luutru">Lưu trú</option>
                <option value="amthuc">Ẩm thực</option>
                <option value="diemdulich">Điểm du lịch</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectClass}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="HIDDEN">Đã ẩn</option>
                <option value="LOCKED">Đã khóa</option>
              </select>
            </>
          }
        />
      )}

      {/* Chi tiết */}
      {selectedPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 relative space-y-4">
            <button
              onClick={() => setSelectedPlace(null)}
              aria-label="Đóng"
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-teal-600" />
              <h3 className="text-lg font-bold text-gray-900">
                {selectedPlace.name}
              </h3>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-gray-500">Loại hình:</span>{" "}
                {CATEGORY_LABEL[selectedPlace.category]}
              </p>
              <p>
                <span className="font-semibold text-gray-500">Đối tác:</span>{" "}
                {selectedPlace.partnerName || "Không có (do Admin tạo)"}
              </p>
              <p>
                <span className="font-semibold text-gray-500">Địa chỉ:</span>{" "}
                {[selectedPlace.address, selectedPlace.districtName]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p>
                <span className="font-semibold text-gray-500">Khoảng giá:</span>{" "}
                {selectedPlace.priceText}
              </p>
              <p>
                <span className="font-semibold text-gray-500">Đánh giá:</span>{" "}
                ⭐ {selectedPlace.rating.toFixed(1)} (
                {selectedPlace.reviewCount} đánh giá)
              </p>
              <p>
                <span className="font-semibold text-gray-500">Lượt xem:</span>{" "}
                {selectedPlace.viewCount}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold text-gray-500">Trạng thái:</span>{" "}
                <StatusBadge status={selectedPlace.status} />
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPlace(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Khóa (bắt buộc nhập lý do) */}
      <ConfirmDialog
        isOpen={Boolean(lockingPlace)}
        onClose={() => setLockingPlace(null)}
        onConfirm={handleLock}
        title="Khóa địa điểm"
        description={`Địa điểm "${lockingPlace?.name ?? ""}" sẽ biến mất với người dùng và đối tác không tự mở lại được.`}
        variant="danger"
        confirmText="Khóa địa điểm"
        requireReason
        reasonPlaceholder="Ví dụ: Nội dung sai sự thật, vi phạm quy định..."
        loading={actionLoading}
      />

      {/* Mở khóa */}
      <ConfirmDialog
        isOpen={Boolean(unlockingPlace)}
        onClose={() => setUnlockingPlace(null)}
        onConfirm={handleUnlock}
        title="Mở khóa địa điểm"
        description={`Khôi phục địa điểm "${unlockingPlace?.name ?? ""}" về trạng thái trước khi bị khóa?`}
        variant="teal"
        confirmText="Mở khóa"
        loading={actionLoading}
      />
    </div>
  );
}
