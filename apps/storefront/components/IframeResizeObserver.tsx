'use client';

import { useEffect } from 'react';

/**
 * Watches the document height inside the iframe and sends it
 * to the parent page via postMessage so the iframe can be resized
 * to fit its content (no double scrollbar).
 */
export function IframeResizeObserver() {
  useEffect(() => {
    if (window === window.parent) return;

    let lastHeight = 0;

    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      if (height !== lastHeight) {
        lastHeight = height;
        window.parent.postMessage({ type: 'PRICEFLOW_RESIZE', height }, '*');
      }
    };

    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);

    sendHeight();

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
