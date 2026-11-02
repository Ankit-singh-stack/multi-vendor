import api from './api';

const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  createProduct: (formData) =>
    api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProduct: (id, formData) =>
    api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getReviews: (productId, params) => api.get(`/reviews/${productId}`, { params }),
  createReview: (payload) => api.post('/reviews', payload),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

export default productService;
