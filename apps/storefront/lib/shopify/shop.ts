/**
 * Shop Domain Management for Storefront
 *
 * Simplified version for storefront app - gets shop from environment or URL
 */

/**
 * Get shop domain from environment or URL
 *
 * Priority:
 * 1. Environment variable (NEXT_PUBLIC_SHOP_DOMAIN)
 * 2. URL parameter (?shop=...)
 * 3. Window location hostname (if on Shopify)
 *
 * @returns Shop domain or undefined
 */
export function getShopDomain(): string | undefined {
  // 1. Try environment variable (for development/testing)
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SHOP_DOMAIN) {
    return process.env.NEXT_PUBLIC_SHOP_DOMAIN;
  }

  // 2. Try URL parameter (client-side only)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get('shop');
    if (shopParam) {
      return shopParam;
    }

    // 3. Try to extract from hostname (if on Shopify domain)
    const hostname = window.location.hostname;
    if (hostname.endsWith('.myshopify.com')) {
      return hostname;
    }
  }

  return undefined;
}

/**
 * Validate if string is a valid Shopify domain
 *
 * @param domain - Domain to validate
 * @returns True if valid Shopify domain format
 */
export function isValidShopifyDomain(domain: string): boolean {
  if (!domain) return false;

  // Must end with .myshopify.com
  if (!domain.endsWith('.myshopify.com')) return false;

  // Must not have spaces or invalid characters
  const validDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return validDomainRegex.test(domain);
}
