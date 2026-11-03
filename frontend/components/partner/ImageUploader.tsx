'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  error?: string;
}

export default function ImageUploader({ images, onChange, error }: ImageUploaderProps) {
  const [urlInput, setUrlInput] = useState('');
  const [inputError, setInputError] = useState('');

  const handleAdd = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setInputError('Vui lòng dán đường dẫn URL hình ảnh.');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setInputError('Đường dẫn ảnh phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    if (images.includes(trimmed)) {
      setInputError('Ảnh này đã có trong danh sách.');
      return;
    }

    onChange([...images, trimmed]);
    setUrlInput('');
    setInputError('');
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Input thêm URL ảnh */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Đường dẫn ảnh trực tuyến (Image URL) *
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (inputError) setInputError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="Dán link ảnh https://images.unsplash.com/photo-..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            />
            <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Thêm ảnh
          </button>
        </div>
        {inputError && (
          <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {inputError}
          </p>
        )}
        {error && !inputError && (
          <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>

      {/* Grid danh sách ảnh */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          <AnimatePresence>
            {images.map((url, idx) => (
              <motion.div
                key={url}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="relative group h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs"
              >
                <Image src={url} alt={`Ảnh quán ${idx + 1}`} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    title="Xóa ảnh này"
                    className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-90 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {idx === 0 && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-teal-600/90 text-white text-[10px] font-bold shadow-xs">
                    Ảnh bìa
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center">
          <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Chưa có ảnh nào. Vui lòng dán ít nhất 1 URL hình ảnh quảng bá cơ sở.</p>
        </div>
      )}
    </div>
  );
}
