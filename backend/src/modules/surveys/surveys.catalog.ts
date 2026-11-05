/** Versioned questionnaires matching the existing Vietnamese survey forms. No responses are seeded. */
export interface SurveyDefinition {
  code: string;
  content: string;
  kind: "TEXT" | "RATING" | "CHOICE" | "NUMBER";
  required: boolean;
  maxChoices: number;
  options?: { code: string; label: string }[];
  minimum?: number;
  maximum?: number;
}
export const SURVEY_CATALOG: Record<"FULL" | "QUICK", SurveyDefinition[]> = {
  FULL: [
    {
      code: "TRIP_PURPOSE",
      content: "Mục đích chuyến đi",
      kind: "CHOICE",
      required: true,
      maxChoices: 1,
      options: [
        {
          code: "leisure",
          label: "Nghỉ dưỡng & Thư giãn",
        },
        {
          code: "food_culture",
          label: "Khám phá ẩm thực & Văn hóa",
        },
        {
          code: "business",
          label: "Công tác & Hội nghị",
        },
        {
          code: "visiting",
          label: "Thăm người thân & Bạn bè",
        },
        {
          code: "backpacking",
          label: "Phượt & Trải nghiệm",
        },
        {
          code: "other",
          label: "Mục đích khác",
        },
      ],
    },
    {
      code: "STAY_DURATION",
      content: "Thời gian lưu trú",
      kind: "CHOICE",
      required: true,
      maxChoices: 1,
      options: [
        {
          code: "1-2",
          label: "1 - 2 ngày",
        },
        {
          code: "3-4",
          label: "3 - 4 ngày",
        },
        {
          code: "5-7",
          label: "5 - 7 ngày",
        },
        {
          code: "gt-7",
          label: "Trên 7 ngày",
        },
      ],
    },
    {
      code: "TRAVEL_COMPANION",
      content: "Người đồng hành",
      kind: "CHOICE",
      required: true,
      maxChoices: 1,
      options: [
        {
          code: "solo",
          label: "Một mình",
        },
        {
          code: "couple",
          label: "Cặp đôi / Bạn đời",
        },
        {
          code: "family",
          label: "Gia đình",
        },
        {
          code: "friends",
          label: "Nhóm bạn / Đồng nghiệp",
        },
      ],
    },
    {
      code: "ORIGIN_PROVINCE",
      content: "Tỉnh/thành hoặc quốc gia xuất phát",
      kind: "CHOICE",
      required: true,
      maxChoices: 1,
      options: [
        {
          code: "QUOC_TE",
          label: "Khách quốc tế (International Tourist)",
        },
        {
          code: "DA_NANG",
          label: "Đà Nẵng",
        },
        {
          code: "QUANG_NAM",
          label: "Quảng Nam",
        },
        {
          code: "THUA_THIEN_HUE",
          label: "Thừa Thiên Huế",
        },
        {
          code: "QUANG_NGAI",
          label: "Quảng Ngãi",
        },
        {
          code: "BINH_DINH",
          label: "Bình Định",
        },
        {
          code: "KHANH_HOA",
          label: "Khánh Hòa",
        },
        {
          code: "QUANG_TRI",
          label: "Quảng Trị",
        },
        {
          code: "QUANG_BINH",
          label: "Quảng Bình",
        },
        {
          code: "HA_TINH",
          label: "Hà Tĩnh",
        },
        {
          code: "NGHE_AN",
          label: "Nghệ An",
        },
        {
          code: "THANH_HOA",
          label: "Thanh Hóa",
        },
        {
          code: "PHU_YEN",
          label: "Phú Yên",
        },
        {
          code: "NINH_THUAN",
          label: "Ninh Thuận",
        },
        {
          code: "BINH_THUAN",
          label: "Bình Thuận",
        },
        {
          code: "KON_TUM",
          label: "Kon Tum",
        },
        {
          code: "GIA_LAI",
          label: "Gia Lai",
        },
        {
          code: "DAK_LAK",
          label: "Đắk Lắk",
        },
        {
          code: "DAK_NONG",
          label: "Đắk Nông",
        },
        {
          code: "LAM_DONG",
          label: "Lâm Đồng",
        },
        {
          code: "HA_NOI",
          label: "Hà Nội",
        },
        {
          code: "HAI_PHONG",
          label: "Hải Phòng",
        },
        {
          code: "QUANG_NINH",
          label: "Quảng Ninh",
        },
        {
          code: "BAC_NINH",
          label: "Bắc Ninh",
        },
        {
          code: "HAI_DUONG",
          label: "Hải Dương",
        },
        {
          code: "HUNG_YEN",
          label: "Hưng Yên",
        },
        {
          code: "NAM_DINH",
          label: "Nam Định",
        },
        {
          code: "NINH_BINH",
          label: "Ninh Bình",
        },
        {
          code: "THAI_BINH",
          label: "Thái Bình",
        },
        {
          code: "VINH_PHUC",
          label: "Vĩnh Phúc",
        },
        {
          code: "HA_NAM",
          label: "Hà Nam",
        },
        {
          code: "BAC_GIANG",
          label: "Bắc Giang",
        },
        {
          code: "PHU_THO",
          label: "Phú Thọ",
        },
        {
          code: "THAI_NGUYEN",
          label: "Thái Nguyên",
        },
        {
          code: "LANG_SON",
          label: "Lạng Sơn",
        },
        {
          code: "LAO_CAI",
          label: "Lào Cai",
        },
        {
          code: "YEN_BAI",
          label: "Yên Bái",
        },
        {
          code: "TUYEN_QUANG",
          label: "Tuyên Quang",
        },
        {
          code: "HA_GIANG",
          label: "Hà Giang",
        },
        {
          code: "CAO_BANG",
          label: "Cao Bằng",
        },
        {
          code: "BAC_KAN",
          label: "Bắc Kạn",
        },
        {
          code: "HOA_BINH",
          label: "Hòa Bình",
        },
        {
          code: "SON_LA",
          label: "Sơn La",
        },
        {
          code: "DIEN_BIEN",
          label: "Điện Biên",
        },
        {
          code: "LAI_CHAU",
          label: "Lai Châu",
        },
        {
          code: "TP_HCM",
          label: "TP. Hồ Chí Minh",
        },
        {
          code: "CAN_THO",
          label: "Cần Thơ",
        },
        {
          code: "BINH_DUONG",
          label: "Bình Dương",
        },
        {
          code: "DONG_NAI",
          label: "Đồng Nai",
        },
        {
          code: "BA_RIA_VUNG_TAU",
          label: "Bà Rịa - Vũng Tàu",
        },
        {
          code: "LONG_AN",
          label: "Long An",
        },
        {
          code: "TIEN_GIANG",
          label: "Tiền Giang",
        },
        {
          code: "BEN_TRE",
          label: "Bến Tre",
        },
        {
          code: "TRA_VINH",
          label: "Trà Vinh",
        },
        {
          code: "VINH_LONG",
          label: "Vĩnh Long",
        },
        {
          code: "DONG_THAP",
          label: "Đồng Tháp",
        },
        {
          code: "AN_GIANG",
          label: "An Giang",
        },
        {
          code: "KIEN_GIANG",
          label: "Kiên Giang",
        },
        {
          code: "HAU_GIANG",
          label: "Hậu Giang",
        },
        {
          code: "SOC_TRANG",
          label: "Sóc Trăng",
        },
        {
          code: "BAC_LIEU",
          label: "Bạc Liêu",
        },
        {
          code: "CA_MAU",
          label: "Cà Mau",
        },
        {
          code: "TAY_NINH",
          label: "Tây Ninh",
        },
        {
          code: "BINH_PHUOC",
          label: "Bình Phước",
        },
      ],
    },
    {
      code: "VISIT_FREQUENCY",
      content: "Số lần đến Đà Nẵng",
      kind: "CHOICE",
      required: true,
      maxChoices: 1,
      options: [
        {
          code: "first_time",
          label: "Lần đầu tiên",
        },
        {
          code: "returned_2_3",
          label: "Đã đến 2 – 3 lần",
        },
        {
          code: "loyal",
          label: "Du khách thân thiết (> 3 lần)",
        },
      ],
    },
    {
      code: "INFO_CHANNELS",
      content: "Kênh thông tin du lịch",
      kind: "CHOICE",
      required: false,
      maxChoices: 7,
      options: [
        {
          code: "social_media",
          label: "Mạng xã hội (Facebook, TikTok, Instagram)",
        },
        {
          code: "friends_family",
          label: "Bạn bè, người thân giới thiệu",
        },
        {
          code: "dananggo",
          label: "Ứng dụng / Website DaNangGo",
        },
        {
          code: "travel_news",
          label: "Báo chí, truyền hình, blog du lịch",
        },
        {
          code: "travel_agency",
          label: "Công ty lữ hành, đại lý tour",
        },
        {
          code: "search_engine",
          label: "Tìm kiếm Google / Bản đồ",
        },
        {
          code: "other",
          label: "Kênh khác",
        },
      ],
    },
    {
      code: "TOP_EXPENSES",
      content: "Các khoản chi tiêu lớn nhất",
      kind: "CHOICE",
      required: true,
      maxChoices: 3,
      options: [
        {
          code: "stay",
          label: "Khách sạn / Resort lưu trú",
        },
        {
          code: "food",
          label: "Ẩm thực & Quán ăn địa phương",
        },
        {
          code: "attractions",
          label: "Vé tham quan & Vui chơi",
        },
        {
          code: "shopping",
          label: "Mua sắm quà đặc sản",
        },
        {
          code: "transport",
          label: "Di chuyển nội thành (Taxi/Thuê xe)",
        },
        {
          code: "tours",
          label: "Tour trọn gói / Hướng dẫn viên",
        },
      ],
    },
    {
      code: "ISSUES_FACED",
      content: "Vấn đề gặp trong chuyến đi",
      kind: "CHOICE",
      required: false,
      maxChoices: 8,
      options: [
        {
          code: "none",
          label: "✨ Chuyến đi rất tốt, không gặp vấn đề nào",
        },
        {
          code: "pricing",
          label: "Giá cả dịch vụ còn cao / chưa rõ ràng",
        },
        {
          code: "traffic",
          label: "Kẹt xe / thiếu chỗ đỗ ô tô giờ cao điểm",
        },
        {
          code: "litter",
          label: "Vệ sinh / rác thải ở một số khu vực",
        },
        {
          code: "service",
          label: "Thái độ phục vụ chưa niềm nở",
        },
        {
          code: "weather",
          label: "Thời tiết mưa gió / nắng gắt ảnh hưởng lịch trình",
        },
        {
          code: "info",
          label: "Thiếu biển chỉ dẫn / thông tin du lịch chi tiết",
        },
        {
          code: "crowd",
          label: "Các điểm nổi tiếng quá đông đúc",
        },
      ],
    },
    {
      code: "AGE_GROUP",
      content: "Nhóm tuổi",
      kind: "CHOICE",
      required: false,
      maxChoices: 1,
      options: [
        {
          code: "u18",
          label: "Dưới 18 tuổi",
        },
        {
          code: "18_24",
          label: "18 – 24 tuổi",
        },
        {
          code: "25_34",
          label: "25 – 34 tuổi",
        },
        {
          code: "35_50",
          label: "35 – 50 tuổi",
        },
        {
          code: "gt50",
          label: "Trên 50 tuổi",
        },
        {
          code: "prefer_not_to_say",
          label: "Không muốn nói",
        },
      ],
    },
    {
      code: "DANANGGO_FEATURE",
      content: "Tính năng DaNangGo hữu ích nhất",
      kind: "CHOICE",
      required: false,
      maxChoices: 1,
      options: [
        {
          code: "planner",
          label: "Tự động lên lịch trình cá nhân hóa",
        },
        {
          code: "food_directory",
          label: "Khám phá quán ăn & đặc sản địa phương",
        },
        {
          code: "interactive_map",
          label: "Bản đồ tương tác chỉ đường tối ưu",
        },
        {
          code: "ai_advisor",
          label: "Trợ lý AI tư vấn điểm đến",
        },
        {
          code: "vip_offers",
          label: "Ưu đãi thẻ thành viên VIP",
        },
      ],
    },
    {
      code: "DANANGGO_ACCURACY",
      content: "Độ sát thực tế của lịch trình",
      kind: "CHOICE",
      required: false,
      maxChoices: 1,
      options: [
        {
          code: "very_accurate",
          label: "Rất sát thực tế (thời gian di chuyển chuẩn, hợp lý)",
        },
        {
          code: "fairly_accurate",
          label: "Khá sát thực tế (chỉ cần điều chỉnh chút ít)",
        },
        {
          code: "needs_improvement",
          label: "Cần cải thiện (khoảng cách hoặc thời gian chưa chuẩn)",
        },
      ],
    },
    {
      code: "DAILY_BUDGET",
      content: "Ngân sách mỗi người mỗi ngày (VND)",
      kind: "NUMBER",
      required: true,
      maxChoices: 1,
      minimum: 500000,
      maximum: 10000000,
    },
    {
      code: "OVERALL_SATISFACTION",
      content: "Mức hài lòng tổng thể",
      kind: "RATING",
      required: true,
      maxChoices: 1,
    },
    {
      code: "NPS_SCORE",
      content: "Mức sẵn sàng giới thiệu (0–10)",
      kind: "NUMBER",
      required: true,
      maxChoices: 1,
      minimum: 0,
      maximum: 10,
    },
    {
      code: "FEEDBACK_TEXT",
      content: "Góp ý về trải nghiệm du lịch Đà Nẵng",
      kind: "TEXT",
      required: false,
      maxChoices: 1,
    },
    {
      code: "EXP_ACCOMMODATION",
      content: "Cơ sở lưu trú",
      kind: "RATING",
      required: false,
      maxChoices: 1,
    },
    {
      code: "EXP_FOOD",
      content: "Ẩm thực & Nhà hàng",
      kind: "RATING",
      required: false,
      maxChoices: 1,
    },
    {
      code: "EXP_ATTRACTIONS",
      content: "Điểm tham quan",
      kind: "RATING",
      required: false,
      maxChoices: 1,
    },
    {
      code: "EXP_TRANSPORTATION",
      content: "Di chuyển & Giao thông",
      kind: "RATING",
      required: false,
      maxChoices: 1,
    },
    {
      code: "EXP_SAFETY",
      content: "An ninh & An toàn",
      kind: "RATING",
      required: false,
      maxChoices: 1,
    },
    {
      code: "EXP_CLEANLINESS",
      content: "Vệ sinh môi trường",
      kind: "RATING",
      required: false,
      maxChoices: 1,
    },
    {
      code: "EXP_PRICING",
      content: "Giá cả hợp lý & Minh bạch",
      kind: "RATING",
      required: false,
      maxChoices: 1,
    },
    {
      code: "EXP_HOSPITALITY",
      content: "Thái độ phục vụ & Sự thân thiện",
      kind: "RATING",
      required: false,
      maxChoices: 1,
    },
  ],
  QUICK: [
    {
      code: "OVERALL_SATISFACTION",
      content: "Mức hài lòng tổng thể",
      kind: "RATING",
      required: true,
      maxChoices: 1,
    },
    {
      code: "BEST_LIKES",
      content: "Điều yêu thích ở Đà Nẵng",
      kind: "CHOICE",
      required: false,
      maxChoices: 8,
      options: [
        {
          code: "beach",
          label: "Biển đẹp & sạch sẽ",
        },
        {
          code: "food",
          label: "Ẩm thực phong phú, giá hợp lý",
        },
        {
          code: "people",
          label: "Người dân thân thiện, nhiệt tình",
        },
        {
          code: "safety",
          label: "An ninh trật tự rất tốt",
        },
        {
          code: "scenery",
          label: "Cảnh quan Bà Nà, Sơn Trà, Cầu Rồng",
        },
        {
          code: "app",
          label: "Ứng dụng DaNangGo tiện dụng",
        },
      ],
    },
    {
      code: "IMPROVEMENTS",
      content: "Điều cần cải thiện",
      kind: "CHOICE",
      required: false,
      maxChoices: 8,
      options: [
        {
          code: "traffic",
          label: "Giảm ùn tắc khu vực trung tâm",
        },
        {
          code: "parking",
          label: "Tăng bãi đỗ xe ô tô tại điểm du lịch",
        },
        {
          code: "nightlife",
          label: "Phát triển thêm hoạt động giải trí đêm",
        },
        {
          code: "waste_bins",
          label: "Thêm thùng rác và nhà vệ sinh công cộng",
        },
        {
          code: "wifi",
          label: "Mở rộng điểm phát Wi-Fi miễn phí",
        },
        {
          code: "signage",
          label: "Thêm biển chỉ dẫn đa ngôn ngữ",
        },
      ],
    },
    {
      code: "NPS_SCORE",
      content: "Mức sẵn sàng giới thiệu (0–10)",
      kind: "NUMBER",
      required: true,
      maxChoices: 1,
      minimum: 0,
      maximum: 10,
    },
    {
      code: "FEEDBACK_TEXT",
      content: "Góp ý nhanh về trải nghiệm du lịch Đà Nẵng",
      kind: "TEXT",
      required: false,
      maxChoices: 1,
    },
  ],
};
