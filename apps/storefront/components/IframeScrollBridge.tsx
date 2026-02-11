'use client';

import { useEffect } from 'react';

/**
 * Cooperative scroll bridge for the iframe-embedded storefront widget.
 *
 * 1. Reports document scrollHeight to parent so it can size the scroll-spacer.
 * 2. Receives PRICEFLOW_SCROLL from parent and applies window.scrollTo().
 * 3. Forwards wheel events to parent so the *parent* scrollbar drives scrolling.
 * 4. Hides the iframe's own scrollbar (via class on <html>).
 */
export function IframeScrollBridge() {
  useEffect(() => {
    // Only activate inside an iframe
    if (window === window.parent) return;

    // Mark <html> so CSS can hide the scrollbar
    document.documentElement.classList.add('in-iframe');

    // --- 1. Report content height ---
    let lastScrollHeight = 0;

    const reportHeight = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      if (scrollHeight !== lastScrollHeight) {
        lastScrollHeight = scrollHeight;
        window.parent.postMessage({
          type: 'PRICEFLOW_RESIZE',
          scrollHeight,
        }, '*');
      }
    };

    const resizeObserver = new ResizeObserver(reportHeight);
    resizeObserver.observe(document.body);
    reportHeight();

    // --- 2. Receive scroll position from parent ---
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PRICEFLOW_SCROLL') {
        window.scrollTo({ top: event.data.scrollTop, behavior: 'instant' });
      }
    };
    window.addEventListener('message', handleMessage);

    // --- 3. Forward wheel events to parent ---
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      window.parent.postMessage({
        type: 'PRICEFLOW_WHEEL',
        deltaY: event.deltaY,
      }, '*');
    };
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('wheel', handleWheel);
      document.documentElement.classList.remove('in-iframe');
    };
  }, []);

  return null;
}
