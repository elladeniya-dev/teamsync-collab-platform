import * as notificationService from '../services/notificationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const result = await notificationService.getNotifications(userId);
  res.status(200).json(result);
});

export const createNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification(req.body);
  res.status(201).json(notification);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id);
  res.status(200).json(notification);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const result = await notificationService.markAllAsRead(userId);
  res.status(200).json({ success: true, ...result });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id);
  res.status(200).json({ success: true, message: 'Notification deleted successfully' });
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const result = await notificationService.clearAllNotifications(userId);
  res.status(200).json({ success: true, ...result });
});
