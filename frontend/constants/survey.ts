/**
 * DaNangGo — Cấu hình câu hỏi và danh mục khảo sát du khách
 * Phục vụ thống kê cho Quản trị viên và Sở Du lịch Đà Nẵng.
 */

export interface ProvinceOption {
  value: string;
  label: string;
  region: 'Bắc' | 'Trung' | 'Nam' | 'Quốc tế';
}

export const VIETNAM_PROVINCES: ProvinceOption[] = [
  // Khách quốc tế
  { value: 'QUOC_TE', label: 'Khách quốc tế (International Tourist)', region: 'Quốc tế' },

  // Miền Trung (Ưu tiên hiển thị gần Đà Nẵng)
  { value: 'DA_NANG', label: 'Đà Nẵng', region: 'Trung' },
  { value: 'QUANG_NAM', label: 'Quảng Nam', region: 'Trung' },
  { value: 'THUA_THIEN_HUE', label: 'Thừa Thiên Huế', region: 'Trung' },
  { value: 'QUANG_NGAI', label: 'Quảng Ngãi', region: 'Trung' },
  { value: 'BINH_DINH', label: 'Bình Định', region: 'Trung' },
  { value: 'KHANH_HOA', label: 'Khánh Hòa', region: 'Trung' },
  { value: 'QUANG_TRI', label: 'Quảng Trị', region: 'Trung' },
  { value: 'QUANG_BINH', label: 'Quảng Bình', region: 'Trung' },
  { value: 'HA_TINH', label: 'Hà Tĩnh', region: 'Trung' },
  { value: 'NGHE_AN', label: 'Nghệ An', region: 'Trung' },
  { value: 'THANH_HOA', label: 'Thanh Hóa', region: 'Trung' },
  { value: 'PHU_YEN', label: 'Phú Yên', region: 'Trung' },
  { value: 'NINH_THUAN', label: 'Ninh Thuận', region: 'Trung' },
  { value: 'BINH_THUAN', label: 'Bình Thuận', region: 'Trung' },
  { value: 'KON_TUM', label: 'Kon Tum', region: 'Trung' },
  { value: 'GIA_LAI', label: 'Gia Lai', region: 'Trung' },
  { value: 'DAK_LAK', label: 'Đắk Lắk', region: 'Trung' },
  { value: 'DAK_NONG', label: 'Đắk Nông', region: 'Trung' },
  { value: 'LAM_DONG', label: 'Lâm Đồng', region: 'Trung' },

  // Miền Bắc
  { value: 'HA_NOI', label: 'Hà Nội', region: 'Bắc' },
  { value: 'HAI_PHONG', label: 'Hải Phòng', region: 'Bắc' },
  { value: 'QUANG_NINH', label: 'Quảng Ninh', region: 'Bắc' },
  { value: 'BAC_NINH', label: 'Bắc Ninh', region: 'Bắc' },
  { value: 'HAI_DUONG', label: 'Hải Dương', region: 'Bắc' },
  { value: 'HUNG_YEN', label: 'Hưng Yên', region: 'Bắc' },
  { value: 'NAM_DINH', label: 'Nam Định', region: 'Bắc' },
  { value: 'NINH_BINH', label: 'Ninh Bình', region: 'Bắc' },
  { value: 'THAI_BINH', label: 'Thái Bình', region: 'Bắc' },
  { value: 'VINH_PHUC', label: 'Vĩnh Phúc', region: 'Bắc' },
  { value: 'HA_NAM', label: 'Hà Nam', region: 'Bắc' },
  { value: 'BAC_GIANG', label: 'Bắc Giang', region: 'Bắc' },
  { value: 'PHU_THO', label: 'Phú Thọ', region: 'Bắc' },
  { value: 'THAI_NGUYEN', label: 'Thái Nguyên', region: 'Bắc' },
  { value: 'LANG_SON', label: 'Lạng Sơn', region: 'Bắc' },
  { value: 'LAO_CAI', label: 'Lào Cai', region: 'Bắc' },
  { value: 'YEN_BAI', label: 'Yên Bái', region: 'Bắc' },
  { value: 'TUYEN_QUANG', label: 'Tuyên Quang', region: 'Bắc' },
  { value: 'HA_GIANG', label: 'Hà Giang', region: 'Bắc' },
  { value: 'CAO_BANG', label: 'Cao Bằng', region: 'Bắc' },
  { value: 'BAC_KAN', label: 'Bắc Kạn', region: 'Bắc' },
  { value: 'HOA_BINH', label: 'Hòa Bình', region: 'Bắc' },
  { value: 'SON_LA', label: 'Sơn La', region: 'Bắc' },
  { value: 'DIEN_BIEN', label: 'Điện Biên', region: 'Bắc' },
  { value: 'LAI_CHAU', label: 'Lai Châu', region: 'Bắc' },

  // Miền Nam
  { value: 'TP_HCM', label: 'TP. Hồ Chí Minh', region: 'Nam' },
  { value: 'CAN_THO', label: 'Cần Thơ', region: 'Nam' },
  { value: 'BINH_DUONG', label: 'Bình Dương', region: 'Nam' },
  { value: 'DONG_NAI', label: 'Đồng Nai', region: 'Nam' },
  { value: 'BA_RIA_VUNG_TAU', label: 'Bà Rịa - Vũng Tàu', region: 'Nam' },
  { value: 'LONG_AN', label: 'Long An', region: 'Nam' },
  { value: 'TIEN_GIANG', label: 'Tiền Giang', region: 'Nam' },
  { value: 'BEN_TRE', label: 'Bến Tre', region: 'Nam' },
  { value: 'TRA_VINH', label: 'Trà Vinh', region: 'Nam' },
  { value: 'VINH_LONG', label: 'Vĩnh Long', region: 'Nam' },
  { value: 'DONG_THAP', label: 'Đồng Tháp', region: 'Nam' },
  { value: 'AN_GIANG', label: 'An Giang', region: 'Nam' },
  { value: 'KIEN_GIANG', label: 'Kiên Giang', region: 'Nam' },
  { value: 'HAU_GIANG', label: 'Hậu Giang', region: 'Nam' },
  { value: 'SOC_TRANG', label: 'Sóc Trăng', region: 'Nam' },
  { value: 'BAC_LIEU', label: 'Bạc Liêu', region: 'Nam' },
  { value: 'CA_MAU', label: 'Cà Mau', region: 'Nam' },
  { value: 'TAY_NINH', label: 'Tây Ninh', region: 'Nam' },
  { value: 'BINH_PHUOC', label: 'Bình Phước', region: 'Nam' },
];

export interface ChoiceOption {
  id: string;
  label: string;
  desc?: string;
  icon?: string;
}

export const TRIP_PURPOSE_OPTIONS: ChoiceOption[] = [
  { id: 'leisure', label: 'Nghỉ dưỡng & Thư giãn', desc: 'Tắm biển, nghỉ ngơi, tái tạo năng lượng', icon: '🌴' },
  { id: 'food_culture', label: 'Khám phá ẩm thực & Văn hóa', desc: 'Thưởng thức món ngon, di sản, danh thắng', icon: '🍜' },
  { id: 'business', label: 'Công tác & Hội nghị', desc: 'Gặp gỡ đối tác, sự kiện doanh nghiệp', icon: '💼' },
  { id: 'visiting', label: 'Thăm người thân & Bạn bè', desc: 'Gặp gỡ gia đình, người thân tại địa phương', icon: '👨‍👩‍👧' },
  { id: 'backpacking', label: 'Phượt & Trải nghiệm', desc: 'Khám phá cung đường, trải nghiệm tự do', icon: '🎒' },
  { id: 'other', label: 'Mục đích khác', desc: 'Sự kiện, đám cưới, thể thao...', icon: '✨' },
];

export const DURATION_OPTIONS: ChoiceOption[] = [
  { id: '1-2', label: '1 - 2 ngày', desc: 'Chuyến đi ngắn / cuối tuần' },
  { id: '3-4', label: '3 - 4 ngày', desc: 'Khoảng thời gian phổ biến nhất' },
  { id: '5-7', label: '5 - 7 ngày', desc: 'Kỳ nghỉ dài trọn vẹn' },
  { id: 'gt-7', label: 'Trên 7 ngày', desc: 'Lưu trú dài hạn / du mục số' },
];

export const TRAVEL_COMPANION_OPTIONS: ChoiceOption[] = [
  { id: 'solo', label: 'Một mình', desc: 'Tự do trải nghiệm', icon: '👤' },
  { id: 'couple', label: 'Cặp đôi / Bạn đời', desc: 'Chuyến đi lãng mạn', icon: '👩‍❤️‍👨' },
  { id: 'family', label: 'Gia đình', desc: 'Có trẻ nhỏ hoặc người lớn tuổi', icon: '👨‍👩‍👦' },
  { id: 'friends', label: 'Nhóm bạn / Đồng nghiệp', desc: 'Đi theo nhóm đông vui', icon: '👥' },
];

export const VISIT_FREQUENCY_OPTIONS: ChoiceOption[] = [
  { id: 'first_time', label: 'Lần đầu tiên', desc: 'Lần đầu đặt chân tới Đà Nẵng' },
  { id: 'returned_2_3', label: 'Đã đến 2 – 3 lần', desc: 'Rất yêu thích và đã quay lại' },
  { id: 'loyal', label: 'Du khách thân thiết (> 3 lần)', desc: 'Xem Đà Nẵng như điểm đến quen thuộc' },
];

export const INFORMATION_CHANNELS: ChoiceOption[] = [
  { id: 'social_media', label: 'Mạng xã hội (Facebook, TikTok, Instagram)' },
  { id: 'friends_family', label: 'Bạn bè, người thân giới thiệu' },
  { id: 'dananggo', label: 'Ứng dụng / Website DaNangGo' },
  { id: 'travel_news', label: 'Báo chí, truyền hình, blog du lịch' },
  { id: 'travel_agency', label: 'Công ty lữ hành, đại lý tour' },
  { id: 'search_engine', label: 'Tìm kiếm Google / Bản đồ' },
  { id: 'other', label: 'Kênh khác' },
];

export const EXPENSE_CATEGORIES: ChoiceOption[] = [
  { id: 'stay', label: 'Khách sạn / Resort lưu trú', icon: '🏨' },
  { id: 'food', label: 'Ẩm thực & Quán ăn địa phương', icon: '🍜' },
  { id: 'attractions', label: 'Vé tham quan & Vui chơi', icon: '🎟️' },
  { id: 'shopping', label: 'Mua sắm quà đặc sản', icon: '🛍️' },
  { id: 'transport', label: 'Di chuyển nội thành (Taxi/Thuê xe)', icon: '🚕' },
  { id: 'tours', label: 'Tour trọn gói / Hướng dẫn viên', icon: '🧭' },
];

export interface ExperienceCategory {
  id: string;
  label: string;
  desc: string;
  iconName: string;
}

export const EXPERIENCE_CATEGORIES: ExperienceCategory[] = [
  { id: 'accommodation', label: 'Cơ sở lưu trú', desc: 'Tiện nghi, vệ sinh phòng, chất lượng dịch vụ khách sạn/homestay', iconName: 'Hotel' },
  { id: 'food', label: 'Ẩm thực & Nhà hàng', desc: 'Hương vị món ăn, vệ sinh an toàn thực phẩm, giá cả niêm yết', iconName: 'Utensils' },
  { id: 'attractions', label: 'Điểm tham quan', desc: 'Cảnh quan, tiện ích phục vụ, vệ sinh tại các điểm đến', iconName: 'Compass' },
  { id: 'transportation', label: 'Di chuyển & Giao thông', desc: 'Taxi, xe buýt, thuê xe máy, tình trạng giao thông đô thị', iconName: 'Car' },
  { id: 'safety', label: 'An ninh & An toàn', desc: 'Cảm giác an tâm khi dạo phố, an toàn tại bãi biển và nơi công cộng', iconName: 'ShieldCheck' },
  { id: 'cleanliness', label: 'Vệ sinh môi trường', desc: 'Sạch sẽ tại bãi biển, đường phố, thùng rác công cộng', iconName: 'Sparkles' },
  { id: 'pricing', label: 'Giá cả hợp lý & Minh bạch', desc: 'Không chặt chém, niêm yết rõ ràng, tương xứng với chất lượng', iconName: 'BadgeCheck' },
  { id: 'hospitality', label: 'Thái độ phục vụ & Sự thân thiện', desc: 'Sự hiếu khách, văn minh, nhiệt tình của người dân và nhân viên', iconName: 'HeartHandshake' },
];

export const OVERALL_SATISFACTION_OPTIONS = [
  { score: 1, label: 'Rất không hài lòng', emoji: '😡', color: 'text-rose-600', ring: 'ring-rose-400' },
  { score: 2, label: 'Chưa hài lòng', emoji: '🙁', color: 'text-orange-500', ring: 'ring-orange-400' },
  { score: 3, label: 'Bình thường', emoji: '😐', color: 'text-amber-500', ring: 'ring-amber-400' },
  { score: 4, label: 'Hài lòng', emoji: '😊', color: 'text-teal-600', ring: 'ring-teal-400' },
  { score: 5, label: 'Rất hài lòng', emoji: '🤩', color: 'text-emerald-600', ring: 'ring-emerald-400' },
];

export const ISSUE_CHIPS: ChoiceOption[] = [
  { id: 'none', label: '✨ Chuyến đi rất tốt, không gặp vấn đề nào' },
  { id: 'pricing', label: 'Giá cả dịch vụ còn cao / chưa rõ ràng' },
  { id: 'traffic', label: 'Kẹt xe / thiếu chỗ đỗ ô tô giờ cao điểm' },
  { id: 'litter', label: 'Vệ sinh / rác thải ở một số khu vực' },
  { id: 'service', label: 'Thái độ phục vụ chưa niềm nở' },
  { id: 'weather', label: 'Thời tiết mưa gió / nắng gắt ảnh hưởng lịch trình' },
  { id: 'info', label: 'Thiếu biển chỉ dẫn / thông tin du lịch chi tiết' },
  { id: 'crowd', label: 'Các điểm nổi tiếng quá đông đúc' },
];

export const AGE_GROUP_OPTIONS: ChoiceOption[] = [
  { id: 'u18', label: 'Dưới 18 tuổi' },
  { id: '18_24', label: '18 – 24 tuổi' },
  { id: '25_34', label: '25 – 34 tuổi' },
  { id: '35_50', label: '35 – 50 tuổi' },
  { id: 'gt50', label: 'Trên 50 tuổi' },
  { id: 'prefer_not_to_say', label: 'Không muốn nói' },
];

export const DANANGGO_FEATURE_OPTIONS: ChoiceOption[] = [
  { id: 'planner', label: 'Tự động lên lịch trình cá nhân hóa', icon: '📅' },
  { id: 'food_directory', label: 'Khám phá quán ăn & đặc sản địa phương', icon: '🍲' },
  { id: 'interactive_map', label: 'Bản đồ tương tác chỉ đường tối ưu', icon: '🗺️' },
  { id: 'ai_advisor', label: 'Trợ lý AI tư vấn điểm đến', icon: '🤖' },
  { id: 'vip_offers', label: 'Ưu đãi thẻ thành viên VIP', icon: '🎁' },
];

export const DANANGGO_ACCURACY_OPTIONS: ChoiceOption[] = [
  { id: 'very_accurate', label: 'Rất sát thực tế (thời gian di chuyển chuẩn, hợp lý)' },
  { id: 'fairly_accurate', label: 'Khá sát thực tế (chỉ cần điều chỉnh chút ít)' },
  { id: 'needs_improvement', label: 'Cần cải thiện (khoảng cách hoặc thời gian chưa chuẩn)' },
];

// Dữ liệu cho khảo sát nhanh 30 giây (Quick Sheet)
export const QUICK_SURVEY_LIKES: ChoiceOption[] = [
  { id: 'beach', label: 'Biển đẹp & sạch sẽ' },
  { id: 'food', label: 'Ẩm thực phong phú, giá hợp lý' },
  { id: 'people', label: 'Người dân thân thiện, nhiệt tình' },
  { id: 'safety', label: 'An ninh trật tự rất tốt' },
  { id: 'scenery', label: 'Cảnh quan Bà Nà, Sơn Trà, Cầu Rồng' },
  { id: 'app', label: 'Ứng dụng DaNangGo tiện dụng' },
];

export const QUICK_SURVEY_IMPROVEMENTS: ChoiceOption[] = [
  { id: 'traffic', label: 'Giảm ùn tắc khu vực trung tâm' },
  { id: 'parking', label: 'Tăng bãi đỗ xe ô tô tại điểm du lịch' },
  { id: 'nightlife', label: 'Phát triển thêm hoạt động giải trí đêm' },
  { id: 'waste_bins', label: 'Thêm thùng rác và nhà vệ sinh công cộng' },
  { id: 'wifi', label: 'Mở rộng điểm phát Wi-Fi miễn phí' },
  { id: 'signage', label: 'Thêm biển chỉ dẫn đa ngôn ngữ' },
];

// Cấu trúc Form dữ liệu đầy đủ
export interface FullSurveyFormData {
  // Bước 1: Chuyến đi
  tripPurpose: string;
  stayDuration: string;
  travelCompanion: string;
  originProvince: string;
  visitFrequency: string;
  informationChannels: string[];

  // Bước 2: Chi tiêu
  dailyBudget: number; // VNĐ mỗi ngày mỗi người (500k -> 10tr)
  topExpenses: string[];

  // Bước 3: Ma trận đánh giá trải nghiệm (1-5 sao, 0 là Chưa sử dụng)
  experienceRatings: Record<string, number>;

  // Bước 4: Tổng thể & Góp ý
  overallSatisfaction: number; // 1 - 5
  npsScore: number | null; // 0 - 10
  issuesFaced: string[];
  feedbackText: string;

  // Tùy chọn DaNangGo
  ageGroup?: string;
  mostUsefulFeature?: string;
  itineraryAccuracy?: string;
  consentAgreed: boolean; // Bắt buộc
}

export const INITIAL_FULL_SURVEY_DATA: FullSurveyFormData = {
  tripPurpose: '',
  stayDuration: '',
  travelCompanion: '',
  originProvince: '',
  visitFrequency: '',
  informationChannels: [],

  dailyBudget: 1500000, // Mặc định 1.5 triệu/ngày
  topExpenses: [],

  experienceRatings: {
    accommodation: 0,
    food: 0,
    attractions: 0,
    transportation: 0,
    safety: 0,
    cleanliness: 0,
    pricing: 0,
    hospitality: 0,
  },

  overallSatisfaction: 0,
  npsScore: null,
  issuesFaced: [],
  feedbackText: '',

  ageGroup: '',
  mostUsefulFeature: '',
  itineraryAccuracy: '',
  consentAgreed: false,
};

export interface QuickSurveyFormData {
  overallSatisfaction: number; // 1 - 5
  bestLikes: string[];
  improvements: string[];
  npsScore: number | null; // 0 - 10
  quickFeedback: string;
  consentAgreed: boolean;
}

export const INITIAL_QUICK_SURVEY_DATA: QuickSurveyFormData = {
  overallSatisfaction: 0,
  bestLikes: [],
  improvements: [],
  npsScore: null,
  quickFeedback: '',
  consentAgreed: false,
};
