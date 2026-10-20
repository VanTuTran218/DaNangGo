"use client";

import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import ReviewPhotoGrid from "./ReviewPhotoGrid";
import type { MyReview } from "@/lib/api/reviews";

export type PendingReviewImage = { file: File; url: string };

// Tách ảnh đã lưu khỏi file mới để backend chỉ giữ ảnh cũ được chủ review chọn.
export default function ReviewImageEditor({
  images,
  selected,
  disabled,
  onSelect,
  onRemoveExisting,
  onRemoveSelected,
}: {
  images: MyReview["images"];
  selected: PendingReviewImage[];
  disabled: boolean;
  onSelect: (files: File[]) => void;
  onRemoveExisting: (imageId: number) => void;
  onRemoveSelected: (url: string) => void;
}) {
  const count = images.length + selected.length;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-teal-300 hover:bg-teal-50">
          <ImagePlus size={16} aria-hidden="true" /> Thêm ảnh
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            multiple
            disabled={disabled || count >= 5}
            onChange={(event) => {
              onSelect(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
            className="sr-only"
          />
        </label>
        <span className="text-xs text-gray-500">
          {count}/5 ảnh, tối đa 5 MB mỗi ảnh
        </span>
      </div>
      <ReviewPhotoGrid
        images={images}
        onRemove={onRemoveExisting}
        disabled={disabled}
      />
      {selected.length ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {selected.map(({ file, url }) => (
            <div
              key={url}
              className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"
            >
              <Image
                src={url}
                alt={`Ảnh mới: ${file.name}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 33vw, 120px"
                className="object-cover"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemoveSelected(url)}
                aria-label={`Bỏ ảnh ${file.name}`}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black disabled:opacity-50"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
