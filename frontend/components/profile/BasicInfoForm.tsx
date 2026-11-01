"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateMyProfile } from "@/lib/api/me";
import type { User } from "@/types/user";

export default function BasicInfoForm({ user }: { user: User }) {
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    birthday: user.birthday || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
      birthday: user.birthday || "",
    });
  }, [user.name, user.phone, user.birthday]);

  const isDirty = formData.name !== (user.name || "") ||
    formData.phone !== (user.phone || "") ||
    formData.birthday !== (user.birthday || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSaved(false);
    try {
      const updatedUser = await updateMyProfile({
        name: formData.name,
        phone: formData.phone.trim() || null,
        birthday: formData.birthday || null,
      });
      updateUser({
        name: updatedUser.name,
        phone: updatedUser.phone,
        birthday: updatedUser.birthday,
      });
      setFormData({
        name: updatedUser.name,
        phone: updatedUser.phone || "",
        birthday: updatedUser.birthday || "",
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật hồ sơ.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
      <h3 className="font-bold text-gray-800 text-lg mb-6">Thông tin cá nhân</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {saved && <p role="status" className="text-sm text-teal-700">Đã lưu thông tin vào tài khoản.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="text-sm font-medium text-gray-700">Họ và tên</label>
            <input id="profile-name" type="text" required minLength={2} maxLength={50} value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profile-phone" className="text-sm font-medium text-gray-700">Số điện thoại</label>
            <input id="profile-phone" type="tel" maxLength={30} value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profile-email" className="text-sm font-medium text-gray-700">Email</label>
            <input id="profile-email" type="email" value={user.email} readOnly
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed" />
            <p className="text-xs text-gray-400">Email không thể thay đổi</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profile-birthday" className="text-sm font-medium text-gray-700">Ngày sinh</label>
            <input id="profile-birthday" type="date" value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors" />
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="submit" disabled={!isDirty || isSaving}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
