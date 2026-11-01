import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import express, { type RequestHandler } from 'express';
import { detectReviewImageMime } from '../reviews/reviews.upload';

const maxAvatarBytes = 5 * 1024 * 1024;
const avatarDirectory = path.resolve(process.cwd(), 'uploads', 'avatars');

const parseRawAvatar = express.raw({
  type: ['image/jpeg', 'image/png', 'image/webp'],
  limit: maxAvatarBytes,
});

export const parseAvatarUpload: RequestHandler = (req, res, next) => {
  parseRawAvatar(req, res, (error?: unknown) => {
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

export async function saveAvatar(data: Buffer): Promise<string> {
  if (data.length === 0 || data.length > maxAvatarBytes) {
    throw new Error('Ảnh phải có dung lượng từ 1 byte đến 5 MB.');
  }
  const mime = detectReviewImageMime(data);
  if (!mime) throw new Error('Ảnh phải là JPG, PNG hoặc WEBP hợp lệ.');
  const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp';
  const filename = `${randomUUID()}.${extension}`;
  await mkdir(avatarDirectory, { recursive: true });
  await writeFile(path.join(avatarDirectory, filename), data, { flag: 'wx' });
  return `/uploads/avatars/${filename}`;
}

export async function removeStoredAvatar(avatarUrl: string | null | undefined): Promise<void> {
  if (!avatarUrl?.startsWith('/uploads/avatars/')) return;
  const filename = avatarUrl.slice('/uploads/avatars/'.length);
  if (!/^[0-9a-f-]+\.(jpg|png|webp)$/i.test(filename)) return;
  await rm(path.join(avatarDirectory, filename), { force: true });
}
