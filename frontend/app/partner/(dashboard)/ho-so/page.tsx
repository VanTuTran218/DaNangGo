'use client';

import { useState, useEffect } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerProfile, updatePartnerProfile } from '@/lib/api/partner';
import StatusBadge from '@/components/ui/StatusBadge';
import { Building2, Save, X } from 'lucide-react';

export default function PartnerProfilePage() {
  const { data: profile, loading, error, reload } = useAsyncData(getPartnerProfile);
  const [businessName, setBusinessName] = useState('');
  const [serviceType, setServiceType] = useState<'STAY' | 'TABLE' | 'TICKET'>('STAY');
  const [taxCode, setTaxCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName);
      setServiceType(profile.serviceType);
      setTaxCode(profile.taxCode);
      setAddress(profile.address);
      setPhone(profile.phone);
      setEmail(profile.email);
    }
  }, [profile]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePartnerProfile({
        businessName: businessName.trim(),
        serviceType,
        taxCode: taxCode.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      showToast('Cập nhật hồ sơ doanh nghiệp thành công.');
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Cập nhật thất bại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500 font-semibold">Đang tải hồ sơ doanh nghiệp...</div>;
  }

  if (error || !profile) {
    return (
      <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700">
        <p className="font-semibold mb-2" role="alert">{error || 'Không tải được hồ sơ.'}</p>
        <button onClick={reload} className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-xs">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ doanh nghiệp</h1>
        <p className="text-sm text-gray-500">Quản lý thông tin pháp lý và thông tin liên hệ của đối tác.</p>
      </div>

      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-teal-50 text-teal-700 border-teal-200'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{profile.businessName}</h2>
              <p className="text-xs text-gray-500">Mã đối tác: {profile.id}</p>
            </div>
          </div>
          <StatusBadge status={profile.status} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tên doanh nghiệp / Cơ sở *</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Loại dịch vụ chính</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as any)}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              >
                <option value="STAY">Khách sạn / Lưu trú (STAY)</option>
                <option value="TABLE">Nhà hàng / Ẩm thực (TABLE)</option>
                <option value="TICKET">Vé & Tour tham quan (TICKET)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mã số thuế *</label>
              <input
                type="text"
                required
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ đăng ký kinh doanh *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại liên hệ *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email đăng ký *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
