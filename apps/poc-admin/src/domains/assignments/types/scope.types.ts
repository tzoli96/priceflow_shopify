/**
 * Scope Types
 * Types for scope selection (products, collections, vendors, tags)
 */

// ============================================================================
// Base Types
// ============================================================================

export interface ScopeProduct {
    id: string;
    title: string;
    handle: string;
    description?: string;
    vendor?: string;
    productType?: string;
    tags?: string[];
    status?: string;
    images?: Array<{
        id: string;
        src: string;
        alt?: string;
        width?: number;
        height?: number;
    }>;
    variants?: Array<{
        id: string;
        productId: string;
        title: string;
        price: string;
        sku?: string;
        inventoryQuantity?: number;
    }>;
    createdAt?: string;
    updatedAt?: string;
}

export interface ScopeCollection {
    id: string;
    title: string;
    handle: string;
    description?: string;
    productsCount?: number;
    image?: {
        id: string;
        src: string;
        alt?: string;
    };
    sortOrder?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ScopeVendor {
    name: string;
}

export interface ScopeTag {
    name: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginationInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
}

export interface ScopeApiResponse<T> {
    success: boolean;
    data: T;
    pagination?: PaginationInfo;
    error?: {
        message: string;
        code: string;
        statusCode?: number;
    };
}

// ============================================================================
// Request Parameters
// ============================================================================

export interface ScopeSearchParams {
    search?: string;
    limit?: number;
    after?: string;
}

// ============================================================================
// Discriminated Union for Scope Data
// ============================================================================

export type ScopeData =
    | { type: 'product'; items: ScopeProduct[] }
    | { type: 'collection'; items: ScopeCollection[] }
    | { type: 'vendor'; items: ScopeVendor[] }
    | { type: 'tag'; items: ScopeTag[] };

export type ScopeType = 'product' | 'collection' | 'vendor' | 'tag';

// ============================================================================
// UI State Types
// ============================================================================

export interface ScopeState<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    pagination: PaginationInfo | null;
}
