import api from './api';

const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  setUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  getSellers: (params) => api.get('/admin/sellers', { params }),
  reviewSeller: (id, payload) => api.put(`/admin/sellers/${id}/approve`, payload),
  getProducts: (params) => api.get('/admin/products', { params }),
  getOrders: (params) => api.get('/admin/orders', { params }),
  assignDelivery: (id, payload) => api.put(`/admin/orders/${id}/assign`, payload),
  getPayments: (params) => api.get('/admin/payments', { params }),
  getRefunds: (params) => api.get('/admin/refunds', { params }),
  updateRefund: (id, payload) => api.put(`/admin/refunds/${id}`, payload),
  getDeliveryPartners: (params) => api.get('/admin/delivery-partners', { params }),
  reviewDeliveryPartner: (id, payload) => api.put(`/admin/delivery-partners/${id}/approve`, payload),
  getCommissions: (params) => api.get('/admin/commissions', { params }),
  settleCommission: (id, type) => api.put(`/admin/commissions/${id}/settle`, { type }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (payload) => api.put('/admin/settings', payload),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (payload) => api.post('/admin/coupons', payload),
  updateCoupon: (id, payload) => api.put(`/admin/coupons/${id}`, payload),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
};

export default adminService;
