import type { Template } from './types';
import type { ApiResponse } from '@/types';
import { API_ENDPOINTS } from './constants';

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
  
  return import.meta.env.VITE_SHOP_DOMAIN;
}

const apiClient = {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    const shop = getShopDomain();
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop': shop,
      },
    });
    
    if (response.status === 304) {
      return { success: true, data: [] as any };
    }
    
    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      const errorMessage = data.error?.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMessage };
    }
    
    return { success: true, data: data.data };
  },
  
  async post<T>(url: string, requestData: any): Promise<ApiResponse<T>> {
    const shop = getShopDomain();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop': shop,
      },
      body: JSON.stringify(requestData),
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      const errorMessage = data.error?.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMessage };
    }
    
    return { success: true, data: data.data };
  },
  
  async put<T>(url: string, requestData: any): Promise<ApiResponse<T>> {
    const shop = getShopDomain();
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop': shop,
      },
      body: JSON.stringify(requestData),
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      const errorMessage = data.error?.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMessage };
    }
    
    return { success: true, data: data.data };
  },
  
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const shop = getShopDomain();
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop': shop,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      const errorMessage = data.error?.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMessage };
    }
    
    return { success: true, data: data.data };
  },
};

export const templateApi = {
  async list(): Promise<ApiResponse<Template[]>> {
    return apiClient.get<Template[]>(API_ENDPOINTS.templates.list);
  },

  async get(id: string): Promise<ApiResponse<Template>> {
    return apiClient.get<Template>(API_ENDPOINTS.templates.get(id));
  },

  async create(template: Partial<Template>): Promise<ApiResponse<Template>> {
    return apiClient.post<Template>(API_ENDPOINTS.templates.create, template);
  },

  async update(id: string, template: Partial<Template>): Promise<ApiResponse<Template>> {
    return apiClient.put<Template>(API_ENDPOINTS.templates.update(id), template);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.templates.delete(id));
  },
};
