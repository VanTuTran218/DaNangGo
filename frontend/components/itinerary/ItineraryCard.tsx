"use client";

import { motion } from "framer-motion";
import { Heart, MapPin, Calendar, Trash2, Clock, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

export interface Itinerary {
  id: string;
  title: string;
  destination: string;
  date: string;
  duration: string;
  participants: number;
  status: "Sắp diễn ra" | "Đã hoàn thành" | "Bản nháp";
  images: string[];
}

interface ItineraryCardProps {
  itinerary: Itinerary;
  onDelete: (id: string) => void;
  index: number;
}

export default function ItineraryCard({ itinerary, onDelete, index }: ItineraryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const statusColors = {
    "Sắp diễn ra": "bg-blue-100 text-blue-700",
    "Đã hoàn thành": "bg-green-100 text-green-700",
    "Bản nháp": "bg-gray-100 text-gray-700",
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100"
      >
        <div className="relative flex h-56 w-full gap-1 p-2">
          {/* Big left image */}
          <div className="relative h-full w-2/3 overflow-hidden rounded-2xl bg-gray-100">
            <motion.div
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.4 }}
              className="h-full w-full relative"
            >
              <Image
                src={itinerary.images[0] || "/placeholder.jpg"}
                alt={itinerary.title}
                fill
                className="object-cover"
              />
            </motion.div>
            <div className="absolute top-3 left-3 z-10 flex gap-2">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-md bg-white/90 shadow-sm ${statusColors[itinerary.status]}`}>
                {itinerary.status}
              </span>
            </div>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-sm transition-transform hover:scale-110 active:scale-95"
            >
              <motion.div
                animate={isLiked ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                />
              </motion.div>
            </button>
          </div>
          
          {/* Two small right images */}
          <div className="flex h-full w-1/3 flex-col gap-1">
            <motion.div 
              animate={{ x: isHovered ? 2 : 0 }}
              transition={{ duration: 0.3 }}
              className="relative h-1/2 w-full overflow-hidden rounded-2xl bg-gray-100"
            >
              <Image
                src={itinerary.images[1] || "/placeholder.jpg"}
                alt="Photo 2"
                fill
                className="object-cover"
              />
            </motion.div>
            <motion.div 
              animate={{ x: isHovered ? -2 : 0 }}
              transition={{ duration: 0.3 }}
              className="relative h-1/2 w-full overflow-hidden rounded-2xl bg-gray-100"
            >
              <Image
                src={itinerary.images[2] || "/placeholder.jpg"}
                alt="Photo 3"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-1.5 text-sm text-gray-500 font-medium">
            <MapPin className="h-4 w-4 text-emerald-500" />
            {itinerary.destination}
          </div>
          <h3 className="mb-4 text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-600 transition-colors h3-card">
            {itinerary.title}
          </h3>
          
          <div className="mt-auto grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{itinerary.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{itinerary.duration}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span>{itinerary.participants} người tham gia</span>
            </div>
          </div>
          
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Xem chi tiết
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          onDelete(itinerary.id);
          setIsDeleteDialogOpen(false);
        }}
        title={itinerary.title}
      />
    </>
  );
}
