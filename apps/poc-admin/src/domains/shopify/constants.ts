export const API_ENDPOINTS = {
  shopify: {
    products: '/api/v1/shopify/products',
    product: (id: string) => `/api/v1/shopify/products/${id}`,
    collections: '/api/v1/shopify/collections',
    vendors: '/api/v1/shopify/vendors',
    tags: '/api/v1/shopify/tags',
  },
};
