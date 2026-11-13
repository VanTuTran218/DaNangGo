import { GlobalScrollProgress, PageTransition } from "@/components/ui/MotionPrimitives";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalScrollProgress />
      <PageTransition>{children}</PageTransition>
    </>
  );
}
