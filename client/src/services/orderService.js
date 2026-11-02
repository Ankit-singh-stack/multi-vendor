import api from './api';

const orderService = {
  preview: (payload) => api.post('/orders/preview', payload),
  createOrder: (payload) => api.post('/orders', payload),
  getMyOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  trackOrder: (id) => api.get(`/orders/${id}/track`),
  updateStatus: (id, payload) => api.put(`/orders/${id}/status`, payload),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
  requestRefund: (id, payload) => api.post(`/orders/${id}/refund`, payload),
  getMyRefunds: () => api.get('/orders/refunds/mine'),
};

export default orderService;
