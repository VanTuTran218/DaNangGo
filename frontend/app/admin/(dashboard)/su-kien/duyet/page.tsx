import type { Metadata } from 'next';
import SubmissionQueue from '@/components/admin/events/SubmissionQueue';

export const metadata: Metadata = { title: 'Duyệt đề xuất sự kiện | DaNangGo Admin' };

export default function EventSubmissionsPage() {
  return <SubmissionQueue />;
}
