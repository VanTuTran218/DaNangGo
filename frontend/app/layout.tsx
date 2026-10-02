import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import IntroOverlay from "@/components/layout/IntroOverlay";
import LenisProvider from "@/providers/LenisProvider";
import { HeroSlideProvider } from "@/contexts/HeroSlideContext";
import { NavbarHeroProvider } from "@/contexts/NavbarHeroContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Be_Vietnam_Pro, Inter } from "next/font/google";

// ── Font display: Be Vietnam Pro (tiêu đề H1/H2/H3, số liệu nổi bật) ──
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

// ── Font body: Inter (nội dung, mô tả, badge, nút, input) ──
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DanangGo — Cẩm nang du lịch Đà Nẵng",
  description:
    "Khám phá Đà Nẵng với DanangGo — cẩm nang du lịch đầy đủ nhất về điểm đến, ẩm thực, lưu trú và lịch trình gợi ý.",
  keywords: "Đà Nẵng, du lịch, cẩm nang, bãi biển Mỹ Khê, Bà Nà Hills",
  openGraph: {
    title: "DanangGo — Cẩm nang du lịch Đà Nẵng",
    description: "Khám phá Đà Nẵng với cẩm nang du lịch đầy đủ nhất.",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${inter.variable}`}
    >
      <body className="bg-gray-50 text-gray-900 antialiased">
        {/*
          IntroOverlay — renders on client-only (useEffect checks sessionStorage)
          Server-side: returns null → no SEO impact, content renders normally
          z-index: 100 phủ toàn bộ header/content khi đang chạy
        */}
        <IntroOverlay />

        {/* AuthProvider cho state đăng nhập
            HeroSlide: màu tint navbar theo slide đang active (trang chủ)
            NavbarHero: element hero/banner thực tế để đo ngưỡng scroll động */}
        <AuthProvider>
          <HeroSlideProvider>
            <NavbarHeroProvider>
              <LenisProvider>
                {/* Fixed Navbar */}
                <Navbar />

                {/* Page content */}
                <main>{children}</main>
              </LenisProvider>
            </NavbarHeroProvider>
          </HeroSlideProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
