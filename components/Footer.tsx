export default function Footer() {
  return (
    <footer className="bg-[#071a2e] text-white/70 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">D</span>
              </div>
              <span className="text-white font-bold text-lg">
                <span className="text-cyan-400">Danang</span><span className="text-orange-400">Go</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/50 mb-4">
              Cẩm nang du lịch Đà Nẵng đầy đủ và cập nhật nhất — từ điểm đến, ẩm thực đến lịch trình tối ưu.
            </p>
            <div className="flex gap-3">
              {[{ l:'FB', c:'bg-blue-600' }, { l:'IG', c:'bg-pink-600' }, { l:'TT', c:'bg-gray-700' }, { l:'YT', c:'bg-red-600' }].map(s => (
                <a key={s.l} href="#" className={`w-8 h-8 ${s.c} rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-80 transition-opacity`}>{s.l}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Khám phá</h4>
            <ul className="space-y-2.5">
              {['Điểm du lịch','Ẩm thực','Lưu trú','Mua sắm','Giải trí'].map(l => (
                <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Tiện ích</h4>
            <ul className="space-y-2.5">
              {['Tạo lịch trình','Bản đồ thành phố','Thời tiết','Đặt vé online','Hỏi đáp'].map(l => (
                <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Liên hệ</h4>
            <ul className="space-y-2.5">
              <li className="text-sm">📧 hello@dananggo.vn</li>
              <li className="text-sm">📞 0236 386 5xxx</li>
              <li className="text-sm">📍 Đà Nẵng, Việt Nam</li>
            </ul>
            <div className="mt-4 space-y-1.5">
              {['Về chúng tôi','Tuyển dụng','Báo chí'].map(l => (
                <a key={l} href="#" className="block text-sm hover:text-white transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© 2025 DanangGo. Made with ❤️ in Đà Nẵng, Việt Nam.</p>
          <div className="flex gap-4">
            {['Điều khoản sử dụng','Chính sách bảo mật'].map(s => (
              <a key={s} href="#" className="hover:text-white/70 transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
