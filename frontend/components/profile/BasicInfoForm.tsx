"use client";

import { useState } from "react";
import { User } from "@/types/user";

export default function BasicInfoForm({ user }: { user: User }) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    email: user.email || "",
    birthday: user.birthday || "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const isDirty = 
    formData.name !== (user.name || "") ||
    formData.phone !== (user.phone || "") ||
    formData.email !== (user.email || "") ||
    formData.birthday !== (user.birthday || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Mock save delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    alert("Cập nhật thông tin thành công!");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
      <h3 className="font-bold text-gray-800 text-lg mb-6">Thông tin cá nhân</h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Họ và tên</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              value={formData.email}
              readOnly
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed"
            />
            <p className="text-xs text-gray-400">Email không thể thay đổi</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Ngày sinh</label>
            <input 
              type="date" 
              value={formData.birthday}
              onChange={e => setFormData({ ...formData, birthday: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}
