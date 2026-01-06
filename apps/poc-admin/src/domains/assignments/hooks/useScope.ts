/**
 * useScope Hook
 * Custom hook for fetching scope data (products, collections, vendors, tags)
 */

import { useState, useEffect, useCallback } from 'react';
import { ScopeApiService } from '../services/scope.api';
import type {
    ScopeType,
    ScopeProduct,
    ScopeCollection,
    ScopeVendor,
    ScopeTag,
    ScopeState,
    ScopeSearchParams,
} from '../types/scope.types';

// ============================================================================
// Hook Types
// ============================================================================

type ScopeItemType<T extends ScopeType> = T extends 'product'
    ? ScopeProduct
    : T extends 'collection'
    ? ScopeCollection
    : T extends 'vendor'
    ? ScopeVendor
    : T extends 'tag'
    ? ScopeTag
    : never;

interface UseScopeResult<T extends ScopeType> {
    data: ScopeItemType<T>[];
    loading: boolean;
    error: string | null;
    search: (query: string) => void;
    refresh: () => void;
    loadMore: () => void;
    hasMore: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom hook for fetching and managing scope data
 * @param scopeType - Type of scope to fetch (product, collection, vendor, tag)
 * @param initialParams - Initial search parameters
 */
export function useScope<T extends ScopeType>(
    scopeType: T,
    initialParams: ScopeSearchParams = {}
): UseScopeResult<T> {
    const [state, setState] = useState<ScopeState<ScopeItemType<T>>>({
        data: [],
        loading: true,
        error: null,
        pagination: null,
    });

    const [searchQuery, setSearchQuery] = useState(initialParams.search || '');
    const [params, setParams] = useState<ScopeSearchParams>(initialParams);

    /**
     * Fetch data based on scope type
     */
    const fetchData = useCallback(
        async (searchParams: ScopeSearchParams, append: boolean = false) => {
            setState((prev) => ({ ...prev, loading: true, error: null }));

            try {
                let response;

                switch (scopeType) {
                    case 'product':
                        response = await ScopeApiService.fetchProducts(searchParams);
                        break;
                    case 'collection':
                        response = await ScopeApiService.fetchCollections(searchParams);
                        break;
                    case 'vendor':
                        response = await ScopeApiService.fetchVendors(searchParams);
                        break;
                    case 'tag':
                        response = await ScopeApiService.fetchTags(searchParams);
                        break;
                    default:
                        throw new Error(`Unknown scope type: ${scopeType}`);
                }

                if (response.success) {
                    setState((prev) => ({
                        data: append ? [...prev.data, ...response.data] : response.data,
                        loading: false,
                        error: null,
                        pagination: response.pagination || null,
                    }));
                } else {
                    setState((prev) => ({
                        ...prev,
                        loading: false,
                        error: response.error?.message || 'Failed to fetch data',
                    }));
                }
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred',
                }));
            }
        },
        [scopeType]
    );

    /**
     * Initial data load
     */
    useEffect(() => {
        fetchData(params);
    }, [params, fetchData]);

    /**
     * Search handler with debounce
     */
    const search = useCallback((query: string) => {
        setSearchQuery(query);
        // Debounce search
        const timeoutId = setTimeout(() => {
            setParams((prev) => ({ ...prev, search: query, after: undefined }));
        }, 300);

        return () => clearTimeout(timeoutId);
    }, []);

    /**
     * Refresh data
     */
    const refresh = useCallback(() => {
        setParams((prev) => ({ ...prev, after: undefined }));
    }, []);

    /**
     * Load more data (pagination)
     */
    const loadMore = useCallback(() => {
        if (state.pagination?.hasNextPage && state.pagination?.endCursor) {
            fetchData(
                {
                    ...params,
                    after: state.pagination.endCursor,
                },
                true
            );
        }
    }, [state.pagination, params, fetchData]);

    return {
        data: state.data,
        loading: state.loading,
        error: state.error,
        search,
        refresh,
        loadMore,
        hasMore: state.pagination?.hasNextPage || false,
    };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for fetching products
 */
export function useScopeProducts(params?: ScopeSearchParams) {
    return useScope('product', params);
}

/**
 * Hook for fetching collections
 */
export function useScopeCollections(params?: ScopeSearchParams) {
    return useScope('collection', params);
}

/**
 * Hook for fetching vendors
 */
export function useScopeVendors(params?: ScopeSearchParams) {
    return useScope('vendor', params);
}

/**
 * Hook for fetching tags
 */
export function useScopeTags(params?: ScopeSearchParams) {
    return useScope('tag', params);
}
