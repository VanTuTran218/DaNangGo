'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PartnerPageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description: string;
  backgroundImage?: string;
  action?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary';
  };
}

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export default function PartnerPageHeader({
  breadcrumbs,
  title,
  description,
  backgroundImage = '/images/partner/danang-dragon-bridge-night.jpg',
  action,
}: PartnerPageHeaderProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-[22px] bg-[#073B3A] text-white p-6 sm:p-8 md:p-10 shadow-md border border-[#073B3A]/20 mb-7"
      style={{
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 45%',
      }}
    >
      {/* Overlay xanh biển / deep ocean */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#052E2D]/95 via-[#073B3A]/88 to-[#008F89]/70" />

      {/* Decorative Wave SVG Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <svg
          className="absolute -bottom-6 -left-10 w-[120%] h-32 text-[#14B8A6]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 C220,100 450,-30 720,55 C920,115 1080,25 1200,50 L1200,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          {/* Breadcrumb */}
          <motion.nav
            variants={itemVariants}
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-teal-100/90 font-medium flex-wrap"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={idx} className="flex items-center gap-1.5">
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-white transition-colors hover:underline underline-offset-4"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        isLast
                          ? 'px-2.5 py-0.5 rounded-full bg-white/12 border border-white/15 text-[#6EE7B7] font-semibold'
                          : ''
                      }
                    >
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight className="w-3.5 h-3.5 text-teal-200/60" />}
                </div>
              );
            })}
          </motion.nav>

          {/* Title & Description */}
          <motion.h1
            variants={itemVariants}
            className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-white leading-tight"
          >
            {title}
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-xs sm:text-sm text-teal-50/90 leading-relaxed"
          >
            {description}
          </motion.p>
        </div>

        {/* Action Button */}
        {action && (
          <motion.div variants={itemVariants} className="shrink-0">
            <Link
              href={action.href}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] ${
                action.variant === 'secondary'
                  ? 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-xs border border-white/20'
                  : 'bg-[#FF8A24] hover:bg-[#f07b16] text-white shadow-black/20'
              }`}
            >
              {action.icon}
              <span>{action.label}</span>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
