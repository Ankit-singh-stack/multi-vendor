import api from './api';

const paymentService = {
  getConfig: () => api.get('/payments/config'),
  createPayment: (orderId) => api.post('/payments/create', { orderId }),
  verifyPayment: (payload) => api.post('/payments/verify', payload),
  markFailed: (orderId, reason) => api.post('/payments/failed', { orderId, reason }),
  getByOrder: (orderId) => api.get(`/payments/order/${orderId}`),
};

export default paymentService;
