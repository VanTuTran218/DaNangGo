"use client";

import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
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
  onAdd: (item: RecommendationItem) => void;
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

export default function RecommendationBlock({ items, onAdd }: RecommendationBlockProps) {
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAdd = (item: RecommendationItem) => {
    if (addedIds.has(item.id)) return;
    
    setAddedIds(prev => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
    
    onAdd(item);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {items.map((item) => {
        const isAdded = addedIds.has(item.id);
        
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
                  {item.price.toLocaleString("vi-VN")}đ
                </span>
                
                <motion.button
                  whileTap={{ scale: 0.9, opacity: 0.7 }}
                  onClick={() => handleAdd(item)}
                  disabled={isAdded}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isAdded 
                      ? "bg-green-100 text-green-600 cursor-default" 
                      : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-500"
                  }`}
                >
                  {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
