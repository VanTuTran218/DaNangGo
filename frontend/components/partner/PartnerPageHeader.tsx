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
  action?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary';
  };
}

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

export default function PartnerPageHeader({
  breadcrumbs,
  title,
  description,
  action,
}: PartnerPageHeaderProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-sky-700 text-white p-6 md:p-10 shadow-lg shadow-teal-900/10 mb-8"
    >
      {/* Decorative Wave SVG Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
        <svg
          className="absolute -bottom-6 -left-10 w-[120%] h-36 text-white"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          {/* Breadcrumb */}
          <motion.nav variants={itemVariants} aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-teal-100/90 font-medium flex-wrap">
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
                    <span className={isLast ? 'text-white font-semibold' : ''}>{crumb.label}</span>
                  )}
                  {!isLast && <ChevronRight className="w-3.5 h-3.5 text-teal-200/60" />}
                </div>
              );
            })}
          </motion.nav>

          {/* Title & Description */}
          <motion.h1
            variants={itemVariants}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight"
          >
            {title}
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xs sm:text-sm text-teal-50/90 leading-relaxed">
            {description}
          </motion.p>
        </div>

        {/* Action Button */}
        {action && (
          <motion.div variants={itemVariants} className="shrink-0">
            <Link
              href={action.href}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 ${
                action.variant === 'secondary'
                  ? 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-xs border border-white/20'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25'
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
