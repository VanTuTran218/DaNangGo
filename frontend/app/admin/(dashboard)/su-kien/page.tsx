import type { Metadata } from 'next';
import EventList from '@/components/admin/events/EventList';

export const metadata: Metadata = { title: 'Quản lý sự kiện | DaNangGo Admin' };

export default function EventsPage() {
  return <EventList />;
}
