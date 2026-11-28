import { apiRequest } from './client';

export async function uploadMediaImage(file: File): Promise<string> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WEBP.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Dung lượng ảnh tối đa là 5 MB.');
  }

  const res = await apiRequest<{ url: string; path: string }>('/api/uploads/image', {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!res.data?.url) {
    throw new Error(res.message || 'Không thể tải ảnh lên máy chủ.');
  }
  return res.data.url;
}
