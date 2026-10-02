"use client";

/**
 * NavbarHeroContext — cho phép trang con báo Navbar biết element hero/banner
 * thực tế của mình. Navbar sẽ đo chiều cao element đó để làm ngưỡng scroll
 * chuyển trạng thái glass ↔ solid, thay vì hardcode 50px.
 *
 * Cách dùng ở trang có hero/banner:
 *   const { setHeroRef } = useNavbarHero();
 *   <section ref={el => setHeroRef(el)} ...>
 *
 * Trang không có hero: không gọi setHeroRef → threshold = 0 → luôn solid.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface NavbarHeroContextValue {
  heroRef: Element | null;
  setHeroRef: (el: Element | null) => void;
}

const NavbarHeroContext = createContext<NavbarHeroContextValue>({
  heroRef: null,
  setHeroRef: () => {},
});

export function NavbarHeroProvider({ children }: { children: ReactNode }) {
  const [heroRef, setHeroRefState] = useState<Element | null>(null);

  const setHeroRef = useCallback((el: Element | null) => {
    setHeroRefState(el);
  }, []);

  return (
    <NavbarHeroContext.Provider value={{ heroRef, setHeroRef }}>
      {children}
    </NavbarHeroContext.Provider>
  );
}

export function useNavbarHero() {
  return useContext(NavbarHeroContext);
}
