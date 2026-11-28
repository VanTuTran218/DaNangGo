import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import express, { Router, type RequestHandler } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { detectReviewImageMime } from '../reviews/reviews.upload';

const maxMediaBytes = 5 * 1024 * 1024;
const mediaDirectory = path.resolve(process.cwd(), 'uploads', 'media');

const parseRawMedia = express.raw({
  type: ['image/jpeg', 'image/png', 'image/webp'],
  limit: maxMediaBytes,
});

const parseMediaUpload: RequestHandler = (req, res, next) => {
  parseRawMedia(req, res, (error?: unknown) => {
    if (error) {
      const uploadError = error as { status?: number; type?: string };
      if (uploadError.status === 413 || uploadError.type === 'entity.too.large') {
        res.status(413).json({ success: false, message: 'Ảnh không được vượt quá 5 MB.' });
        return;
      }
      next(error);
      return;
    }
    next();
  });
};

export async function saveMediaImage(data: Buffer): Promise<string> {
  if (data.length === 0 || data.length > maxMediaBytes) {
    throw new Error('Ảnh phải có dung lượng từ 1 byte đến 5 MB.');
  }
  const mime = detectReviewImageMime(data);
  if (!mime) throw new Error('Ảnh phải là định dạng JPG, PNG hoặc WEBP hợp lệ.');
  const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp';
  const filename = `${randomUUID()}.${extension}`;
  await mkdir(mediaDirectory, { recursive: true });
  await writeFile(path.join(mediaDirectory, filename), data, { flag: 'wx' });
  return `/uploads/media/${filename}`;
}

const uploadsRouter = Router();

uploadsRouter.post(
  '/image',
  requireAuth('USER'),
  requireRole('USER', 'PARTNER', 'ADMIN'),
  parseMediaUpload,
  async (req, res) => {
    if (!Buffer.isBuffer(req.body)) {
      res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh JPG, PNG hoặc WEBP.' });
      return;
    }
    try {
      const relativePath = await saveMediaImage(req.body);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const url = `${baseUrl}${relativePath}`;
      res.status(201).json({
        success: true,
        data: { url, path: relativePath },
        message: 'Tải ảnh lên thành công.',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Ảnh không hợp lệ.',
      });
    }
  }
);

export default uploadsRouter;
