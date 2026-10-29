import Notification from '../models/Notification.js';
import Task from '../models/Task.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Check upcoming deadlines and automatically generate deadline alerts
 */
export const checkDeadlineAlerts = async () => {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    // Find tasks due within the next 24 hours or recently overdue
    const imminentTasks = await Task.find({
      deadline: { $gte: now, $lte: in24Hours },
    }).limit(10);

    for (const task of imminentTasks) {
      // Check if we already alerted for this task within the last 12 hours
      const existingAlert = await Notification.findOne({
        type: 'deadline',
        'metadata.taskId': task._id.toString(),
        createdAt: { $gte: twelveHoursAgo },
      });

      if (!existingAlert) {
        const hoursLeft = Math.max(
          1,
          Math.round((new Date(task.deadline) - now) / (1000 * 60 * 60))
        );
        await Notification.create({
          title: 'Deadline Approaching',
          message: `"${task.title}" is due in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}! (${task.assignee || 'Unassigned'})`,
          type: 'deadline',
          priority: 'urgent',
          link: '/calendar',
          metadata: { taskId: task._id.toString() },
        });
      }
    }
  } catch (err) {
    console.error('Error checking deadline alerts:', err.message);
  }
};

/**
 * Fetch notifications with unread count
 */
export const getNotifications = async (userId = null) => {
  // Check for upcoming deadline alerts proactively
  await checkDeadlineAlerts();

  const query = userId
    ? { $or: [{ user: userId }, { user: null }] }
    : {};

  let notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(50);

  // If no notifications exist yet, seed standard workspace welcome notifications
  if (notifications.length === 0) {
    await Notification.create([
      {
        title: 'Welcome to TeamSync PRO',
        message: 'Your high-velocity sprint workspace is ready. Track tasks, schedules, and team workload in real time.',
        type: 'system',
        priority: 'medium',
        link: '/tasks',
      },
      {
        title: 'Google Identity Connected',
        message: 'Google OAuth and unified account linking are active for instant collaborator access.',
        type: 'system',
        priority: 'low',
        link: '/team',
      },
    ]);

    notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
  }

  const unreadCount = await Notification.countDocuments({
    ...query,
    read: false,
  });

  return {
    notifications,
    unreadCount,
    total: notifications.length,
  };
};

/**
 * Create a new notification
 */
export const createNotification = async (notificationData) => {
  return await Notification.create(notificationData);
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (id) => {
  const notification = await Notification.findByIdAndUpdate(
    id,
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, `Notification not found with id: ${id}`);
  }

  return notification;
};

/**
 * Mark all matching notifications as read
 */
export const markAllAsRead = async (userId = null) => {
  const query = userId
    ? { $or: [{ user: userId }, { user: null }], read: false }
    : { read: false };

  const result = await Notification.updateMany(query, { read: true });
  return { updatedCount: result.modifiedCount };
};

/**
 * Delete a single notification
 */
export const deleteNotification = async (id) => {
  const notification = await Notification.findByIdAndDelete(id);
  if (!notification) {
    throw new ApiError(404, `Notification not found with id: ${id}`);
  }
  return notification;
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (userId = null) => {
  const query = userId
    ? { $or: [{ user: userId }, { user: null }] }
    : {};

  const result = await Notification.deleteMany(query);
  return { deletedCount: result.deletedCount };
};
