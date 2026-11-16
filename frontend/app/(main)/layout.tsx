import { GlobalScrollProgress, PageTransition } from "@/components/ui/MotionPrimitives";
import WeatherFloatingButton from "@/components/weather/WeatherFloatingButton";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalScrollProgress />
      <PageTransition>{children}</PageTransition>
      <WeatherFloatingButton />
    </>
  );
}
