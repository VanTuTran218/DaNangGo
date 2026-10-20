import { getPool, sql } from "../../config/db";
import type { ReviewImageUpload } from "./reviews.upload";

export interface ReviewRow {
  review_id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: Date;
  images: { image_id: number; image_url: string }[];
}

export interface ReviewImageRow {
  image_id: number;
  mime_type: "image/jpeg" | "image/png" | "image/webp";
  image_data: Buffer;
}

export interface PlaceReviewSummary {
  place_id: number;
  avg_rating: number;
  review_count: number;
}

export interface AdminReviewRow {
  review_id: number;
  place_id: number;
  place_name: string;
  user_name: string;
  rating: number;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "HIDDEN";
  created_at: Date;
  images: { image_id: number; image_url: string }[];
}

async function attachReviewImages<T extends { review_id: number }>(
  rows: T[],
  pathFor: (reviewId: number, imageId: number) => string,
): Promise<(T & { images: { image_id: number; image_url: string }[] })[]> {
  if (!rows.length) return [];
  const request = getPool().request();
  const ids = rows.map((row, index) => {
    request.input(`review_id_${index}`, sql.Int, row.review_id);
    return `@review_id_${index}`;
  });
  const result = await request.query(
    `SELECT image_id, review_id FROM review_images WHERE review_id IN (${ids.join(",")}) ORDER BY review_id, image_order`,
  );
  const imagesByReview = new Map<
    number,
    { image_id: number; image_url: string }[]
  >();
  for (const image of result.recordset as {
    image_id: number;
    review_id: number;
  }[]) {
    const images = imagesByReview.get(image.review_id) ?? [];
    images.push({
      image_id: image.image_id,
      image_url: pathFor(image.review_id, image.image_id),
    });
    imagesByReview.set(image.review_id, images);
  }
  return rows.map((row) => ({
    ...row,
    images: imagesByReview.get(row.review_id) ?? [],
  }));
}

export async function findPlaceSummary(
  placeId: number,
): Promise<PlaceReviewSummary | null> {
  const result = await getPool().request().input("place_id", sql.Int, placeId)
    .query(`
      SELECT place_id, avg_rating, review_count
      FROM places
      WHERE place_id = @place_id
    `);
  return (result.recordset[0] as PlaceReviewSummary | undefined) ?? null;
}

export async function findApprovedReviews(
  placeId: number,
  offset: number,
  limit: number,
): Promise<{ rows: ReviewRow[]; total: number }> {
  const pool = getPool();
  const countResult = await pool
    .request()
    .input("place_id", sql.Int, placeId)
    .query(
      `SELECT COUNT(*) AS total FROM reviews WHERE place_id = @place_id AND status = 'APPROVED'`,
    );
  const dataResult = await pool
    .request()
    .input("place_id", sql.Int, placeId)
    .input("offset", sql.Int, offset)
    .input("limit", sql.Int, limit).query(`
      SELECT r.review_id, u.full_name AS reviewer_name, r.rating, r.comment, r.created_at
      FROM reviews r
      INNER JOIN users u ON u.user_id = r.user_id
      WHERE r.place_id = @place_id AND r.status = 'APPROVED'
      ORDER BY r.created_at DESC, r.review_id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
  const rows = dataResult.recordset as Omit<ReviewRow, "images">[];
  const imageRequest = pool.request();
  imageRequest.input("place_id", sql.Int, placeId);
  const reviewIds = rows.map((row, index) => {
    imageRequest.input(`review_id_${index}`, sql.Int, row.review_id);
    return `@review_id_${index}`;
  });
  const imageResult = reviewIds.length
    ? await imageRequest.query(`
    SELECT i.image_id, i.review_id FROM review_images i
    INNER JOIN reviews r ON r.review_id = i.review_id
    INNER JOIN places p ON p.place_id = r.place_id
    WHERE i.review_id IN (${reviewIds.join(",")}) AND r.place_id = @place_id
      AND r.status = 'APPROVED' AND p.status = 'ACTIVE'
    ORDER BY i.review_id, i.image_order
  `)
    : { recordset: [] };
  const imagesByReview = new Map<
    number,
    { image_id: number; image_url: string }[]
  >();
  for (const image of imageResult.recordset as {
    image_id: number;
    review_id: number;
  }[]) {
    const images = imagesByReview.get(image.review_id) ?? [];
    images.push({
      image_id: image.image_id,
      image_url: `/api/places/${placeId}/reviews/${image.review_id}/images/${image.image_id}`,
    });
    imagesByReview.set(image.review_id, images);
  }
  return {
    rows: rows.map((row) => ({
      ...row,
      images: imagesByReview.get(row.review_id) ?? [],
    })),
    total: (countResult.recordset[0] as { total: number }).total,
  };
}

export async function insertPendingReview(
  placeId: number,
  userId: number,
  rating: number,
  comment: string,
  cooldownMinutes: number,
  images: ReviewImageUpload[] = [],
): Promise<{ reviewId: number } | { retryAfterSeconds: number }> {
  const transaction = getPool().transaction();
  await transaction.begin();
  try {
    // Khóa theo tài khoản để hai request đồng thời không cùng vượt qua cooldown của một địa điểm.
    await transaction
      .request()
      .input("user_id", sql.Int, userId)
      .query(
        "SELECT user_id FROM users WITH (UPDLOCK, HOLDLOCK) WHERE user_id = @user_id",
      );
    const recentReview = await transaction
      .request()
      .input("user_id", sql.Int, userId)
      .input("place_id", sql.Int, placeId)
      .input("cooldown_minutes", sql.Int, cooldownMinutes).query(`
        SELECT TOP 1 DATEDIFF(SECOND, GETDATE(), DATEADD(MINUTE, @cooldown_minutes, created_at)) AS retry_after_seconds
        FROM reviews
        WHERE user_id = @user_id AND place_id = @place_id
          AND created_at > DATEADD(MINUTE, -@cooldown_minutes, GETDATE())
        ORDER BY created_at DESC, review_id DESC
      `);
    const retryAfterSeconds = (
      recentReview.recordset[0] as { retry_after_seconds: number } | undefined
    )?.retry_after_seconds;
    if (retryAfterSeconds !== undefined) {
      await transaction.rollback();
      return { retryAfterSeconds: Math.max(1, retryAfterSeconds) };
    }

    const result = await transaction
      .request()
      .input("place_id", sql.Int, placeId)
      .input("user_id", sql.Int, userId)
      .input("rating", sql.TinyInt, rating)
      .input("comment", sql.NVarChar(1000), comment).query(`
        INSERT INTO reviews (user_id, place_id, rating, comment, status)
        OUTPUT INSERTED.review_id
        VALUES (@user_id, @place_id, @rating, @comment, 'PENDING')
      `);
    const reviewId = (result.recordset[0] as { review_id: number }).review_id;
    for (const [index, image] of images.entries()) {
      await transaction
        .request()
        .input("review_id", sql.Int, reviewId)
        .input("image_order", sql.TinyInt, index)
        .input("mime_type", sql.VarChar(20), image.mimeType)
        .input("image_data", sql.VarBinary(sql.MAX), image.data)
        .query(`INSERT INTO review_images (review_id, image_order, mime_type, image_data)
          VALUES (@review_id, @image_order, @mime_type, @image_data)`);
    }
    await transaction.commit();
    return { reviewId };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function findApprovedReviewImage(
  placeId: number,
  reviewId: number,
  imageId: number,
): Promise<ReviewImageRow | null> {
  const result = await getPool()
    .request()
    .input("place_id", sql.Int, placeId)
    .input("review_id", sql.Int, reviewId)
    .input("image_id", sql.Int, imageId).query(`
      SELECT i.image_id, i.mime_type, i.image_data
      FROM review_images i
      INNER JOIN reviews r ON r.review_id = i.review_id
      INNER JOIN places p ON p.place_id = r.place_id
      WHERE i.image_id = @image_id AND r.review_id = @review_id
        AND r.place_id = @place_id AND r.status = 'APPROVED' AND p.status = 'ACTIVE'
    `);
  return (result.recordset[0] as ReviewImageRow | undefined) ?? null;
}

export async function findUserReviews(
  userId: number,
): Promise<AdminReviewRow[]> {
  const result = await getPool().request().input("user_id", sql.Int, userId)
    .query(`
      SELECT r.review_id, r.place_id, p.name AS place_name,
        u.full_name AS user_name, r.rating, r.comment, r.status, r.created_at
      FROM reviews r
      INNER JOIN places p ON p.place_id = r.place_id
      INNER JOIN users u ON u.user_id = r.user_id
      WHERE r.user_id = @user_id
      ORDER BY r.created_at DESC, r.review_id DESC
    `);
  return attachReviewImages(
    result.recordset as Omit<AdminReviewRow, "images">[],
    (reviewId, imageId) => `/api/reviews/${reviewId}/images/${imageId}`,
  );
}

export async function findUserReviewImage(
  reviewId: number,
  imageId: number,
  userId: number,
): Promise<ReviewImageRow | null> {
  const result = await getPool()
    .request()
    .input("review_id", sql.Int, reviewId)
    .input("image_id", sql.Int, imageId)
    .input("user_id", sql.Int, userId)
    .query(
      `SELECT i.image_id, i.mime_type, i.image_data FROM review_images i INNER JOIN reviews r ON r.review_id = i.review_id WHERE r.review_id = @review_id AND i.image_id = @image_id AND r.user_id = @user_id`,
    );
  return (result.recordset[0] as ReviewImageRow | undefined) ?? null;
}

export async function findAdminReviewImage(
  reviewId: number,
  imageId: number,
): Promise<ReviewImageRow | null> {
  const result = await getPool()
    .request()
    .input("review_id", sql.Int, reviewId)
    .input("image_id", sql.Int, imageId)
    .query(
      `SELECT i.image_id, i.mime_type, i.image_data FROM review_images i INNER JOIN reviews r ON r.review_id = i.review_id WHERE r.review_id = @review_id AND i.image_id = @image_id`,
    );
  return (result.recordset[0] as ReviewImageRow | undefined) ?? null;
}

export async function findReviewOwner(reviewId: number): Promise<{
  user_id: number;
  status: "PENDING" | "APPROVED" | "HIDDEN";
} | null> {
  const result = await getPool()
    .request()
    .input("review_id", sql.Int, reviewId)
    .query("SELECT user_id, status FROM reviews WHERE review_id = @review_id");
  return (
    (result.recordset[0] as
      | { user_id: number; status: "PENDING" | "APPROVED" | "HIDDEN" }
      | undefined) ?? null
  );
}

export async function updateOwnReviewTx(
  reviewId: number,
  userId: number,
  rating: number,
  comment: string,
  keepImageIds?: number[],
  images: ReviewImageUpload[] = [],
): Promise<"updated" | "missing" | "forbidden" | "invalidImages"> {
  const transaction = getPool().transaction();
  await transaction.begin();
  try {
    const review = await transaction
      .request()
      .input("review_id", sql.Int, reviewId)
      .query(
        "SELECT user_id, place_id, status FROM reviews WITH (UPDLOCK, HOLDLOCK) WHERE review_id = @review_id",
      );
    const row = review.recordset[0] as
      | {
          user_id: number;
          place_id: number;
          status: "PENDING" | "APPROVED" | "HIDDEN";
        }
      | undefined;
    if (!row) {
      await transaction.rollback();
      return "missing";
    }
    if (row.user_id !== userId) {
      await transaction.rollback();
      return "forbidden";
    }
    await transaction
      .request()
      .input("place_id", sql.Int, row.place_id)
      .query(
        "SELECT place_id FROM places WITH (UPDLOCK, HOLDLOCK) WHERE place_id = @place_id",
      );
    // Không có keepImageIds nghĩa là request cũ chỉ sửa nội dung; có danh sách thì thay ảnh cùng transaction.
    if (keepImageIds !== undefined) {
      const existing = await transaction
        .request()
        .input("review_id", sql.Int, reviewId)
        .query(
          "SELECT image_id FROM review_images WITH (UPDLOCK, HOLDLOCK) WHERE review_id = @review_id ORDER BY image_order",
        );
      const existingRows = existing.recordset as { image_id: number }[];
      const existingIds = new Set(existingRows.map((image) => image.image_id));
      if (keepImageIds.some((imageId) => !existingIds.has(imageId))) {
        await transaction.rollback();
        return "invalidImages";
      }
      const keepSet = new Set(keepImageIds);
      const orderedKeepIds = existingRows
        .filter((image) => keepSet.has(image.image_id))
        .map((image) => image.image_id);
      const deleteRequest = transaction
        .request()
        .input("review_id", sql.Int, reviewId);
      const keepParameters = orderedKeepIds.map((imageId, index) => {
        deleteRequest.input(`keep_image_${index}`, sql.Int, imageId);
        return `@keep_image_${index}`;
      });
      await deleteRequest.query(
        `DELETE FROM review_images WHERE review_id = @review_id${keepParameters.length ? ` AND image_id NOT IN (${keepParameters.join(",")})` : ""}`,
      );
      for (const [index, imageId] of orderedKeepIds.entries()) {
        await transaction
          .request()
          .input("review_id", sql.Int, reviewId)
          .input("image_id", sql.Int, imageId)
          .input("image_order", sql.TinyInt, index)
          .query(
            "UPDATE review_images SET image_order = @image_order WHERE review_id = @review_id AND image_id = @image_id",
          );
      }
      for (const [index, image] of images.entries()) {
        await transaction
          .request()
          .input("review_id", sql.Int, reviewId)
          .input("image_order", sql.TinyInt, orderedKeepIds.length + index)
          .input("mime_type", sql.VarChar(20), image.mimeType)
          .input("image_data", sql.VarBinary(sql.MAX), image.data)
          .query(
            "INSERT INTO review_images (review_id, image_order, mime_type, image_data) VALUES (@review_id, @image_order, @mime_type, @image_data)",
          );
      }
    }
    await transaction
      .request()
      .input("review_id", sql.Int, reviewId)
      .input("rating", sql.TinyInt, rating)
      .input("comment", sql.NVarChar(1000), comment).query(`
        UPDATE reviews SET rating = @rating, comment = @comment, status = 'PENDING',
          moderated_by = NULL, moderated_at = NULL, updated_at = GETDATE()
        WHERE review_id = @review_id
      `);
    if (row.status === "APPROVED")
      await recalculatePlaceReviewSummary(transaction, row.place_id);
    await transaction.commit();
    return "updated";
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteOwnReviewTx(
  reviewId: number,
  userId: number,
): Promise<"deleted" | "missing" | "forbidden"> {
  const transaction = getPool().transaction();
  await transaction.begin();
  try {
    const review = await transaction
      .request()
      .input("review_id", sql.Int, reviewId)
      .query(
        "SELECT user_id, place_id, status FROM reviews WITH (UPDLOCK, HOLDLOCK) WHERE review_id = @review_id",
      );
    const row = review.recordset[0] as
      | {
          user_id: number;
          place_id: number;
          status: "PENDING" | "APPROVED" | "HIDDEN";
        }
      | undefined;
    if (!row) {
      await transaction.rollback();
      return "missing";
    }
    if (row.user_id !== userId) {
      await transaction.rollback();
      return "forbidden";
    }
    await transaction
      .request()
      .input("place_id", sql.Int, row.place_id)
      .query(
        "SELECT place_id FROM places WITH (UPDLOCK, HOLDLOCK) WHERE place_id = @place_id",
      );
    await transaction
      .request()
      .input("review_id", sql.Int, reviewId)
      .query("DELETE FROM reviews WHERE review_id = @review_id");
    if (row.status === "APPROVED")
      await recalculatePlaceReviewSummary(transaction, row.place_id);
    await transaction.commit();
    return "deleted";
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function isActivePlace(placeId: number): Promise<boolean> {
  const result = await getPool()
    .request()
    .input("place_id", sql.Int, placeId)
    .query(
      "SELECT 1 AS found FROM places WHERE place_id = @place_id AND status = 'ACTIVE'",
    );
  return result.recordset.length > 0;
}

export async function findAdminReviews(
  rating?: number,
  status?: string,
): Promise<AdminReviewRow[]> {
  const request = getPool().request();
  const filters: string[] = [];
  if (rating !== undefined) {
    request.input("rating", sql.TinyInt, rating);
    filters.push("r.rating = @rating");
  }
  if (status) {
    request.input("status", sql.VarChar(20), status);
    filters.push("r.status = @status");
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await request.query(`
    SELECT r.review_id, r.place_id, p.name AS place_name,
      u.full_name AS user_name, r.rating, r.comment, r.status, r.created_at
    FROM reviews r
    INNER JOIN places p ON p.place_id = r.place_id
    INNER JOIN users u ON u.user_id = r.user_id
    ${where}
    ORDER BY CASE WHEN r.status = 'PENDING' THEN 0 ELSE 1 END,
      r.created_at DESC, r.review_id DESC
  `);
  return attachReviewImages(
    result.recordset as Omit<AdminReviewRow, "images">[],
    (reviewId, imageId) => `/api/admin/reviews/${reviewId}/images/${imageId}`,
  );
}

export async function updateReviewStatusTx(
  reviewId: number,
  status: "APPROVED" | "HIDDEN",
  moderatorId: number,
): Promise<boolean> {
  const transaction = getPool().transaction();
  await transaction.begin();
  try {
    const placeId = await lockReviewPlace(transaction, reviewId);
    if (!placeId) {
      await transaction.rollback();
      return false;
    }
    const result = await transaction
      .request()
      .input("review_id", sql.Int, reviewId)
      .input("status", sql.VarChar(20), status)
      .input("moderator_id", sql.Int, moderatorId).query(`
        UPDATE reviews
        SET status = @status, moderated_by = @moderator_id,
            moderated_at = GETDATE(), updated_at = GETDATE()
        WHERE review_id = @review_id
      `);
    if (!result.rowsAffected[0]) {
      await transaction.rollback();
      return false;
    }
    await recalculatePlaceReviewSummary(transaction, placeId);
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteReviewTx(reviewId: number): Promise<boolean> {
  const transaction = getPool().transaction();
  await transaction.begin();
  try {
    const placeId = await lockReviewPlace(transaction, reviewId);
    if (!placeId) {
      await transaction.rollback();
      return false;
    }
    const result = await transaction
      .request()
      .input("review_id", sql.Int, reviewId).query(`
        DELETE FROM reviews
        WHERE review_id = @review_id
      `);
    if (!result.rowsAffected[0]) {
      await transaction.rollback();
      return false;
    }
    await recalculatePlaceReviewSummary(transaction, placeId);
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function lockReviewPlace(
  transaction: sql.Transaction,
  reviewId: number,
): Promise<number | null> {
  const review = await transaction
    .request()
    .input("review_id", sql.Int, reviewId)
    .query(
      "SELECT place_id FROM reviews WITH (UPDLOCK, HOLDLOCK) WHERE review_id = @review_id",
    );
  const placeId = (review.recordset[0] as { place_id: number } | undefined)
    ?.place_id;
  if (!placeId) return null;

  await transaction
    .request()
    .input("place_id", sql.Int, placeId)
    .query(
      "SELECT place_id FROM places WITH (UPDLOCK, HOLDLOCK) WHERE place_id = @place_id",
    );
  return placeId;
}

/**
 * Tính avg_rating (làm tròn 1 chữ số thập phân) và review_count, chỉ từ review APPROVED;
 * nếu không có review APPROVED thì cả hai bằng 0. Hàm nhận transaction đang mở từ caller,
 * không tự mở/commit/rollback transaction; lỗi truy vấn được truyền lên caller.
 *
 * Bàn giao cho Tin — luồng hiện tại:
 * - Admin: API /api/admin/reviews → controller → moderateReview → updateReviewStatusTx.
 *   Repository mở transaction, khóa review rồi place, đổi trạng thái APPROVED/HIDDEN, gọi hàm
 *   này rồi mới commit. Đây là nơi hiện tại tính lại summary cho luồng duyệt/ẩn.
 * - User sửa: PUT /api/reviews/:reviewId → updateOwnReviewTx; review APPROVED chuyển thành
 *   PENDING, sau đó hàm này cập nhật summary trước commit.
 * - User xóa: DELETE /api/reviews/:reviewId → deleteOwnReviewTx; nếu review đang APPROVED thì
 *   tính lại summary sau khi xóa và trước commit.
 *
 * Khi thêm/đổi API duyệt hoặc ẩn, giữ việc đổi trạng thái và gọi hàm này trong cùng transaction,
 * gọi sau khi đổi trạng thái và trước commit. Nếu cập nhật review hoặc summary lỗi, rollback
 * transaction để review và summary không bị lệch. Nếu caller khác sửa/xóa review APPROVED, caller
 * đó cũng phải gọi hàm này trong transaction của thao tác. Giữ thứ tự khóa review rồi place để
 * đồng nhất với các luồng hiện có khi nhiều cập nhật cùng địa điểm chạy đồng thời.
 */
export async function recalculatePlaceReviewSummary(
  transaction: sql.Transaction,
  placeId: number,
): Promise<void> {
  await transaction.request().input("place_id", sql.Int, placeId).query(`
      UPDATE places
      SET avg_rating = COALESCE((
            SELECT CAST(AVG(CAST(rating AS decimal(4, 2))) AS decimal(2, 1))
            FROM reviews WHERE place_id = @place_id AND status = 'APPROVED'
          ), 0),
          review_count = (
            SELECT COUNT(*) FROM reviews WHERE place_id = @place_id AND status = 'APPROVED'
          ),
          updated_at = GETDATE()
      WHERE place_id = @place_id
    `);
}
