export const INTERVAL_MS = 3500; // 3.5 giây thư thái, cho người dùng đủ thời gian đọc khi chữ chạy chậm
export const FADE_MS = 1000;     // 1 giây crossfade mượt mà
export const KEN_BURNS_MS = INTERVAL_MS + FADE_MS; // 4500ms chuyển động êm dịu
export const SHOW_INDICATORS = true;

export interface HeroSlideData {
  id: number;
  image: string;
  alt: string;
  locationName: string;
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
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=90&w=2560&auto=format&fit=crop",
    alt: "Cầu Vàng trên Bà Nà Hills, Đà Nẵng",
    locationName: "Cầu Vàng Bà Nà Hills",
    objectPosition: "50% 50%",
    badge: "CẨM NANG DU LỊCH ĐÀ NẴNG 2025",
    line1: "Khám Phá Đà Nẵng",
    line2: "Thiên Đường Biển",
    line3: "& Văn Hóa Miền Trung",
    description:
      '"Đà Nẵng — nơi ánh nắng chạm sóng biển, lịch sử hòa quyện cùng hiện đại, và mỗi góc phố đều là một câu chuyện đáng nhớ."',
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1733041449281-9f5c8cd67780?q=90&w=2560&auto=format&fit=crop",
    alt: "Phố cổ Hội An về đêm với thuyền đèn lồng trên sông Hoài",
    locationName: "Phố Cổ Hội An",
    objectPosition: "50% 50%",
    badge: "DI SẢN VĂN HÓA THẾ GIỚI",
    line1: "Phố Cổ Hội An",
    line2: "Đêm Đèn Lồng Lung Linh",
    line3: "Bên Dòng Sông Hoài",
    description:
      '"Dạo phố cổ, thả hoa đăng và thưởng thức ẩm thực bên dòng sông Hoài, chỉ cách Đà Nẵng khoảng 30 km."',
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1701396173275-835886dd72ce?q=90&w=2560&auto=format&fit=crop",
    alt: "Cầu Rồng Đà Nẵng rực sáng về đêm bên sông Hàn",
    locationName: "Cầu Rồng Sông Hàn",
    objectPosition: "50% 50%",
    badge: "BIỂU TƯỢNG ĐÀ NẴNG VỀ ĐÊM",
    line1: "Cầu Rồng Đà Nẵng",
    line2: "Thành Phố Rực Sáng",
    line3: "Về Đêm Bên Sông Hàn",
    description:
      '"Ngắm Cầu Rồng ánh vàng phun lửa và tận hưởng nhịp sống về đêm rực rỡ bên bờ sông Hàn."',
  },
];
