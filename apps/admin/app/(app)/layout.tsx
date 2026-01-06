'use client';

import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { useSearchParams } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * App Layout
 *
 * Felelősség: Shopify Polaris UI inicializálása
 *
 * Funkciók:
 * - Shop domain kiolvasása URL-ből és localStorage-ba mentése
 * - Polaris UI provider beállítása
 *
 * Folyamat:
 * 1. URL paraméterek: ?shop=example.myshopify.com
 * 2. Shop → localStorage
 * 3. Polaris UI renderelése
 *
 * Megjegyzés: App Bridge integration később lesz hozzáadva production környezethez
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const searchParams = useSearchParams();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Shop kiolvasása URL-ből (Shopify embedded app params)
    const shop = searchParams.get('shop');

    if (!shop) {
      console.error('[AppLayout] No shop parameter found in URL. Shopify should provide this.');
      console.error('[AppLayout] Please access the app through Shopify Admin or authenticate via OAuth.');
      setInitialized(true);
      return;
    }

    // Validate shop domain format
    if (!/^[a-z0-9-]+\.myshopify\.com$/.test(shop)) {
      console.error('[AppLayout] Invalid shop domain format:', shop);
      setInitialized(true);
      return;
    }

    console.log('[AppLayout] Shop domain from URL:', shop);
    setInitialized(true);
  }, [searchParams]);

  // Loading state
  if (!initialized) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'system-ui',
        }}
      >
        <p>Initializing...</p>
      </div>
    );
  }

  // Render with Polaris (App Bridge will be added in production)
  return (
    <AppProvider i18n={{}}>
      {children}
    </AppProvider>
  );
}
