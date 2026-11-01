"use client";

import { useEffect, useState } from "react";

type ReviewPhoto = { image_id: number; image_url: string };

export default function ReviewPhotoGrid({
  images,
  onRemove,
  disabled = false,
}: {
  images: ReviewPhoto[];
  onRemove?: (imageId: number) => void;
  disabled?: boolean;
}) {
  const [sources, setSources] = useState<Record<number, string>>({});

  useEffect(() => {
    let disposed = false;
    const objectUrls: string[] = [];
    setSources({});
    // Gửi cookie phiên để chủ review/admin tải được ảnh riêng tư, rồi thu hồi blob URL khi đổi danh sách.
    void Promise.all(
      images.map(async (image) => {
        try {
          const response = await fetch(image.image_url, {
            credentials: "include",
          });
          if (!response.ok) return;
          const url = URL.createObjectURL(await response.blob());
          if (disposed) {
            URL.revokeObjectURL(url);
            return;
          }
          objectUrls.push(url);
          setSources((current) => ({ ...current, [image.image_id]: url }));
        } catch {
          /* Hiển thị trạng thái lỗi tại thumbnail. */
        }
      }),
    );
    return () => {
      disposed = true;
      for (const url of objectUrls) URL.revokeObjectURL(url);
    };
  }, [images]);

  if (!images.length) return null;
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
      {images.map((image) => (
        <div
          key={image.image_id}
          className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"
        >
          {sources[image.image_id] ? (
            <img
              src={sources[image.image_id]}
              alt="Ảnh đính kèm đánh giá"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center px-1 text-center text-xs text-gray-500">
              Không tải được ảnh
            </span>
          )}
          {onRemove ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(image.image_id)}
              aria-label="Bỏ ảnh đã đính kèm"
              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black disabled:opacity-50"
            >
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
