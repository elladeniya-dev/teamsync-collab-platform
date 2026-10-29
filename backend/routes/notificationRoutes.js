import express from 'express';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

// Read all notifications & create notification
router.get('/', getNotifications);
router.post('/', createNotification);

// Mark all as read
router.patch('/read-all', markAllAsRead);

// Clear all notifications
router.delete('/', clearAllNotifications);

// Single notification actions
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
