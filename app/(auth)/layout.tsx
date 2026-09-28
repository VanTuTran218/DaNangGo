import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Đăng nhập | DanangGo',
  description: 'Đăng nhập hoặc tạo tài khoản DanangGo để nhận ưu đãi Hạng Bạc và lịch trình cá nhân hóa.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
