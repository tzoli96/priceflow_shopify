/**
 * Global API Client
 *
 * Centralized API communication with encryption support
 *
 * Architecture:
 * 1. Browser → API Client (this file)
 * 2. API Client → NestJS Backend (via Nginx proxy)
 * 3. Shop domain fetched from database (single-shop mode)
 *
 * Encryption:
 * - beforeRequest: Encrypt request payload (TODO: implement)
 * - afterResponse: Decrypt response payload (TODO: implement)
 */

import { getShopDomain } from '../shopify/session';

/**
 * API Error
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

/**
 * Request/Response Interceptor Hooks
 */
interface InterceptorHooks {
  beforeRequest?: (data: any) => Promise<any> | any;
  afterResponse?: (data: any) => Promise<any> | any;
}

/**
 * Global API Client
 *
 * Singleton instance for all API communication
 */
export class ApiClient {
  private baseUrl: string;
  private hooks: InterceptorHooks;

  constructor(hooks: InterceptorHooks = {}) {
    // Use relative URLs - requests go through Nginx proxy
    // Browser → Nginx (app.teszt.uk) → API container (api:4000)
    // This avoids CORS issues
    this.baseUrl = '';
    this.hooks = hooks;
  }

  /**
   * Set encryption/decryption hooks
   *
   * Usage:
   * ```ts
   * apiClient.setHooks({
   *   beforeRequest: async (data) => encrypt(data),
   *   afterResponse: async (data) => decrypt(data),
   * });
   * ```
   */
  setHooks(hooks: InterceptorHooks) {
    this.hooks = { ...this.hooks, ...hooks };
  }

  /**
   * Core HTTP request method
   *
   * Handles:
   * - Shop header injection
   * - Request encryption (if hook provided)
   * - Response decryption (if hook provided)
   * - Error handling
   */
  async request<TResponse = any, TRequest = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<TResponse> {
    // Get shop domain from database (single-shop mode)
    const shop = await getShopDomain();

    if (!shop) {
      throw new Error('No shop domain found. Please authenticate first.');
    }

    // Build full URL
    const url = `${this.baseUrl}${endpoint}`;

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Shopify-Shop': shop,
      ...options.headers,
    };

    // Request body encryption hook
    let body = options.body;
    if (body && this.hooks.beforeRequest) {
      const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
      const encryptedData = await this.hooks.beforeRequest(parsedBody);
      body = JSON.stringify(encryptedData);
    }

    // Execute request
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    // Handle errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(response.status, response.statusText, errorData);
    }

    // Handle 204 No Content or empty response
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null as TResponse;
    }

    // Parse response (with safety check for empty body)
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null as TResponse;
    }

    let data = JSON.parse(text);

    // Response decryption hook
    if (this.hooks.afterResponse) {
      data = await this.hooks.afterResponse(data);
    }

    return data as TResponse;
  }

  /**
   * GET request
   */
  async get<TResponse = any>(endpoint: string): Promise<TResponse> {
    return this.request<TResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<TResponse = any, TRequest = any>(
    endpoint: string,
    data?: TRequest
  ): Promise<TResponse> {
    return this.request<TResponse, TRequest>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<TResponse = any, TRequest = any>(
    endpoint: string,
    data?: TRequest
  ): Promise<TResponse> {
    return this.request<TResponse, TRequest>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<TResponse = any>(endpoint: string): Promise<TResponse> {
    return this.request<TResponse>(endpoint, {
      method: 'DELETE',
    });
  }
}

/**
 * Global singleton API client instance
 *
 * Import this in your code:
 * ```ts
 * import { apiClient } from '@/lib/api';
 * const templates = await apiClient.templates.list();
 * ```
 */
export const apiClient = new ApiClient();
