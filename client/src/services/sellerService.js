import api from './api';

const sellerService = {
  register: (formData) =>
    api.post('/seller/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getProfile: () => api.get('/seller/profile'),
  updateProfile: (formData) =>
    api.put('/seller/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDashboard: () => api.get('/seller/dashboard'),
  getProducts: (params) => api.get('/seller/products', { params }),
  getOrders: (params) => api.get('/seller/orders', { params }),
  getAnalytics: () => api.get('/seller/analytics'),
  getCommissions: () => api.get('/seller/commissions'),
  getPayouts: () => api.get('/seller/payouts'),
  getReviews: () => api.get('/seller/reviews'),
  replyToReview: (id, reply) => api.put(`/seller/reviews/${id}/reply`, { reply }),
};

export default sellerService;
