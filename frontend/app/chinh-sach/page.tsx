import Link from 'next/link';

export const metadata = {
  title: 'Chính sách bảo mật | DaNangGo',
  description: 'Chính sách bảo mật thông tin người dùng của DaNangGo — Cẩm nang du lịch số Đà Nẵng',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dang-nhap" className="text-sm text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-1 mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Chính sách bảo mật</h1>
          </div>
          <p className="text-sm text-gray-500">Cập nhật lần cuối: tháng 10 năm 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Thông tin chúng tôi thu thập</h2>
            <p className="mb-2">Khi bạn sử dụng DaNangGo, chúng tôi có thể thu thập:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><strong>Thông tin tài khoản:</strong> Họ tên, địa chỉ email, số điện thoại (nếu cung cấp).</li>
              <li><strong>Thông tin sử dụng:</strong> Địa điểm bạn xem, tìm kiếm, đánh giá và lưu yêu thích.</li>
              <li><strong>Thông tin thiết bị:</strong> Loại trình duyệt, địa chỉ IP (để bảo mật và thống kê).</li>
              <li><strong>Cookie phiên:</strong> Để duy trì trạng thái đăng nhập an toàn.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Cách chúng tôi sử dụng thông tin</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Tạo và quản lý tài khoản của bạn.</li>
              <li>Gửi email xác thực, thông báo đặt lại mật khẩu và thông tin quan trọng.</li>
              <li>Cá nhân hoá trải nghiệm và gợi ý địa điểm phù hợp.</li>
              <li>Cải thiện chất lượng dịch vụ thông qua phân tích dữ liệu ẩn danh.</li>
              <li>Phát hiện và ngăn chặn gian lận, bảo vệ an toàn hệ thống.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Chia sẻ thông tin</h2>
            <p>
              DaNangGo <strong>không bán</strong> thông tin cá nhân của bạn cho bên thứ ba. Chúng tôi chỉ chia sẻ thông tin trong các trường hợp:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mt-2">
              <li>Có sự đồng ý rõ ràng của bạn.</li>
              <li>Theo yêu cầu của pháp luật Việt Nam.</li>
              <li>Với các đối tác dịch vụ (nhà hàng, khách sạn) khi bạn thực hiện đặt chỗ — chỉ chia sẻ thông tin cần thiết.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Bảo mật dữ liệu</h2>
            <p>
              Chúng tôi áp dụng các biện pháp kỹ thuật tiêu chuẩn ngành để bảo vệ thông tin của bạn:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mt-2">
              <li>Mật khẩu được mã hoá bằng bcrypt (không lưu mật khẩu gốc).</li>
              <li>Phiên đăng nhập sử dụng JWT ngắn hạn và refresh token được băm trước khi lưu.</li>
              <li>Cookie phiên có thuộc tính HttpOnly và SameSite để ngăn chặn tấn công XSS/CSRF.</li>
              <li>Kết nối được bảo vệ bằng HTTPS trên môi trường sản xuất.</li>
              <li>Giới hạn số lần đăng nhập sai để chống dò mật khẩu.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Cookie và lưu trữ cục bộ</h2>
            <p>
              DaNangGo sử dụng cookie phiên (session cookie) để duy trì trạng thái đăng nhập. Chúng tôi
              <strong> không</strong> lưu token xác thực trong localStorage. Bạn có thể xóa cookie qua
              cài đặt trình duyệt, nhưng điều này sẽ đăng xuất bạn khỏi dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Quyền của bạn</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><strong>Truy cập:</strong> Yêu cầu xem thông tin cá nhân chúng tôi đang lưu.</li>
              <li><strong>Chỉnh sửa:</strong> Cập nhật thông tin không chính xác trong hồ sơ tài khoản.</li>
              <li><strong>Xóa:</strong> Yêu cầu xóa tài khoản và dữ liệu cá nhân liên quan.</li>
              <li><strong>Phản đối:</strong> Từ chối nhận email marketing (nếu có trong tương lai).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Thay đổi chính sách</h2>
            <p>
              Chúng tôi có thể cập nhật chính sách này theo thời gian. Mọi thay đổi quan trọng sẽ được
              thông báo qua email hoặc thông báo nổi bật trên nền tảng trước khi có hiệu lực.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Liên hệ</h2>
            <p>
              Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ:{' '}
              <a href="mailto:privacy@dananggo.vn" className="text-teal-600 hover:underline font-medium">
                privacy@dananggo.vn
              </a>
            </p>
          </section>

        </div>

        <p className="text-center text-sm text-gray-400 mt-8">© {new Date().getFullYear()} DaNangGo — Đà Nẵng, Việt Nam</p>
      </div>
    </div>
  );
}
