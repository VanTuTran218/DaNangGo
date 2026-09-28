import { useState } from 'react';
import { Lock, Copy, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export interface Privilege {
  id: string;
  title: string;
  category: string;
  tier: 'Silver' | 'Gold' | 'Diamond';
  code: string;
  image: string;
  desc: string;
  pointsRequired?: number;
}

interface PrivilegeCardProps {
  privilege: Privilege;
  isLocked: boolean;
  missingPoints?: number;
  idx?: number;
}

export function PrivilegeCard({ privilege, isLocked, missingPoints = 0, idx = 0 }: PrivilegeCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (isLocked) return;
    navigator.clipboard.writeText(privilege.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.05 }}
      className={`relative overflow-hidden rounded-xl border bg-white shadow-sm flex flex-col ${isLocked ? 'opacity-80' : ''}`}
    >
      <div className="h-40 bg-gray-200 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={privilege.image} alt={privilege.title} className="w-full h-full object-cover" />
        {isLocked && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4 text-center">
            <Lock size={32} className="mb-2" />
            <p className="font-medium text-sm">Cần Hạng {privilege.tier} để mở khóa</p>
            {missingPoints > 0 && (
              <p className="text-xs mt-1 text-gray-200">(Còn thiếu {missingPoints} điểm)</p>
            )}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {privilege.category}
          </span>
          <span className="text-xs font-medium text-gray-500">{privilege.tier}</span>
        </div>
        <h4 className="font-bold text-gray-900 mb-1">{privilege.title}</h4>
        <p className="text-sm text-gray-600 flex-1 mb-4">{privilege.desc}</p>
        
        <div className="mt-auto">
          {isLocked ? (
            <div className="h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="h-4 w-24 bg-gray-300 rounded blur-[2px]" />
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center font-mono font-bold text-sm tracking-widest text-gray-800 border border-dashed border-gray-300">
                {privilege.code}
              </div>
              <button 
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg flex items-center justify-center transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
