import api from './api';

const wishlistService = {
  getWishlist: () => api.get('/wishlist'),
  add: (productId) => api.post('/wishlist', { productId }),
  toggle: (productId) => api.post('/wishlist/toggle', { productId }),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

export default wishlistService;
