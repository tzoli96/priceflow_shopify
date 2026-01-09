/**
 * Shop Domain Management
 *
 * Priority order for shop domain resolution:
 * 1. URL parameter: ?shop=example.myshopify.com (Shopify OAuth redirect)
 * 2. localStorage cache: Saved from previous URL parameter
 * 3. Environment variable: VITE_SHOP_DOMAIN (development fallback)
 *
 * Usage:
 * ```ts
 * import { getShopDomain, setShopDomain, clearShopDomain } from '@/lib/shopify/shop';
 *
 * // Get shop domain (priority order)
 * const shop = getShopDomain();
 *
 * // Set shop domain (saves to localStorage)
 * setShopDomain('example.myshopify.com');
 *
 * // Clear shop domain (logout)
 * clearShopDomain();
 * ```
 */

const SHOP_STORAGE_KEY = 'shopify_shop_domain';

/**
 * Validate Shopify domain format
 *
 * @param domain - Domain to validate
 * @returns true if valid *.myshopify.com format
 */
export function isValidShopifyDomain(domain: string): boolean {
  return /^[a-z0-9-]+\.myshopify\.com$/.test(domain);
}

/**
 * Get shop domain from localStorage
 *
 * @returns Shop domain from localStorage or null
 */
function getShopFromLocalStorage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(SHOP_STORAGE_KEY);
    if (stored && isValidShopifyDomain(stored)) {
      return stored;
    }
    return null;
  } catch (error) {
    console.error('[getShopFromLocalStorage] Failed to read from localStorage:', error);
    return null;
  }
}

/**
 * Get shop domain from environment variable
 *
 * @returns Shop domain from VITE_SHOP_DOMAIN or null
 */
function getShopFromEnv(): string | null {
  const envShop = import.meta.env.VITE_SHOP_DOMAIN;

  if (envShop && isValidShopifyDomain(envShop)) {
    return envShop;
  }

  return null;
}

/**
 * Get shop domain with priority order:
 * 1. localStorage (if available)
 * 2. Environment variable (development fallback)
 *
 * Note: URL parameter should be checked separately in components
 * and saved via setShopDomain()
 *
 * @returns Shop domain or null
 */
export function getShopDomain(): string | null {
  // Priority 1: localStorage cache
  const storedShop = getShopFromLocalStorage();
  if (storedShop) {
    return storedShop;
  }

  // Priority 2: Environment variable (development)
  const envShop = getShopFromEnv();
  if (envShop) {
    console.log('[getShopDomain] Using shop from environment:', envShop);
    return envShop;
  }

  console.warn('[getShopDomain] No shop domain found. Please authenticate via Shopify OAuth.');
  return null;
}

/**
 * Set shop domain to localStorage
 *
 * @param shopDomain - Shop domain to save
 * @throws Error if domain format is invalid
 */
export function setShopDomain(shopDomain: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Validate format
  if (!isValidShopifyDomain(shopDomain)) {
    throw new Error(`Invalid shop domain format: ${shopDomain}. Expected: *.myshopify.com`);
  }

  try {
    localStorage.setItem(SHOP_STORAGE_KEY, shopDomain);
    console.log('[setShopDomain] Shop domain saved to localStorage:', shopDomain);
  } catch (error) {
    console.error('[setShopDomain] Failed to save to localStorage:', error);
    throw error;
  }
}

/**
 * Clear shop domain from localStorage (logout)
 */
export function clearShopDomain(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(SHOP_STORAGE_KEY);
    console.log('[clearShopDomain] Shop domain cleared from localStorage');
  } catch (error) {
    console.error('[clearShopDomain] Failed to clear localStorage:', error);
  }
}

/**
 * Get shop domain from URL parameter
 *
 * Usage in components:
 * ```ts
 * const searchParams = useSearchParams();
 * const shopFromUrl = getShopFromUrl(searchParams);
 * if (shopFromUrl) {
 *   setShopDomain(shopFromUrl);
 * }
 * ```
 *
 * @param searchParams - URLSearchParams or ReadonlyURLSearchParams
 * @returns Shop domain from URL or null
 */
export function getShopFromUrl(searchParams: URLSearchParams | ReadonlyURLSearchParams): string | null {
  const shop = searchParams.get('shop');

  if (shop && isValidShopifyDomain(shop)) {
    return shop;
  }

  return null;
}
