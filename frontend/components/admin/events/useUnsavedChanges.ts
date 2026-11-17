'use client';

import { useEffect } from 'react';

type NavigateEvent = globalThis.Event & { canIntercept: boolean };
type BrowserNavigation = { addEventListener: (type: 'navigate', handler: (event: NavigateEvent) => void) => void; removeEventListener: (type: 'navigate', handler: (event: NavigateEvent) => void) => void };

export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const message = 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời trang?';
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const navigation = (window as unknown as { navigation?: BrowserNavigation }).navigation;
    // Navigation API chặn cả Back/Forward và router.push trước khi trang bị thay thế.
    const navigate = (event: NavigateEvent) => {
      if (event.cancelable && event.canIntercept && !window.confirm(message)) event.preventDefault();
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const target = new URL(anchor.href, window.location.href);
      if (target.href === window.location.href || (target.pathname === location.pathname && target.search === location.search && target.hash)) return;
      if (!window.confirm(message)) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    window.addEventListener('beforeunload', beforeUnload);
    if (navigation) navigation.addEventListener('navigate', navigate);
    else document.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      navigation?.removeEventListener('navigate', navigate);
      document.removeEventListener('click', click, true);
    };
  }, [dirty]);
}
