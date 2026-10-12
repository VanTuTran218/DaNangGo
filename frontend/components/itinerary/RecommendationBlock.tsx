"use client";

import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import Image from "next/image";

export interface RecommendationItem {
  id: string;
  title: string;
  category: string;
  price: number;
  imageUrl: string;
}

interface RecommendationBlockProps {
  items: RecommendationItem[];
  selectedIds: string[];
  guestCount: number;
  onToggle: (item: RecommendationItem) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function RecommendationBlock({ items, selectedIds, guestCount, onToggle }: RecommendationBlockProps) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {items.map((item) => {
        const isAdded = selectedIds.includes(item.id);
        
        return (
          <motion.div
            key={item.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex gap-4 transition-shadow hover:shadow-md"
          >
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
            </div>
            
            <div className="flex-1 py-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-orange-500 font-semibold mb-1">{item.category}</p>
                <h4 className="text-sm font-bold text-gray-900 line-clamp-2">{item.title}</h4>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-semibold text-gray-700">
                  {(item.price * guestCount).toLocaleString("vi-VN")}đ / đoàn
                </span>
                
                <motion.button
                  whileTap={{ scale: 0.9, opacity: 0.7 }}
                  onClick={() => onToggle(item)}
                  title={isAdded ? "Bỏ khỏi bản xem trước" : "Thêm vào bản xem trước, không đặt chỗ"}
                  aria-label={isAdded ? `Bỏ ${item.title} khỏi bản xem trước` : `Thêm ${item.title} vào bản xem trước`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isAdded 
                      ? "bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-600"
                      : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-500"
                  }`}
                >
                  {isAdded ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
