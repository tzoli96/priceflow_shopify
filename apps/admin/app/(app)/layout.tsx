'use client';

import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { useSearchParams } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { getShopFromUrl, setShopDomain, getShopDomain } from '@/lib/shopify/shop';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * App Layout
 *
 * Felelősség: Shopify Polaris UI inicializálása és shop domain kezelés
 *
 * Shop domain priority order:
 * 1. URL parameter: ?shop=example.myshopify.com (OAuth redirect)
 * 2. localStorage cache: Saved from previous session
 * 3. Environment variable: VITE_SHOP_DOMAIN (development fallback)
 *
 * Folyamat:
 * 1. URL paraméter ellenőrzés: ?shop=example.myshopify.com
 * 2. Ha van URL shop → localStorage-ba mentés
 * 3. Ha nincs URL shop → localStorage/env fallback
 * 4. Polaris UI renderelése
 *
 * Megjegyzés: App Bridge integration később lesz hozzáadva production környezethez
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const searchParams = useSearchParams();
  const [initialized, setInitialized] = useState(false);
  const [hasShop, setHasShop] = useState(false);

  useEffect(() => {
    // Priority 1: Check URL parameter (Shopify OAuth redirect)
    const shopFromUrl = getShopFromUrl(searchParams);

    if (shopFromUrl) {
      console.log('[AppLayout] Shop domain from URL:', shopFromUrl);
      try {
        setShopDomain(shopFromUrl);
        setHasShop(true);
      } catch (error) {
        console.error('[AppLayout] Failed to save shop domain:', error);
        setHasShop(false);
      }
      setInitialized(true);
      return;
    }

    // Priority 2 & 3: Check localStorage or environment variable
    const shopFromCache = getShopDomain();

    if (shopFromCache) {
      console.log('[AppLayout] Shop domain from cache/env:', shopFromCache);
      setHasShop(true);
    } else {
      console.warn('[AppLayout] No shop parameter found. Please authenticate via Shopify OAuth.');
      console.warn('[AppLayout] Expected URL format: ?shop=example.myshopify.com');
      setHasShop(false);
    }

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

  // No shop found - show error state
  if (!hasShop) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'system-ui',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h2>Shop Not Found</h2>
        <p>No shop parameter found. Please authenticate via Shopify OAuth.</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Expected URL format: ?shop=example.myshopify.com
        </p>
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
