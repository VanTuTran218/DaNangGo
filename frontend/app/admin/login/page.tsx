'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordField from '@/components/auth/PasswordField';
import { adminLogin } from '@/lib/api/auth';

export default function AdminLoginPage() {
  const router = useRouter(); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); const result = await adminLogin(email.trim(), password); setLoading(false); if (result.success) router.replace('/admin'); else setError(result.error || 'Đăng nhập thất bại.'); }
  return <div className="min-h-screen flex items-center justify-center py-8 px-4 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30"><section className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-12"><h1 className="text-2xl font-bold text-gray-900 mb-2">Đăng nhập quản trị</h1><p className="text-sm text-gray-600 mb-6">Chỉ dành cho tài khoản quản trị viên.</p><form onSubmit={submit} className="flex flex-col gap-5"><div className="flex flex-col gap-1.5"><label htmlFor="admin-email" className="text-sm font-medium text-gray-700">Email</label><input id="admin-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow duration-200" /></div><PasswordField id="admin-password" name="password" label="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required />{error && <p role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</p>}<button disabled={loading} className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors duration-200 shadow-lg shadow-orange-500/30 disabled:opacity-70">{loading ? 'ĐANG ĐĂNG NHẬP…' : 'ĐĂNG NHẬP'}</button></form></section></div>;
}
