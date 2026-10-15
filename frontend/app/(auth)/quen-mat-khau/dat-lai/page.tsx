import { redirect } from 'next/navigation';

/**
 * Trang /quen-mat-khau/dat-lai đã được thay thế bằng flow OTP mới.
 * Nếu có ai truy cập URL cũ (ví dụ từ email link token cũ), redirect về flow OTP hiện tại.
 */
export default function OldResetPasswordPage() {
  redirect('/quen-mat-khau');
}
