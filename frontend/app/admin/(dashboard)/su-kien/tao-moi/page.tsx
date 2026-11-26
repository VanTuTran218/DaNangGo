import type { Metadata } from 'next';
import EventForm from '@/components/admin/events/EventForm';

export const metadata: Metadata = { title: 'Tạo sự kiện | DaNangGo Admin' };

export default function CreateEventPage() { return <EventForm />; }
