import { apiPatch, apiRequest } from '@/lib/api/client';

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SubmissionSummary = {
  submission_id: number;
  title: string;
  organizer_name: string;
  status: SubmissionStatus;
  submitted_at: string;
};

export type Submission = SubmissionSummary & {
  description?: string;
  location_name?: string;
  address?: string;
  start_time?: string;
  end_time?: string;
  source_url?: string;
  cover_image?: string;
  rejection_reason?: string;
};

// Giao diện API đề xuất để tích hợp với phần xét duyệt của Thành viên 1.
const path = '/api/admin/event-submissions';

export async function listSubmissions(status: SubmissionStatus, page: number, signal: AbortSignal) {
  const query = new URLSearchParams({ status, page: String(page), limit: '20' });
  const result = await apiRequest<{ items: SubmissionSummary[]; total_pages?: number }>(`${path}?${query}`, { signal, cache: 'no-store' });
  if (!Array.isArray(result.data?.items)) throw new Error('Phản hồi danh sách đề xuất không hợp lệ.');
  return { items: result.data.items, totalPages: result.pagination?.totalPages ?? result.data.total_pages ?? 1 };
}

export async function getSubmission(id: number, signal: AbortSignal) {
  const result = await apiRequest<Submission>(`${path}/${id}`, { signal, cache: 'no-store' });
  if (result.data?.submission_id !== id) throw new Error('Phản hồi chi tiết đề xuất không hợp lệ.');
  return result.data;
}

export async function reviewSubmission(id: number, status: Exclude<SubmissionStatus, 'PENDING'>, reason: string) {
  return apiPatch(`${path}/${id}/status`, {
    status,
    ...(status === 'REJECTED' && { rejection_reason: reason.trim() }),
  });
}
