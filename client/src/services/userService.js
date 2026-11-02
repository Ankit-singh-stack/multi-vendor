import api from './api';

const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (formData) =>
    api.put('/users/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (payload) => api.put('/users/change-password', payload),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (payload) => api.post('/users/addresses', payload),
  updateAddress: (id, payload) => api.put(`/users/addresses/${id}`, payload),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
};

export default userService;
