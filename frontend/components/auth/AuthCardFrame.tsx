'use client';

/**
 * AuthCardFrame
 * ─────────────
 * Khung giao diện cao cấp cho trang /dang-nhap (Đăng nhập & Đăng ký).
 * - Nền chuyển sắc nhẹ nhàng: Pearl White (#FAFCFD), Sky Tint, Soft Cream
 * - 3 Ambient Glow Shapes (radial gradient) chuyển động rất chậm với biên độ nhỏ
 * - Khung Card: bo góc 28px, viền gradient siêu mỏng ngọc lam & cam, đổ bóng nhiều tầng
 * - Animation xuất hiện: fade-in từ 0 lên 1, scale từ 0.98 lên 1, translateY từ 15px về 0
 */

import { type ReactNode } from 'react';

interface AuthCardFrameProps {
  children: ReactNode;
}

export default function AuthCardFrame({ children }: AuthCardFrameProps) {
  return (
    /* ── Nền trang auth ── */
    <main className="auth-bg min-h-[100dvh] w-full flex items-center justify-center relative overflow-x-hidden py-6 sm:py-10 px-3 sm:px-6">

      {/* ── Ambient Glow 1: Turquoise — Top-Left ── */}
      <div
        className="auth-blob-1 absolute -top-24 -left-24 w-[420px] sm:w-[540px] h-[420px] sm:h-[540px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(17,197,198,0.14) 0%, rgba(8,126,156,0.06) 50%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        aria-hidden="true"
      />

      {/* ── Ambient Glow 2: Sunset Orange — Bottom-Right ── */}
      <div
        className="auth-blob-2 absolute -bottom-28 -right-28 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,106,0,0.11) 0%, rgba(251,146,60,0.04) 50%, transparent 70%)',
          filter: 'blur(55px)',
        }}
        aria-hidden="true"
      />

      {/* ── Ambient Glow 3: Ocean Blue — Center-Mid ── */}
      <div
        className="auth-blob-3 absolute top-1/3 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(39,229,221,0.08) 0%, transparent 65%)',
          filter: 'blur(45px)',
        }}
        aria-hidden="true"
      />

      {/* ── Card Wrapper: Animation xuất hiện, viền gradient siêu mỏng, hiệu ứng nổi tự nhiên ── */}
      <div className="auth-card-animate relative z-10 w-full max-w-[1180px] my-auto">

        {/* Viền gradient xanh ngọc & cam cực mỏng */}
        <div className="auth-card-border" aria-hidden="true" />

        {/* Khung Card chính */}
        <div className="auth-card-frame">
          {/* Shine overlay lướt nhẹ */}
          <div className="auth-card-shine" aria-hidden="true" />

          {/* Nội dung bên trong (AuthCard) */}
          {children}
        </div>
      </div>
    </main>
  );
}
