'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id?: string;
  type: ToastType;
  title?: string;
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  duration?: number; // ms, default 4000
}

interface ToastNotificationProps {
  toast: ToastItem | null;
  onClose: () => void;
}

export default function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration ?? 4500;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      bar: 'bg-emerald-500',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-950',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
      bar: 'bg-rose-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-950',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      bar: 'bg-amber-500',
    },
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-950',
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
      bar: 'bg-sky-500',
    },
  }[toast.type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`fixed top-6 right-6 z-50 max-w-md w-full sm:w-auto p-4 rounded-3xl shadow-xl border overflow-hidden ${typeConfig.bg}`}
      >
        <div className="flex items-start gap-3">
          {typeConfig.icon}

          <div className="flex-1 min-w-0 pr-2">
            {toast.title && (
              <h5 className="text-xs font-extrabold mb-0.5">{toast.title}</h5>
            )}
            <p className="text-xs font-semibold leading-relaxed break-words">
              {toast.message}
            </p>

            {toast.action && (
              <div className="mt-2.5">
                {toast.action.href ? (
                  <Link
                    href={toast.action.href}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 underline underline-offset-2"
                  >
                    {toast.action.label} <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : (
                  <button
                    onClick={toast.action.onClick}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 underline underline-offset-2"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-black/5 transition-all text-xs font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress timer bar */}
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: (toast.duration ?? 4500) / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 h-0.5 ${typeConfig.bar}`}
        />
      </motion.div>
    </AnimatePresence>
  );
}
