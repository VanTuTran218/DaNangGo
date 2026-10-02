export const TIER_CONFIG = {
  None: {
    name: 'Thường',
    label: 'MEMBER',
    color: 'slate',
    gradient: 'from-slate-700 to-slate-900',
    minPoints: 0,
    benefits: [],
  },
  Silver: {
    name: 'Bạc',
    label: 'SILVER EXPLORER',
    color: 'slate',
    gradient: 'from-slate-300 to-slate-500',
    minPoints: 0,
    benefits: [
      'Ưu đãi lên đến 10% khi đặt phòng',
      'Tích điểm cơ bản cho mỗi chuyến đi',
      'Nhận thông báo ưu đãi sớm',
    ],
  },
  Gold: {
    name: 'Vàng',
    label: 'GOLD EXPLORER',
    color: 'yellow',
    gradient: 'from-yellow-400 to-orange-500',
    minPoints: 1000,
    benefits: [
      'Ưu đãi lên đến 15% khi đặt phòng',
      'Tích điểm x1.5 cho mỗi chuyến đi',
      'Hỗ trợ khách hàng ưu tiên 24/7',
      'Voucher đặc biệt vào dịp sinh nhật',
    ],
  },
  Diamond: {
    name: 'Kim Cương',
    label: 'DIAMOND EXPLORER',
    color: 'blue',
    gradient: 'from-cyan-400 to-blue-600',
    minPoints: 5000,
    benefits: [
      'Ưu đãi lên đến 25% khi đặt phòng',
      'Tích điểm x2 cho mỗi chuyến đi',
      'Chuyên viên hỗ trợ cá nhân riêng',
      'Quyền truy cập các sự kiện VIP độc quyền',
      'Miễn phí hủy phòng (áp dụng một số đối tác)',
    ],
  },
};
