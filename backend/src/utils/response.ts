import type { Response } from 'express';

/** 200 OK */
export const ok = (res: Response, data: unknown, message = 'Thành công') =>
  res.status(200).json({ success: true, message, data });

/** 201 Created */
export const created = (res: Response, data: unknown) =>
  res.status(201).json({ success: true, message: 'Đã tạo thành công', data });

/** 400 Bad Request */
export const badRequest = (res: Response, message: string) =>
  res.status(400).json({ success: false, message });

/** 401 Unauthorized */
export const unauthorized = (res: Response, message = 'Chưa đăng nhập') =>
  res.status(401).json({ success: false, message });

/** 403 Forbidden */
export const forbidden = (res: Response, message = 'Không có quyền thực hiện') =>
  res.status(403).json({ success: false, message });

/** 404 Not Found */
export const notFound = (res: Response, message = 'Không tìm thấy') =>
  res.status(404).json({ success: false, message });

/** 500 Internal Server Error */
export const serverError = (res: Response, error: unknown) => {
  console.error('❌ Server error:', error);
  return res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại' });
};
