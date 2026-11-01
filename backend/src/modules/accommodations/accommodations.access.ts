import type { RequestHandler, Response } from "express";
import { getPool, sql } from "../../config/db";
import { AuthError } from "../auth/auth.errors";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

/**
 * Auth cho route ghi dữ liệu lưu trú.
 * - Partner đăng nhập bằng phiên USER (cookie access_token)
 * - Admin đăng nhập bằng phiên ADMIN (cookie admin_access)
 * Chọn phiên theo cookie có mặt, rồi dùng lại requireAuth/requireRole của Tuấn.
 */
export const manageAuth: RequestHandler[] = [
  (req, res, next) => {
    const cookies = req.cookies as Record<string, string> | undefined;
    requireAuth(cookies?.admin_access ? "ADMIN" : "USER")(req, res, next);
  },
  requireRole("PARTNER", "ADMIN"),
];

export interface Actor {
  userId: number;
  role: "PARTNER" | "ADMIN";
  partnerId: number | null;
}

/** Middleware của Tuấn chưa kiểm tra hồ sơ đối tác đã duyệt, nên kiểm tra ở đây. */
export async function resolveActor(res: Response): Promise<Actor> {
  const userId = res.locals.authUserId as number;
  const role = res.locals.authRole as "PARTNER" | "ADMIN";
  if (role === "ADMIN") return { userId, role, partnerId: null };

  const result = await getPool()
    .request()
    .input("userId", sql.Int, userId)
    .query<{
      partner_id: number;
      approval_status: string;
    }>("SELECT partner_id, approval_status FROM dbo.partner_profiles WHERE user_id = @userId");
  const profile = result.recordset[0];
  if (!profile || profile.approval_status !== "APPROVED") {
    throw new AuthError(403, "Hồ sơ chưa được duyệt.");
  }
  return { userId, role, partnerId: profile.partner_id };
}

export interface OwnedPlace {
  place_id: number;
  partner_id: number | null;
  status: string;
}

/** 404 nếu không có, 403 nếu không phải chủ hoặc đang LOCKED (Partner). Admin được tất cả. */
export async function assertCanManage(
  actor: Actor,
  placeId: number,
): Promise<OwnedPlace> {
  const result = await getPool().request().input("id", sql.Int, placeId)
    .query<OwnedPlace>(`
      SELECT place_id, partner_id, status FROM dbo.places
      WHERE place_id = @id AND place_type = 'ACCOMMODATION'`);
  const place = result.recordset[0];
  if (!place) throw new AuthError(404, "Không tìm thấy lưu trú.");
  if (actor.role === "ADMIN") return place;
  if (place.partner_id !== actor.partnerId)
    throw new AuthError(403, "Bạn không có quyền với lưu trú này.");
  if (place.status === "LOCKED")
    throw new AuthError(403, "Lưu trú đang bị khóa, chỉ Admin được thao tác.");
  return place;
}

export function parseId(raw: unknown, label = "ID"): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1)
    throw new AuthError(400, `${label} không hợp lệ.`);
  return id;
}
