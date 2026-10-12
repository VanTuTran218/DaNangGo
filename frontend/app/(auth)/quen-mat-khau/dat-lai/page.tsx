'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PasswordField from '@/components/auth/PasswordField';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { resetPassword } from '@/lib/api/auth';

function ResetForm() {
  const params = useSearchParams(); const router = useRouter();
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setLoading(true); const result = await resetPassword(params.get('token') || '', password, confirm); setLoading(false);
    if (result.success) router.replace('/dang-nhap'); else setError(result.error || 'Không thể đặt lại mật khẩu.');
  }
  return <div className="min-h-screen flex items-center justify-center py-8 px-4 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30"><section className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-12"><Link href="/dang-nhap" className="text-sm text-teal-600 hover:text-teal-700 font-medium">← Quay lại đăng nhập</Link><h1 className="text-2xl font-bold text-gray-900 mt-8 mb-6">Đặt lại mật khẩu</h1><form onSubmit={submit} className="flex flex-col gap-5"><div><PasswordField id="new-password" name="newPassword" label="Mật khẩu mới" value={password} onChange={e => setPassword(e.target.value)} required /><PasswordStrength password={password} /></div><PasswordField id="confirm-password" name="confirmPassword" label="Xác nhận mật khẩu mới" value={confirm} onChange={e => setConfirm(e.target.value)} required />{error && <p role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</p>}<button disabled={loading || !params.get('token')} className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors duration-200 shadow-lg shadow-orange-500/30 disabled:opacity-70">{loading ? 'ĐANG LƯU…' : 'ĐẶT LẠI MẬT KHẨU'}</button></form></section></div>;
}

export default function ResetPasswordPage() { return <Suspense fallback={<div className="min-h-screen bg-slate-50" />}><ResetForm /></Suspense>; }
