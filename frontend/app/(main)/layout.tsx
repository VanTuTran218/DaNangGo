import { GlobalScrollProgress, PageTransition, PageLoadBar } from "@/components/ui/MotionPrimitives";
import WeatherFloatingButton from "@/components/weather/WeatherFloatingButton";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Teal progress bar chạy khi chuyển trang */}
      <PageLoadBar />
      <GlobalScrollProgress />
      <PageTransition>{children}</PageTransition>
      <WeatherFloatingButton />
    </>
  );
}
