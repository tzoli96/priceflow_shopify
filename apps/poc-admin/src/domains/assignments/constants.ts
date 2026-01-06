export const API_ENDPOINTS = {
  assignments: {
    list: '/api/v1/assignments',
    create: '/api/v1/assignments',
    bulkAssign: '/api/v1/assignments/bulk',
    delete: (id: string) => `/api/v1/assignments/${id}`,
    collisions: '/api/v1/assignments/collisions',
    forProduct: (productId: string) => `/api/v1/assignments/product/${productId}`,
  },
};
