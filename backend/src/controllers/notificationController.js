import * as notificationService from '../services/notificationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0, type, isRead } = req.query;
  const result = notificationService.list(req.user.id, { 
    limit: parseInt(limit), 
    offset: parseInt(offset),
    type,
    isRead: isRead !== undefined ? parseInt(isRead) : undefined
  });
  res.json(result);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = notificationService.getUnreadCount(req.user.id);
  res.json({ count });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = notificationService.markAsRead(req.user.id, parseInt(id));
  res.json(notification);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  notificationService.markAllAsRead(req.user.id);
  res.json({ message: 'All notifications marked as read' });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  notificationService.deleteNotification(req.user.id, parseInt(id));
  res.json({ message: 'Notification deleted' });
});

export const deleteAll = asyncHandler(async (req, res) => {
  notificationService.deleteAll(req.user.id);
  res.json({ message: 'All notifications deleted' });
});
