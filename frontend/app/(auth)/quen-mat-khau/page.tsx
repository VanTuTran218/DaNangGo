'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(''); setMessage('');
    const result = await forgotPassword(email.trim());
    if (result.success) setMessage(result.message || 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.');
    else setError(result.error || 'Không thể gửi yêu cầu.');
    setLoading(false);
  }
  return <div className="min-h-screen flex items-center justify-center py-8 px-4 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30"><section className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-12"><Link href="/dang-nhap" className="text-sm text-teal-600 hover:text-teal-700 font-medium">← Quay lại đăng nhập</Link><h1 className="text-2xl font-bold text-gray-900 mt-8">Quên mật khẩu?</h1><p className="text-sm text-gray-600 mt-2 mb-6">Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.</p><form onSubmit={submit} className="flex flex-col gap-5"><div className="flex flex-col gap-1.5"><label htmlFor="email" className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label><input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow duration-200" /></div>{message && <p role="status" className="p-3 bg-teal-50 border border-teal-100 rounded-lg text-sm text-teal-800">{message}</p>}{error && <p role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</p>}<button disabled={loading} className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors duration-200 shadow-lg shadow-orange-500/30 disabled:opacity-70">{loading ? 'ĐANG GỬI…' : 'GỬI HƯỚNG DẪN'}</button></form></section></div>;
}
