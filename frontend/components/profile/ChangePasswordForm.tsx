"use client";

import { useState } from "react";
import { changePassword } from "@/lib/api/auth";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const calculateStrength = (password: string) => {
    let strength = 0;
    if (password.length > 7) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 25;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return "bg-gray-200";
    if (strength <= 25) return "bg-red-400";
    if (strength <= 50) return "bg-orange-400";
    if (strength <= 75) return "bg-yellow-400";
    return "bg-teal-500";
  };

  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return "";
    if (strength <= 25) return "Yếu";
    if (strength <= 50) return "Trung bình";
    if (strength <= 75) return "Khá";
    return "Mạnh";
  };

  const strength = calculateStrength(newPassword);
  
  const isDirty = currentPassword && newPassword && confirmPassword;
  const isMatch = newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    setIsSaving(true);
    setError("");
    const result = await changePassword(currentPassword, newPassword, confirmPassword);
    setIsSaving(false);
    if (!result.success) { setError(result.error || "Không thể đổi mật khẩu."); return; }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    alert(result.message || "Đổi mật khẩu thành công!");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
      <h3 className="font-bold text-gray-800 text-lg mb-6">Đổi mật khẩu</h3>
      
      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
          <input 
            type="password" 
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Mật khẩu mới</label>
          <input 
            type="password" 
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
          />
          {newPassword && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex gap-1 h-1.5">
                {[25, 50, 75, 100].map(threshold => (
                  <div 
                    key={threshold} 
                    className={`flex-1 rounded-full transition-colors ${strength >= threshold ? getStrengthColor(strength) : "bg-gray-200"}`}
                  />
                ))}
              </div>
              <span className={`text-xs font-medium text-${getStrengthColor(strength).replace('bg-', '')}`}>
                {getStrengthLabel(strength)}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
          <input 
            type="password" 
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors ${
              confirmPassword && !isMatch 
                ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
            }`}
          />
          {confirmPassword && !isMatch && (
            <p className="text-xs text-red-500">Mật khẩu xác nhận không khớp.</p>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={!isDirty || !isMatch || isSaving}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Cập nhật mật khẩu
          </button>
        </div>
      </form>
    </div>
  );
}
