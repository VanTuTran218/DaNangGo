"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { MapPin, Clock, Utensils, Camera } from "lucide-react";
import Image from "next/image";

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description: string;
  type: "attraction" | "food" | "hotel" | "transport";
  imageUrl?: string;
  location?: string;
}

interface ItineraryTimelineProps {
  items: TimelineItem[];
}

const typeConfig = {
  attraction: { icon: Camera, color: "text-blue-500", bg: "bg-blue-100" },
  food: { icon: Utensils, color: "text-orange-500", bg: "bg-orange-100" },
  hotel: { icon: MapPin, color: "text-purple-500", bg: "bg-purple-100" },
  transport: { icon: Clock, color: "text-gray-500", bg: "bg-gray-100" }
};

const TimelineNode = ({ item, index }: { item: TimelineItem; index: number }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" });
  const { scrollYProgress } = useScroll({
    target: nodeRef,
    offset: ["start end", "end start"]
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], [-20, 20]);

  const Config = typeConfig[item.type];
  const Icon = Config.icon;

  return (
    <div ref={nodeRef} className="relative flex gap-6 mb-12 last:mb-0">
      {/* Dot */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.15 }}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${Config.bg} shadow-sm border-2 border-white`}>
          <Icon className={`w-5 h-5 ${Config.color}`} />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="flex-1 pb-4"
        initial={{ opacity: 0, x: 20 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
        transition={{ duration: 0.5, delay: index * 0.15 + 0.1 }}
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-sm font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md inline-block mb-2">
                {item.time}
              </span>
              <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">{item.description}</p>
          
          {item.location && (
            <div className="flex items-center text-gray-500 text-sm mb-4">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{item.location}</span>
            </div>
          )}

          {item.imageUrl && (
            <div className="relative h-48 rounded-lg overflow-hidden mt-4">
              <motion.div style={{ y: parallaxY }} className="absolute inset-0 scale-110">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function ItineraryTimeline({ items }: ItineraryTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  return (
    <div ref={containerRef} className="relative py-8">
      {/* Vertical Line */}
      <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gray-100 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-full bg-orange-500 origin-top"
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{ height: "100%" }}
        />
      </div>

      <div className="relative">
        {items.map((item, index) => (
          <TimelineNode key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}
