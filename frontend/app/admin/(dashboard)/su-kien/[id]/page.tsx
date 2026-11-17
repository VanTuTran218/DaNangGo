import type { Metadata } from 'next';
import EditEvent from '@/components/admin/events/EditEvent';

export const metadata: Metadata = { title: 'Chỉnh sửa sự kiện | DaNangGo Admin' };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditEvent id={id} />;
}
