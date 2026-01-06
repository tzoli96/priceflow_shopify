/**
 * API Service - Backend communication layer
 */

import type {
    Template,
    TemplateAssignment,
    TemplateCollision,
    ApiResponse,
    PaginatedResponse,
    CalculationLog,
} from '@/types';
import { API_ENDPOINTS as TEMPLATE_ENDPOINTS } from '@/template/constants';
import { API_ENDPOINTS as ASSIGNMENT_ENDPOINTS } from '@/assignments/constants';
import { API_ENDPOINTS as CALCULATION_ENDPOINTS } from '@/calculation/constants';
import { API_ENDPOINTS as SHOPIFY_ENDPOINTS } from '@/shopify/constants';
import { API_ENDPOINTS as COMMON_ENDPOINTS } from '@/common/constants';

// ============================================================================
// SHOP HEADER HELPER
// ============================================================================

/**
 * Get shop from URL or localStorage
 * In production, this should come from Shopify App Bridge
 */
function getShopDomain(): string {
    // Check URL params (for development)
    const params = new URLSearchParams(window.location.search);
    const shopFromUrl = params.get('shop');

    if (shopFromUrl) {
        // Save to localStorage for subsequent requests
        localStorage.setItem('shopDomain', shopFromUrl);
        return shopFromUrl;
    }

    // Check localStorage
    const shopFromStorage = localStorage.getItem('shopDomain');
    if (shopFromStorage) {
        return shopFromStorage;
    }

    // Fallback for development
    return import.meta.env.VITE_SHOP_DOMAIN;
}

// ============================================================================
// BASE API CLIENT
// ============================================================================

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const shop = getShopDomain();

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Shop': shop, // Add shop header to every request
                    ...options.headers,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    ok: false,
                    error: {
                        code: data.error?.code || 'UNKNOWN_ERROR',
                        message: data.error?.message || 'Ismeretlen hiba történt',
                        details: data.error?.details,
                    },
                };
            }

            return {
                ok: true,
                data: data.data || data,
            };
        } catch (error) {
            console.error('API Error:', error);
            return {
                ok: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: 'Hálózati hiba történt',
                    details: error,
                },
            };
        }
    }

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    async upload<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const shop = getShopDomain();

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'X-Shopify-Shop': shop,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    ok: false,
                    error: {
                        code: data.error?.code || 'UPLOAD_ERROR',
                        message: data.error?.message || 'Feltöltési hiba',
                        details: data.error?.details,
                    },
                };
            }

            return { ok: true, data: data.data || data };
        } catch (error) {
            return {
                ok: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: 'Hálózati hiba történt',
                    details: error,
                },
            };
        }
    }
}

// API client with empty base URL (Vite proxy handles routing)
const apiClient = new ApiClient('');

// ============================================================================
// TEMPLATE SERVICE
// ============================================================================

export const TemplateService = {
    async list(): Promise<ApiResponse<Template[]>> {
        return apiClient.get<Template[]>(TEMPLATE_ENDPOINTS.templates.list);
    },

    async get(id: string): Promise<ApiResponse<Template>> {
        return apiClient.get<Template>(TEMPLATE_ENDPOINTS.templates.get(id));
    },

    async create(template: Partial<Template>): Promise<ApiResponse<Template>> {
        return apiClient.post<Template>(TEMPLATE_ENDPOINTS.templates.create, template);
    },

    async update(id: string, template: Partial<Template>): Promise<ApiResponse<Template>> {
        return apiClient.put<Template>(TEMPLATE_ENDPOINTS.templates.update(id), template);
    },

    async delete(id: string): Promise<ApiResponse<void>> {
        return apiClient.delete<void>(TEMPLATE_ENDPOINTS.templates.delete(id));
    },

    async preview(id: string, productId: string): Promise<ApiResponse<any>> {
        return apiClient.post<any>(TEMPLATE_ENDPOINTS.templates.preview(id), { productId });
    },

    async exportTemplate(id: string): Promise<ApiResponse<string>> {
        return apiClient.get<string>(TEMPLATE_ENDPOINTS.templates.export(id));
    },

    async importTemplate(jsonData: string): Promise<ApiResponse<Template>> {
        return apiClient.post<Template>(TEMPLATE_ENDPOINTS.templates.import, { jsonData });
    },
};

// ============================================================================
// ASSIGNMENT SERVICE
// ============================================================================

export const AssignmentService = {
    async list(): Promise<ApiResponse<TemplateAssignment[]>> {
        return apiClient.get<TemplateAssignment[]>(ASSIGNMENT_ENDPOINTS.assignments.list);
    },

    async create(assignment: Omit<TemplateAssignment, 'id' | 'assignedAt'>): Promise<ApiResponse<TemplateAssignment>> {
        return apiClient.post<TemplateAssignment>(ASSIGNMENT_ENDPOINTS.assignments.create, assignment);
    },

    async bulkAssign(
        templateId: string,
        productIds: string[],
        priority: number
    ): Promise<ApiResponse<{ created: number; skipped: number; total: number }>> {
        return apiClient.post(ASSIGNMENT_ENDPOINTS.assignments.bulkAssign, {
            templateId,
            productIds,
            priority,
        });
    },

    async delete(id: string): Promise<ApiResponse<void>> {
        return apiClient.delete<void>(ASSIGNMENT_ENDPOINTS.assignments.delete(id));
    },

    async detectCollisions(): Promise<ApiResponse<TemplateCollision[]>> {
        return apiClient.get<TemplateCollision[]>(ASSIGNMENT_ENDPOINTS.assignments.collisions);
    },
};

// ============================================================================
// CALCULATION SERVICE
// ============================================================================

export interface CalculationRequest {
    productId: string;
    templateId: string;
    inputs: Record<string, any>;
    sessionId?: string;
}

export interface CalculationResponse {
    price: number;
    currency: string;
    breakdown: {
        label: string;
        value: number;
        formula?: string;
    }[];
    calculationId: string;
    templateVersion: number;
    timestamp: string;
}

export const CalculationService = {
    async calculate(request: CalculationRequest): Promise<ApiResponse<CalculationResponse>> {
        return apiClient.post<CalculationResponse>(CALCULATION_ENDPOINTS.calculation.calculate, request);
    },

    async getLogs(params: {
        page?: number;
        pageSize?: number;
        productId?: string;
        templateId?: string;
    }): Promise<ApiResponse<PaginatedResponse<CalculationLog>>> {
        const query = new URLSearchParams(params as any).toString();
        return apiClient.get<PaginatedResponse<CalculationLog>>(
            `${CALCULATION_ENDPOINTS.calculation.logs}?${query}`
        );
    },

    async validateFormula(formula: string): Promise<ApiResponse<{ valid: boolean; error?: string }>> {
        return apiClient.post(CALCULATION_ENDPOINTS.calculation.validateFormula, { formula });
    },
};

// ============================================================================
// SHOPIFY SERVICE
// ============================================================================

export interface ShopifyProduct {
    id: string;
    title: string;
    handle: string;
    vendor?: string;
    productType?: string;
    tags?: string[];
    featuredImage?: {
        url: string;
        altText?: string;
    };
}

export interface ShopifyCollection {
    id: string;
    title: string;
    handle: string;
    productsCount?: number;
}

export const ShopifyService = {
    async getProducts(params?: {
        query?: string;
        limit?: number;
    }): Promise<ApiResponse<ShopifyProduct[]>> {
        const query = params ? new URLSearchParams(params as any).toString() : '';
        const url = query ? `${SHOPIFY_ENDPOINTS.shopify.products}?${query}` : SHOPIFY_ENDPOINTS.shopify.products;
        return apiClient.get<ShopifyProduct[]>(url);
    },

    async getProduct(id: string): Promise<ApiResponse<ShopifyProduct>> {
        return apiClient.get<ShopifyProduct>(SHOPIFY_ENDPOINTS.shopify.product(id));
    },

    async getCollections(): Promise<ApiResponse<ShopifyCollection[]>> {
        return apiClient.get<ShopifyCollection[]>(SHOPIFY_ENDPOINTS.shopify.collections);
    },

    async getVendors(): Promise<ApiResponse<string[]>> {
        return apiClient.get<string[]>(SHOPIFY_ENDPOINTS.shopify.vendors);
    },

    async getTags(): Promise<ApiResponse<string[]>> {
        return apiClient.get<string[]>(SHOPIFY_ENDPOINTS.shopify.tags);
    },
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const HealthService = {
    async check(): Promise<ApiResponse<{ ok: boolean; redis: boolean; timestamp: string }>> {
        return apiClient.get(COMMON_ENDPOINTS.health);
    },
};

// ============================================================================
// EXPORT ALL SERVICES
// ============================================================================

export const api = {
    templates: TemplateService,
    assignments: AssignmentService,
    calculation: CalculationService,
    shopify: ShopifyService,
    health: HealthService,
};