import api from './api';

const deliveryService = {
  register: (payload) => api.post('/delivery/register', payload),
  getProfile: () => api.get('/delivery/profile'),
  updateProfile: (payload) => api.put('/delivery/profile', payload),
  getDashboard: () => api.get('/delivery/dashboard'),
  getOrders: (params) => api.get('/delivery/orders', { params }),
  getOrder: (id, params) => api.get(`/delivery/orders/${id}`, { params }),
  acceptAssignment: (id, subOrderId) => api.post(`/delivery/orders/${id}/accept`, { subOrderId }),
  updateStatus: (id, payload) => api.put(`/delivery/orders/${id}/status`, payload),
  getEarnings: () => api.get('/delivery/earnings'),
};

export default deliveryService;
