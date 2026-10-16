import Link from 'next/link';

export const metadata = {
  title: 'Điều khoản dịch vụ | DaNangGo',
  description: 'Điều khoản sử dụng dịch vụ DaNangGo — Cẩm nang du lịch số Đà Nẵng',
};

export default function TermsPage() {
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Điều khoản dịch vụ</h1>
          </div>
          <p className="text-sm text-gray-500">Cập nhật lần cuối: tháng 10 năm 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Chấp nhận điều khoản</h2>
            <p>
              Khi đăng ký và sử dụng DaNangGo, bạn đồng ý tuân thủ các điều khoản này. Nếu bạn không đồng ý,
              vui lòng không sử dụng dịch vụ. DaNangGo có quyền thay đổi điều khoản bất kỳ lúc nào và sẽ thông báo
              qua email hoặc thông báo trên nền tảng.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Mô tả dịch vụ</h2>
            <p>
              DaNangGo là nền tảng cẩm nang du lịch số cho Đà Nẵng, cung cấp thông tin về địa điểm tham quan,
              nhà hàng, lưu trú, trải nghiệm và hoạt động giải trí. Dịch vụ bao gồm tính năng tìm kiếm, gợi ý
              lịch trình, đánh giá và kết nối với các đối tác cung cấp dịch vụ du lịch.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Tài khoản người dùng</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Bạn phải cung cấp thông tin chính xác và cập nhật khi đăng ký.</li>
              <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.</li>
              <li>Mỗi người dùng chỉ được có một tài khoản cá nhân.</li>
              <li>Tài khoản đối tác cần được quản trị viên duyệt trước khi sử dụng các tính năng đặc biệt.</li>
              <li>Nghiêm cấm đăng ký hoặc sử dụng tài khoản nhằm mục đích gian lận, phát tán thông tin sai lệch.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Quy tắc sử dụng</h2>
            <p className="mb-2">Người dùng cam kết:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Không đăng nội dung vi phạm pháp luật Việt Nam, xúc phạm, phân biệt đối xử.</li>
              <li>Không cố tình can thiệp vào hoạt động của hệ thống (tấn công, spam, scraping trái phép).</li>
              <li>Không sử dụng dịch vụ để quảng cáo sản phẩm/dịch vụ trái phép.</li>
              <li>Đánh giá và nhận xét phải trung thực, dựa trên trải nghiệm thực tế.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Nội dung người dùng</h2>
            <p>
              Bằng cách đăng nội dung (đánh giá, ảnh, bình luận), bạn cấp cho DaNangGo quyền sử dụng, hiển thị
              và phân phối nội dung đó trên nền tảng. DaNangGo có quyền xóa nội dung vi phạm mà không cần thông báo trước.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Giới hạn trách nhiệm</h2>
            <p>
              DaNangGo cung cấp thông tin du lịch với mục đích tham khảo. Chúng tôi không đảm bảo tính chính xác
              tuyệt đối của mọi thông tin và không chịu trách nhiệm về thiệt hại phát sinh từ việc sử dụng dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Chấm dứt dịch vụ</h2>
            <p>
              DaNangGo có quyền đình chỉ hoặc xóa tài khoản vi phạm điều khoản mà không cần báo trước.
              Người dùng có thể yêu cầu xóa tài khoản bằng cách liên hệ với chúng tôi qua email hỗ trợ.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Liên hệ</h2>
            <p>
              Mọi thắc mắc về điều khoản dịch vụ, vui lòng liên hệ:{' '}
              <a href="mailto:support@dananggo.vn" className="text-teal-600 hover:underline font-medium">
                support@dananggo.vn
              </a>
            </p>
          </section>

        </div>

        <p className="text-center text-sm text-gray-400 mt-8">© {new Date().getFullYear()} DaNangGo — Đà Nẵng, Việt Nam</p>
      </div>
    </div>
  );
}
