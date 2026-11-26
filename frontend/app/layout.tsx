import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import IntroOverlay from "@/components/layout/IntroOverlay";
import ChatBox from "@/components/chat/ChatBox";
import LenisProvider from "@/providers/LenisProvider";
import ScrollRevealProvider from "@/providers/ScrollRevealProvider";
import { HeroSlideProvider } from "@/contexts/HeroSlideContext";
import { NavbarHeroProvider } from "@/contexts/NavbarHeroContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { Be_Vietnam_Pro, Inter, Playfair_Display } from "next/font/google";

// ── Font chính toàn website: Be Vietnam Pro (Hỗ trợ tiếng Việt đầy đủ, chuẩn Premium Travel) ──
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

// ── Font Editorial Serif cho Homepage Luxury: Playfair Display ──
const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif-editorial",
  display: "swap",
});

// ── Font phụ: Inter ──
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DanangGo — Cẩm nang du lịch Đà Nẵng",
  description:
    "Khám phá Đà Nẵng với DanangGo — cẩm nang du lịch đầy đủ nhất về điểm đến, ẩm thực, lưu trú và lịch trình gợi ý.",
  keywords: "Đà Nẵng, du lịch, cẩm nang, bãi biển Mỹ Khê, Bà Nà Hills",
  icons: {
    icon: [
      { url: "/images/branding/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/branding/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/branding/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/images/branding/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
      data-scroll-behavior="smooth"
      className={`${beVietnamPro.variable} ${inter.variable} ${playfairDisplay.variable}`}
    >
      <body className="text-gray-900 antialiased">
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
          <FavoritesProvider>
            <HeroSlideProvider>
              <NavbarHeroProvider>
                <LenisProvider>
                  {/* CSS Scroll Reveal (IntersectionObserver — toàn trang) */}
                  <ScrollRevealProvider />

                  {/* Fixed Navbar */}
                  <Navbar />

                  {/* Page content */}
                  <main>{children}</main>

                  {/* Floating AI Chat Assistant */}
                  <ChatBox />
                </LenisProvider>
              </NavbarHeroProvider>
            </HeroSlideProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
