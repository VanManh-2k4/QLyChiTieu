import * as notificationRepository from '../repositories/notificationRepository.js';

export function list(userId, { limit = 20, offset = 0, type, isRead } = {}) {
  return notificationRepository.findByUserId(userId, { limit, offset, type, isRead });
}

export function getUnreadCount(userId) {
  return notificationRepository.countUnread(userId);
}

export function createNotification({ userId, type, title, message }) {
  return notificationRepository.create({ userId, type, title, message });
}

export function markAsRead(userId, notificationId) {
  const notification = notificationRepository.findById(notificationId);
  if (!notification) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }
  if (notification.userId !== userId) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }
  return notificationRepository.markAsRead(notificationId);
}

export function markAllAsRead(userId) {
  notificationRepository.markAllAsRead(userId);
}

export function deleteNotification(userId, notificationId) {
  const notification = notificationRepository.findById(notificationId);
  if (!notification) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }
  if (notification.userId !== userId) {
    const err = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }
  notificationRepository.deleteNotification(notificationId);
}

export function deleteAll(userId) {
  notificationRepository.deleteAll(userId);
}
