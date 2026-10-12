'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'teal';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  requireReason = false,
  reasonPlaceholder = 'Nhập lý do thực hiện thao tác này...',
  loading = false,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setReason('');
      setError('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setError('Vui lòng nhập lý do bắt buộc.');
      return;
    }
    setError('');
    await onConfirm(reason.trim());
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 text-red-600',
          btnBg: 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600',
          btnBg: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20',
        };
      case 'teal':
        return {
          iconBg: 'bg-teal-100 text-teal-600',
          btnBg: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${styles.iconBg}`}>
                    {variant === 'danger' ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  disabled={loading}
                  aria-label="Đóng hộp thoại"
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="py-4 text-sm text-gray-600 leading-relaxed">
                {description}

                {requireReason && (
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Lý do <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        if (e.target.value.trim()) setError('');
                      }}
                      placeholder={reasonPlaceholder}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    />
                    {error && (
                      <p role="alert" className="text-xs text-red-500 mt-1">
                        {error}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`rounded-xl px-5 py-2 text-sm font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50 ${styles.btnBg}`}
                >
                  {loading ? 'Đang xử lý...' : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
