import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AuthError } from '../modules/auth/auth.errors';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof AuthError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: error.issues[0]?.message || 'Dữ liệu gửi lên không hợp lệ.',
    });
    return;
  }
  if (error instanceof SyntaxError && 'body' in (error as unknown as Record<string, unknown>)) {
    res.status(400).json({
      success: false,
      message: 'Dữ liệu JSON gửi lên không đúng định dạng.',
    });
    return;
  }
  // Xử lý custom error objects (throw { statusCode, message, errors })
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const err = error as { statusCode: number; message: string; errors?: Record<string, string> };
    const response: { success: boolean; message: string; errors?: Record<string, string> } = {
      success: false,
      message: err.message,
    };
    if (err.errors) {
      response.errors = err.errors;
    }
    res.status(err.statusCode).json(response);
    return;
  }
  console.error('Lỗi API:', error);
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.' });
};
