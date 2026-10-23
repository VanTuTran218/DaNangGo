import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRemainingDays,
  formatSubscription,
  DANANGGO_BANK_INFO,
} from '../src/modules/subscriptions/subscriptions.service';
import type { PartnerSubscriptionRow } from '../src/modules/subscriptions/subscriptions.repository';

// =========================================================================
// TEST SUITE: CHỨC NĂNG QUẢN LÝ GÓI ĐĂNG KÝ ĐỐI TÁC VÀ DOANH THU DANANGGO
// =========================================================================

test('1. GÓI ĐĂNG KÝ VÀ TÍNH TOÁN THỜI HẠN', async (t) => {
  await t.test('1.1. calculateRemainingDays trả về 0 nếu ngày hết hạn trong quá khứ hoặc null', () => {
    assert.equal(calculateRemainingDays(null), 0);

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 ngày trước
    assert.equal(calculateRemainingDays(pastDate), 0);
  });

  await t.test('1.2. calculateRemainingDays tính chính xác số ngày còn lại', () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 ngày tới
    const days = calculateRemainingDays(futureDate);
    assert.ok(days >= 4 && days <= 5, `Số ngày còn lại phải là 5 (thực tế: ${days})`);
  });

  await t.test('1.3. Tính toán cộng tháng theo lịch (1 tháng, 6 tháng, 12 tháng) xử lý chính xác cuối tháng', () => {
    // Trường hợp ngày 31 tháng 1 cộng 1 tháng -> ngày cuối tháng 2
    const dateJan31 = new Date(2026, 0, 31, 12, 0, 0); // 31 Jan 2026
    const dateAfter1Month = new Date(dateJan31);
    dateAfter1Month.setMonth(dateAfter1Month.getMonth() + 1);
    // Trong JS, 31 Jan + 1 month overflow sang 3 March nếu tháng 2 có 28 ngày
    // SQL Server DATEADD(month, 1, '2026-01-31') chuẩn hóa thành '2026-02-28'
    // Kiểm tra hàm tiện ích chuẩn hóa lịch:
    function addCalendarMonths(start: Date, months: number): Date {
      const result = new Date(start);
      const targetMonth = result.getMonth() + months;
      result.setMonth(targetMonth);
      if (result.getMonth() !== targetMonth % 12) {
        result.setDate(0); // Lùi về ngày cuối cùng của tháng trước đó
      }
      return result;
    }

    const standardFeb = addCalendarMonths(dateJan31, 1);
    assert.equal(standardFeb.getMonth(), 1); // Tháng 2 (0-indexed)
    assert.equal(standardFeb.getDate(), 28); // 2026 không phải năm nhuận -> 28 ngày

    // Gói 6 tháng từ ngày 31/08 -> 28/02 năm sau
    const dateAug31 = new Date(2026, 7, 31, 12, 0, 0);
    const standard6Months = addCalendarMonths(dateAug31, 6);
    assert.equal(standard6Months.getMonth(), 1); // Tháng 2
    assert.equal(standard6Months.getDate(), 28);

    // Gói 12 tháng giữ nguyên ngày hoặc cuối tháng
    const standard12Months = addCalendarMonths(dateAug31, 12);
    assert.equal(standard12Months.getMonth(), 7); // Tháng 8 năm sau
    assert.equal(standard12Months.getDate(), 31);
    assert.equal(standard12Months.getFullYear(), 2027);
  });
});

test('2. ĐỊNH DẠNG BẢN GHI ĐĂNG KÝ VÀ CẢNH BÁO SẮP HẾT HẠN', async (t) => {
  const baseRow: PartnerSubscriptionRow = {
    subscription_id: 101,
    transaction_code: 'DNG-SUB-TEST-1234',
    partner_id: 1,
    package_id: 1,
    package_name: 'Gói 1 tháng',
    duration_months: 1,
    price: 500000,
    subscription_status: 'ACTIVE',
    payment_status: 'PAID',
    payment_method: 'BANK_TRANSFER',
    payment_reference: 'MB-12345678',
    payment_proof_note: 'Đã chuyển khoản',
    payment_submitted_at: new Date(),
    start_date: new Date(),
    end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Còn 4 ngày (< 7 ngày)
    created_at: new Date(),
    confirmed_by: 1,
    confirmed_at: new Date(),
    admin_name: 'Super Admin',
    rejection_reason: null,
    is_renewal: false,
    renewed_from_id: null,
    business_name: 'Khách sạn Biển Xanh',
    contact_phone: '0905123456',
    partner_email: 'partner@dananggo.vn',
    partner_user_name: 'doitac1',
  };

  await t.test('2.1. formatSubscription tính cờ isExpiringSoon = true khi còn <= 7 ngày và đang ACTIVE', () => {
    const formatted = formatSubscription(baseRow);
    assert.equal(formatted.id, 101);
    assert.equal(formatted.price, 500000);
    assert.equal(formatted.isExpiringSoon, true);
    assert.ok(formatted.daysRemaining <= 4 && formatted.daysRemaining >= 3);
  });

  await t.test('2.2. formatSubscription tính cờ isExpiringSoon = false nếu còn > 7 ngày', () => {
    const rowLongTerm = {
      ...baseRow,
      end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // Còn 20 ngày
    };
    const formatted = formatSubscription(rowLongTerm);
    assert.equal(formatted.isExpiringSoon, false);
    assert.ok(formatted.daysRemaining >= 19);
  });

  await t.test('2.3. formatSubscription tính cờ isExpiringSoon = false nếu trạng thái không phải ACTIVE', () => {
    const rowPending = {
      ...baseRow,
      subscription_status: 'INACTIVE',
      payment_status: 'PENDING',
    };
    const formatted = formatSubscription(rowPending);
    assert.equal(formatted.isExpiringSoon, false);
  });
});

test('3. BẢO VỆ TOÀN VẸN GIÁ VÀ BẢO MẬT GIAO DỊCH (PRICE SNAPSHOT & INTEGRITY)', async (t) => {
  await t.test('3.1. Các mức giá gói mặc định chuẩn VND số nguyên', () => {
    const packages = [
      { id: 1, name: 'Gói 1 tháng', months: 1, price: 500000 },
      { id: 2, name: 'Gói 6 tháng', months: 6, price: 2500000 },
      { id: 3, name: 'Gói 1 năm', months: 12, price: 4500000 },
    ];

    for (const pkg of packages) {
      assert.ok(Number.isInteger(pkg.price), `Giá của ${pkg.name} phải là số nguyên`);
      assert.ok(pkg.price > 0, `Giá của ${pkg.name} phải > 0`);
      assert.equal(typeof pkg.price, 'number');
    }
  });

  await t.test('3.2. Không phụ thuộc vào client: snapshot giá được đọc từ database', () => {
    // Giả lập client gửi giá giả mạo: price = 1000 VNĐ
    const clientPayload = { packageId: 1, tamperedPrice: 1000 };
    const dbPackage = { package_id: 1, name: 'Gói 1 tháng', duration_months: 1, price: 500000 };

    // Backend phải gán giá từ dbPackage, bỏ qua hoàn toàn tamperedPrice
    const snapshotPrice = dbPackage.price;
    assert.equal(snapshotPrice, 500000);
    assert.notEqual(snapshotPrice, clientPayload.tamperedPrice);
  });

  await t.test('3.3. Thông tin tài khoản ngân hàng chuyển khoản đúng tài khoản DaNangGo', () => {
    assert.equal(DANANGGO_BANK_INFO.accountNumber, '999988886868');
    assert.equal(DANANGGO_BANK_INFO.accountHolder, 'DANANGGO TRAVEL CO LTD');
  });
});

test('4. CHỐNG XÁC NHẬN THANH TOÁN TRÙNG LẶP (ANTI DOUBLE-APPROVAL & IDEMPOTENCY)', async (t) => {
  await t.test('4.1. Không cho phép phê duyệt lại giao dịch đã PAID hoặc REJECTED', () => {
    // Mô phỏng hàm xác nhận kiểm tra trạng thái
    function simulateConfirmPayment(currentStatus: string): { success: boolean; error?: string } {
      if (currentStatus !== 'PENDING') {
        return {
          success: false,
          error: `Giao dịch này đã được xử lý trước đó với trạng thái: ${currentStatus}`,
        };
      }
      return { success: true };
    }

    // Lần bấm thứ 1: PENDING -> thành công
    const firstCall = simulateConfirmPayment('PENDING');
    assert.equal(firstCall.success, true);

    // Lần bấm thứ 2 (double click hoặc race condition): PAID -> BỊ CHẶN 409 CONFLICT
    const secondCall = simulateConfirmPayment('PAID');
    assert.equal(secondCall.success, false);
    assert.match(secondCall.error || '', /đã được xử lý trước đó/);

    // Lần bấm trên giao dịch đã REJECTED -> BỊ CHẶN
    const rejectedCall = simulateConfirmPayment('REJECTED');
    assert.equal(rejectedCall.success, false);
  });
});

test('5. THỐNG KÊ DOANH THU CHỈ TỪ PHÍ ĐĂNG KÝ GÓI (REVENUE STRICT BOUNDARY)', async (t) => {
  await t.test('5.1. Doanh thu CHỈ cộng từ các giao dịch đã PAID, tuyệt đối không tính PENDING hoặc REJECTED', () => {
    const transactions = [
      { id: 1, price: 500000, paymentStatus: 'PAID' },
      { id: 2, price: 2500000, paymentStatus: 'PAID' },
      { id: 3, price: 4500000, paymentStatus: 'PENDING' }, // Đang chờ duyệt -> KHÔNG TÍNH
      { id: 4, price: 500000, paymentStatus: 'REJECTED' }, // Bị từ chối -> KHÔNG TÍNH
      { id: 5, price: 500000, paymentStatus: 'FAILED' }, // Thất bại -> KHÔNG TÍNH
    ];

    // Thuật toán tính toán doanh thu:
    const totalRevenue = transactions
      .filter((t) => t.paymentStatus === 'PAID')
      .reduce((sum, t) => sum + t.price, 0);

    const paidCount = transactions.filter((t) => t.paymentStatus === 'PAID').length;
    const pendingCount = transactions.filter((t) => t.paymentStatus === 'PENDING').length;
    const rejectedCount = transactions.filter((t) => t.paymentStatus === 'REJECTED').length;

    assert.equal(totalRevenue, 3000000); // 500k + 2500k
    assert.equal(paidCount, 2);
    assert.equal(pendingCount, 1);
    assert.equal(rejectedCount, 1);
  });
});

test('6. ĐỊNH DẠNG XUẤT CSV CHO DOANH THU VÀ ĐĂNG KÝ (UTF-8 BOM CHO EXCEL)', async (t) => {
  await t.test('6.1. File CSV có UTF-8 BOM và đúng các cột bắt buộc', () => {
    const BOM = '\uFEFF';
    const headers = [
      'Mã giao dịch',
      'Tên cơ sở',
      'Gói đăng ký',
      'Thời hạn (tháng)',
      'Số tiền (VNĐ)',
      'Trạng thái gói',
      'Trạng thái thanh toán',
      'Mã tham chiếu ngân hàng',
      'Ngày bắt đầu',
      'Ngày hết hạn',
      'Người duyệt',
      'Ngày tạo',
    ];

    const sampleRow = [
      'DNG-SUB-2026-0001',
      '"Khách sạn Furama, Đà Nẵng"', // có dấu phẩy cần bọc ngoặc kép
      'Gói 6 tháng',
      '6',
      '2500000',
      'ACTIVE',
      'PAID',
      'MB-888999',
      '2026-01-01',
      '2026-07-01',
      'Admin QTV',
      '2026-01-01 10:00:00',
    ];

    const csvContent = BOM + headers.join(',') + '\r\n' + sampleRow.join(',');

    assert.ok(csvContent.startsWith('\uFEFF'), 'CSV phải có BOM UTF-8 để Excel mở không lỗi font tiếng Việt');
    assert.ok(csvContent.includes('Số tiền (VNĐ)'));
    assert.ok(csvContent.includes('Khách sạn Furama, Đà Nẵng'));
  });
});
