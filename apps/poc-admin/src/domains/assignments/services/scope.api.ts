/**
 * Scope API Service
 * Clean API layer for scope endpoints
 */

import type {
    ScopeProduct,
    ScopeCollection,
    ScopeVendor,
    ScopeTag,
    ScopeApiResponse,
    ScopeSearchParams,
} from '../types/scope.types';

// ============================================================================
// API Configuration
// ============================================================================

const SCOPE_BASE_URL = '/api/v1/scope';

/**
 * Get shop domain from URL or localStorage
 */
function getShopDomain(): string {
    const params = new URLSearchParams(window.location.search);
    const shopFromUrl = params.get('shop');

    if (shopFromUrl) {
        localStorage.setItem('shopDomain', shopFromUrl);
        return shopFromUrl;
    }

    const shopFromStorage = localStorage.getItem('shopDomain');
    if (shopFromStorage) {
        return shopFromStorage;
    }

    return import.meta.env.VITE_SHOP_DOMAIN || 'test-dekormunka.myshopify.com';
}

/**
 * Base fetch wrapper with shop header
 */
async function fetchWithShop<T>(url: string): Promise<ScopeApiResponse<T>> {
    try {
        const shop = getShopDomain();
        const response = await fetch(url, {
            headers: {
                'X-Shopify-Shop': shop,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                data: [] as unknown as T,
                error: data.error || {
                    message: 'Failed to fetch data',
                    code: 'FETCH_ERROR',
                    statusCode: response.status,
                },
            };
        }

        return data;
    } catch (error) {
        console.error('Scope API Error:', error);
        return {
            success: false,
            data: [] as unknown as T,
            error: {
                message: error instanceof Error ? error.message : 'Network error',
                code: 'NETWORK_ERROR',
            },
        };
    }
}

/**
 * Build query string from params
 */
function buildQueryString(params: ScopeSearchParams): string {
    const query = new URLSearchParams();

    if (params.search) {
        query.append('search', params.search);
    }
    if (params.limit) {
        query.append('limit', params.limit.toString());
    }
    if (params.after) {
        query.append('after', params.after);
    }

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
}

// ============================================================================
// Scope API Service
// ============================================================================

export const ScopeApiService = {
    /**
     * Fetch products with optional search and pagination
     */
    async fetchProducts(
        params: ScopeSearchParams = {}
    ): Promise<ScopeApiResponse<ScopeProduct[]>> {
        const queryString = buildQueryString(params);
        return fetchWithShop<ScopeProduct[]>(`${SCOPE_BASE_URL}/products${queryString}`);
    },

    /**
     * Fetch single product by ID
     */
    async fetchProductById(id: string): Promise<ScopeApiResponse<ScopeProduct>> {
        return fetchWithShop<ScopeProduct>(`${SCOPE_BASE_URL}/products/${id}`);
    },

    /**
     * Fetch collections with optional search and pagination
     */
    async fetchCollections(
        params: ScopeSearchParams = {}
    ): Promise<ScopeApiResponse<ScopeCollection[]>> {
        const queryString = buildQueryString(params);
        return fetchWithShop<ScopeCollection[]>(`${SCOPE_BASE_URL}/collections${queryString}`);
    },

    /**
     * Fetch single collection by ID
     */
    async fetchCollectionById(id: string): Promise<ScopeApiResponse<ScopeCollection>> {
        return fetchWithShop<ScopeCollection>(`${SCOPE_BASE_URL}/collections/${id}`);
    },

    /**
     * Fetch all vendors with optional search
     */
    async fetchVendors(params: ScopeSearchParams = {}): Promise<ScopeApiResponse<ScopeVendor[]>> {
        const queryString = buildQueryString(params);
        return fetchWithShop<ScopeVendor[]>(`${SCOPE_BASE_URL}/vendors${queryString}`);
    },

    /**
     * Fetch all tags with optional search
     */
    async fetchTags(params: ScopeSearchParams = {}): Promise<ScopeApiResponse<ScopeTag[]>> {
        const queryString = buildQueryString(params);
        return fetchWithShop<ScopeTag[]>(`${SCOPE_BASE_URL}/tags${queryString}`);
    },

    /**
     * Clear all caches
     */
    async clearCache(): Promise<ScopeApiResponse<{ message: string }>> {
        try {
            const shop = getShopDomain();
            const response = await fetch(`${SCOPE_BASE_URL}/clear-cache`, {
                method: 'POST',
                headers: {
                    'X-Shopify-Shop': shop,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    data: { message: '' },
                    error: data.error || {
                        message: 'Failed to clear cache',
                        code: 'CLEAR_CACHE_ERROR',
                    },
                };
            }

            return data;
        } catch (error) {
            return {
                success: false,
                data: { message: '' },
                error: {
                    message: error instanceof Error ? error.message : 'Network error',
                    code: 'NETWORK_ERROR',
                },
            };
        }
    },
};
