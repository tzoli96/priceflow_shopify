'use client';

import { useState } from 'react';
import { Card, EmptyState, Button, Banner } from '@shopify/polaris';
import { api } from '@/lib/api';

/**
 * Shop Setup Component
 *
 * Displayed when no shop exists in the database
 * Provides a button to create a dev shop for development (dev only)
 * In production, shows OAuth instructions
 */
export function ShopSetup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleCreateDevShop = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.shop.createDevShop();

      if (response.success) {
        setSuccess(true);
        // Save shop domain to localStorage
        if (response.shopDomain) {
          localStorage.setItem('shopDomain', response.shopDomain);
        }
        // Reload page to reinitialize
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(response.error || 'Failed to create dev shop');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create dev shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <Banner tone="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        </div>
      )}

      {success && (
        <div style={{ marginBottom: '1rem' }}>
          <Banner tone="success">
            Dev shop létrehozva! Újratöltés...
          </Banner>
        </div>
      )}

      <Card>
        <EmptyState
          heading="Üzlet Beállítása Szükséges"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          {isDevelopment ? (
            <>
              <p>
                Még nincs üzlet beállítva az adatbázisban. Fejlesztési módban hozz létre egy dev shop-ot
                a folytatáshoz.
              </p>
              <div style={{ marginTop: '1.5rem' }}>
                <Button
                  variant="primary"
                  onClick={handleCreateDevShop}
                  loading={loading}
                  disabled={success}
                >
                  Dev Shop Létrehozása
                </Button>
              </div>
            </>
          ) : (
            <>
              <p>
                Még nincs üzlet csatlakoztatva az alkalmazáshoz.
              </p>
              <p style={{ marginTop: '1rem' }}>
                Kérjük, használd a Shopify OAuth flow-t az üzlet hitelesítéséhez és csatlakoztatásához.
              </p>
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                A beállítási folyamat automatikusan elindul amikor először megnyitod az alkalmazást
                a Shopify admin felületéről.
              </p>
            </>
          )}
        </EmptyState>
      </Card>
    </div>
  );
}
