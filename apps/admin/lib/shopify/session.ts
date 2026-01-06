/**
 * Shop session management utilities
 * Handles shop domain from database (single-shop mode)
 */

let cachedShopDomain: string | null = null;

/**
 * Get shop domain from database (via /api/shopify/current)
 *
 * NOTE: Simple single-shop mode - always returns first shop from database.
 * No cookies, no localStorage, no URL parameters.
 */
export async function getShopDomain(): Promise<string | null> {
  // Return cached value if available
  if (cachedShopDomain) {
    return cachedShopDomain;
  }

  try {
    const response = await fetch('/api/shopify/current');

    if (!response.ok) {
      console.error('[getShopDomain] Failed to fetch shop from backend');
      return null;
    }

    const data = await response.json();

    if (!data.shop) {
      console.error('[getShopDomain] No shop found in database');
      return null;
    }

    cachedShopDomain = data.shop;
    console.log('[getShopDomain] Shop domain from database:', data.shop);
    return data.shop;
  } catch (error) {
    console.error('[getShopDomain] Error fetching shop:', error);
    return null;
  }
}

/**
 * Clear cached shop domain (use after logout)
 */
export function clearShopDomainCache(): void {
  cachedShopDomain = null;
}

/**
 * Validate Shopify domain format
 */
export function isValidShopifyDomain(domain: string): boolean {
  return /^[a-z0-9-]+\.myshopify\.com$/.test(domain);
}
