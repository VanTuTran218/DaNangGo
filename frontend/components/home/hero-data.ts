export const INTERVAL_MS = 4500; // 4.5 giây tự động chuyển slide mượt mà
export const FADE_MS = 1200;     // 1.2 giây crossfade điện ảnh mượt mà giữa các ảnh nền
export const KEN_BURNS_MS = INTERVAL_MS + FADE_MS; // 5700ms chuyển động zoom nhẹ liên tục
export const SHOW_INDICATORS = true;

export interface HeroSlideData {
  id: number;
  image: string;
  alt: string;
  locationName: string;
  metaTag: string;
  exploreHref: string;
  objectPosition: string;
  badge: string;
  line1: string;
  line2: string; // Dòng 2 chứa điểm nhấn xanh cyan
  line3: string;
  description: string;
}

export const HERO_SLIDES: HeroSlideData[] = [
  {
    id: 1,
    image: "/hero/cau-vang-ba-na-hd.jpg",
    alt: "Cầu Vàng trên Bà Nà Hills, Đà Nẵng",
    locationName: "Cầu Vàng Bà Nà Hills",
    metaTag: "22°C · Đỉnh núi mây phủ",
    exploreHref: "/diemdulich",
    objectPosition: "62% 42%",
    badge: "CẨM NANG DU LỊCH ĐÀ NẴNG 2026",
    line1: "Khám Phá Đà Nẵng",
    line2: "Thiên Đường Biển",
    line3: "& Văn Hóa Miền Trung",
    description:
      '"Đà Nẵng — nơi ánh nắng chạm sóng biển, lịch sử hòa quyện cùng hiện đại, và mỗi góc phố đều là một câu chuyện đáng nhớ."',
  },
  {
    id: 2,
    image: "/hero/pho-co-hoi-an-hd.jpg",
    alt: "Phố cổ Hội An về đêm với thuyền đèn lồng trên sông Hoài",
    locationName: "Phố Cổ Hội An",
    metaTag: "25°C · Đêm đèn lồng",
    exploreHref: "/khampha",
    objectPosition: "58% 52%",
    badge: "DI SẢN VĂN HÓA THẾ GIỚI",
    line1: "Phố Cổ Hội An",
    line2: "Đêm Đèn Lồng Lung Linh",
    line3: "Bên Dòng Sông Hoài",
    description:
      '"Dạo phố cổ, thả hoa đăng và thưởng thức ẩm thực bên dòng sông Hoài, chỉ cách Đà Nẵng khoảng 30 km."',
  },
  {
    id: 3,
    image: "/hero/cau-rong-hd.jpg",
    alt: "Cầu Rồng Đà Nẵng rực sáng về đêm bên sông Hàn",
    locationName: "Cầu Rồng Sông Hàn",
    metaTag: "27°C · Phun lửa T7 & CN",
    exploreHref: "/diemdulich",
    objectPosition: "60% 48%",
    badge: "BIỂU TƯỢNG ĐÀ NẴNG VỀ ĐÊM",
    line1: "Cầu Rồng Đà Nẵng",
    line2: "Thành Phố Rực Sáng",
    line3: "Về Đêm Bên Sông Hàn",
    description:
      '"Ngắm Cầu Rồng ánh vàng phun lửa và tận hưởng nhịp sống về đêm rực rỡ bên bờ sông Hàn."',
  },
];
