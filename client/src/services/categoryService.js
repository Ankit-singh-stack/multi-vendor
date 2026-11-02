import api from './api';

const categoryService = {
  getCategories: (params) => api.get('/categories', { params }),
  getCategory: (id) => api.get(`/categories/${id}`),
  createCategory: (data, isFormData = false) =>
    api.post('/categories', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  updateCategory: (id, data, isFormData = false) =>
    api.put(`/categories/${id}`, data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export default categoryService;
