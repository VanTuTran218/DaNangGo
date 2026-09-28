"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";

export default function AvatarUploader({ user, tierInfo, isVip }: { user: User, tierInfo: any, isVip: boolean }) {
  const { updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /*
   * ============================================================================
   * SERVER-SIDE REQUIREMENTS FOR AVATAR UPLOAD (As requested)
   * ============================================================================
   * 1. File Type Sniffing: Do not rely solely on the file extension or Content-Type header.
   *    Read the first few bytes (magic numbers) of the buffer to determine the actual
   *    MIME type (e.g. using `file-type` package).
   * 2. Size Limits: Enforce a strict max file size (e.g. 5MB) early in the request stream 
   *    to prevent payload-based DoS.
   * 3. Image Processing: Use a library like `sharp` to resize the image to a standard 
   *    dimension (e.g. 512x512) and convert it to modern formats like WebP or AVIF.
   * 4. Metadata Stripping: Strip all EXIF data (location, camera info) to protect user privacy.
   * 5. Storage: Save the processed image to a CDN (e.g. AWS S3, Cloudflare R2) and return 
   *    the CDN URL to update the user record.
   * ============================================================================
   */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    setIsOpen(false);
    
    // Mock upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock save logic
    updateUser({ avatarUrl: selectedImage || "https://i.pravatar.cc/300" });
    setIsUploading(false);
    setSelectedImage(null);
    
    // Mock Toast
    alert("Cập nhật ảnh đại diện thành công!");
  };

  const handleDelete = async () => {
    setIsUploading(true);
    setIsOpen(false);
    await new Promise(resolve => setTimeout(resolve, 500));
    updateUser({ avatarUrl: undefined });
    setIsUploading(false);
  };

  return (
    <>
      <div className="relative group">
        <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/20 shadow-lg flex-shrink-0 ${isUploading ? 'opacity-50' : ''}`}>
          {isUploading && (
            <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin z-20"></div>
          )}
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.name} fill className="rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-4xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          {isVip && (
            <span className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-white shadow-sm bg-${tierInfo.color}-400 flex items-center justify-center`}>
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </span>
          )}

          <button 
            onClick={() => setIsOpen(true)}
            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60" onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden z-10 p-6 text-gray-800"
            >
              <h3 className="text-xl font-bold mb-4 text-center">Cập nhật ảnh đại diện</h3>
              
              {!selectedImage ? (
                <div className="flex flex-col gap-3">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors">
                    Tải ảnh lên
                  </button>
                  {user.avatarUrl && (
                    <button onClick={handleDelete} className="w-full py-3 border border-red-200 text-red-500 hover:bg-red-50 font-medium rounded-xl transition-colors">
                      Xóa ảnh hiện tại
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors">
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  {/* Mock Crop UI */}
                  <div className="relative w-64 h-64 bg-gray-100 rounded-full overflow-hidden border-4 border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedImage} alt="Crop preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
                    <div className="absolute inset-4 rounded-full border-2 border-dashed border-white pointer-events-none"></div>
                  </div>
                  
                  <div className="w-full px-4">
                    <input type="range" className="w-full accent-teal-500" min="1" max="3" step="0.1" defaultValue="1" />
                  </div>

                  <div className="flex w-full gap-3">
                    <button onClick={() => setSelectedImage(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50">
                      Chọn lại
                    </button>
                    <button onClick={handleSave} className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600">
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
