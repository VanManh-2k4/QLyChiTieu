import api from './api.js';

export const notificationService = {
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  async getNotificationsFiltered(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },

  async markAsRead(id) {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  async deleteNotification(id) {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  async deleteAll() {
    const response = await api.delete('/notifications');
    return response.data;
  },
};
