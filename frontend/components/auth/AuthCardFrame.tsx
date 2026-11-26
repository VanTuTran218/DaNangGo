'use client';

/**
 * AuthCardFrame — Nocturnal Club Sanctuary Frame (/dang-nhap, /quen-mat-khau)
 * ───────────────────────────────────────────────────────────────────────────
 * Deep Ocean Cosmos (#041017 -> #071A24) with fine starlight coordinate grid,
 * drifting atmospheric Teal/Champagne/Sunset nebula orbs, and frosted obsidian
 * glass architectural card container.
 */

import { type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

interface AuthCardFrameProps {
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
}

export default function AuthCardFrame({
  children,
  footer,
  maxWidthClass = 'max-w-[1140px]',
}: AuthCardFrameProps) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <main className="dananggo-cinematic-content min-h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-x-clip py-6 sm:py-9 px-3 sm:px-6 bg-[#041017] text-[#FFFDF5]">
      {/* Celestial Deep Ocean Cosmos Backdrop */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 overflow-hidden select-none ${
          reducedMotion ? 'explore-ambient-paused' : ''
        }`}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 88% 58% at 50% 0%, #0E2B38 0%, #061822 48%, #040F16 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: 'radial-gradient(rgba(230,217,183,0.42) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="explore-orb-a absolute -top-28 left-[10%] w-[520px] h-[520px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(45,212,191,0.18) 0%, rgba(33,107,112,0.08) 48%, transparent 72%)',
          }}
        />
        <div
          className="explore-orb-b absolute bottom-[-14%] right-[6%] w-[560px] h-[560px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(232,123,57,0.14) 0%, rgba(230,217,183,0.08) 46%, transparent 72%)',
          }}
        />
      </div>

      {/* Frosted Obsidian Architectural Sanctuary Card */}
      <div className={`auth-card-animate relative z-10 w-full ${maxWidthClass} my-auto`}>
        <div className="relative rounded-[26px] border border-[#E6D9B7]/26 bg-[#071821]/88 backdrop-blur-2xl shadow-[0_38px_96px_rgba(2,10,15,0.78),inset_0_1px_0_rgba(255,253,245,0.12)] overflow-hidden">
          {/* Subtle Leica Viewfinder Corner Hairlines */}
          <span aria-hidden="true" className="pointer-events-none absolute top-3 left-3 w-3.5 h-3.5 border-t border-l border-[#E6D9B7]/40 rounded-tl-sm z-30" />
          <span aria-hidden="true" className="pointer-events-none absolute top-3 right-3 w-3.5 h-3.5 border-t border-r border-[#E6D9B7]/40 rounded-tr-sm z-30" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 w-3.5 h-3.5 border-b border-l border-[#E6D9B7]/40 rounded-bl-sm z-30" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 w-3.5 h-3.5 border-b border-r border-[#E6D9B7]/40 rounded-br-sm z-30" />
          {children}
        </div>

        {footer && <div className="mt-4 text-center">{footer}</div>}
      </div>
    </main>
  );
}
