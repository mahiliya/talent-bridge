import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate, authenticateCompany, authenticateUser } from '../middleware/auth';

const router = Router();
const notificationController = new NotificationController();

// Notification routes require authentication. Ownership (the notification /
// :userId / :companyId must belong to the caller) is enforced in the controller.

// ---- Company-scoped feed (Company only; ownership enforced in controller) ----
// Declared before the generic "/:id" routes for clarity.
router.get('/company/:companyId', authenticateCompany, notificationController.getCompanyNotifications);
router.get('/company/:companyId/count', authenticateCompany, notificationController.getCompanyNotificationCount);
router.put('/company/:companyId/read-all', authenticateCompany, notificationController.markAllCompanyAsRead);

// Create a new notification (own account)
router.post('/', authenticateUser, notificationController.createNotification);

// Single-notification actions: authenticated as EITHER a user or a company; the
// controller authorizes the notification against whichever principal is present.
// Get notification by ID (owner only)
router.get('/:id', authenticate, notificationController.getNotificationById);

// Update notification (owner only)
router.put('/:id', authenticate, notificationController.updateNotification);

// Delete notification (owner only)
router.delete('/:id', authenticate, notificationController.deleteNotification);

// Get notifications by user (owner only)
router.get('/user/:userId', authenticateUser, notificationController.getUserNotifications);

// Get unread notifications (owner only)
router.get('/user/:userId/unread', authenticateUser, notificationController.getUnreadNotifications);

// Mark notification as read (owner only — user or company)
router.put('/:id/read', authenticate, notificationController.markAsRead);

// Mark all notifications as read (owner only)
router.put('/user/:userId/read-all', authenticateUser, notificationController.markAllAsRead);

// Get notifications by type (owner only)
router.get('/user/:userId/type', authenticateUser, notificationController.getNotificationsByType);

// Get notification count (owner only)
router.get('/user/:userId/count', authenticateUser, notificationController.getNotificationCount);

// Create match notification (own account)
router.post('/match', authenticateUser, notificationController.createMatchNotification);

// Create application status notification (own account)
router.post('/application-status', authenticateUser, notificationController.createApplicationStatusNotification);

export default router;
