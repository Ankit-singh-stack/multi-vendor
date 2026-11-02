import api from './api';

const reviewService = {
  create: (payload) => api.post('/reviews', payload),
  forProduct: (productId, params) => api.get(`/reviews/${productId}`, { params }),
  remove: (id) => api.delete(`/reviews/${id}`),
};

export default reviewService;
