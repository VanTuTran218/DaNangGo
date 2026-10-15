'use client';

/**
 * AuthCardFrame
 * ─────────────
 * Wrapper pure-style cho trang /dang-nhap.
 * Cung cấp:
 *   1. Nền trang gradient dịch chuyển chậm + 3 blobs trôi lơ lửng
 *   2. Card tổng: fade-in+slide-up+scale khi vào trang
 *   3. Viền gradient conic xoay chậm quanh card
 *   4. Đổ bóng nhiều lớp, hover nâng lên (translateY -3px)
 *   5. Shine — vệt sáng lướt qua định kỳ
 *
 * KHÔNG chứa bất kỳ logic nghiệp vụ nào.
 * prefers-reduced-motion được xử lý qua globals.css.
 */

import { type ReactNode } from 'react';

interface AuthCardFrameProps {
  children: ReactNode;
}

export default function AuthCardFrame({ children }: AuthCardFrameProps) {
  return (
    /* ── Nền trang ── */
    <div className="auth-bg min-h-screen flex items-center justify-center relative overflow-hidden py-8 px-4">

      {/* ── Blob 1: teal — top-left ── */}
      <div
        className="auth-blob-1 absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />

      {/* ── Blob 2: orange — bottom-right ── */}
      <div
        className="auth-blob-2 absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(251,146,60,0.14) 0%, transparent 70%)',
          filter: 'blur(48px)',
        }}
        aria-hidden="true"
      />

      {/* ── Blob 3: cyan — center ── */}
      <div
        className="auth-blob-3 absolute top-1/3 left-1/3 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)',
          filter: 'blur(32px)',
        }}
        aria-hidden="true"
      />

      {/* ── Card wrapper với animation, viền, shine ── */}
      <div className="auth-card-animate relative z-10 w-full max-w-[1200px]">

        {/* Viền gradient conic xoay */}
        <div className="auth-card-border" aria-hidden="true" />

        {/* Card chính */}
        <div className="auth-card-frame">
          {/* Shine overlay */}
          <div className="auth-card-shine" aria-hidden="true" />

          {/* Nội dung (AuthCard) */}
          {children}
        </div>
      </div>
    </div>
  );
}
