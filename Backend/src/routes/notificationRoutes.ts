import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';

const router = Router();
const notificationController = new NotificationController();

// Create a new notification
router.post('/', notificationController.createNotification);

// Get notification by ID
router.get('/:id', notificationController.getNotificationById);

// Update notification
router.put('/:id', notificationController.updateNotification);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Get notifications by user
router.get('/user/:userId', notificationController.getUserNotifications);

// Get unread notifications
router.get('/user/:userId/unread', notificationController.getUnreadNotifications);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/user/:userId/read-all', notificationController.markAllAsRead);

// Get notifications by type
router.get('/user/:userId/type', notificationController.getNotificationsByType);

// Get notification count
router.get('/user/:userId/count', notificationController.getNotificationCount);

// Create match notification
router.post('/match', notificationController.createMatchNotification);

// Create application status notification
router.post('/application-status', notificationController.createApplicationStatusNotification);

export default router;
