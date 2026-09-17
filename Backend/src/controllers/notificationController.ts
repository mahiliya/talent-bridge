import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { CreateNotificationDto, UpdateNotificationDto } from '../types/notification.types';


export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // A user may only act on their own user-scoped notification routes.
  private ensureOwnUser(req: Request, res: Response): boolean {
    if (!req.user || req.user.id !== String(req.params.userId)) {
      res.status(403).json({ error: 'You can only access your own notifications.' });
      return false;
    }
    return true;
  }

  // A company may only act on its own company-scoped notification routes.
  private ensureOwnCompany(req: Request, res: Response): boolean {
    if (!req.company || req.company.id !== String(req.params.companyId)) {
      res.status(403).json({ error: 'You can only access your own notifications.' });
      return false;
    }
    return true;
  }

  // Authorize a single notification by id: it must belong to the authenticated
  // principal — the owning user OR the owning company. Returns the notification,
  // or null after sending a 404/403 response.
  private async authorizeNotification(req: Request, res: Response, id: string) {
    const notification = await this.notificationService.getNotificationById(id);
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return null;
    }
    const ownedByUser = Boolean(req.user && notification.userId === req.user.id);
    const ownedByCompany = Boolean(req.company && notification.companyId === req.company.id);
    if (!ownedByUser && !ownedByCompany) {
      res.status(403).json({ error: 'You can only access your own notifications.' });
      return null;
    }
    return notification;
  }

  // Create a new notification (only for the authenticated user)
  createNotification = async (req: Request, res: Response) => {
    if (!req.user || String(req.body?.userId) !== req.user.id) {
      return res.status(403).json({ error: 'You can only create notifications for your own account.' });
    }
    try {
      const notificationData = req.body as CreateNotificationDto;
      const notification = await this.notificationService.createNotification(notificationData);
      return res.status(201).json(notification);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get notification by ID (owner only)
  getNotificationById = async (req: Request, res: Response) => {
    try {
      const notification = await this.authorizeNotification(req, res, String(req.params.id));
      if (!notification) return;
      return res.json(notification);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Update notification (owner only)
  updateNotification = async (req: Request, res: Response) => {
    try {
      const existing = await this.authorizeNotification(req, res, String(req.params.id));
      if (!existing) return;
      const notificationData = req.body as UpdateNotificationDto;
      const notification = await this.notificationService.updateNotification(String(req.params.id), notificationData);
      return res.json(notification);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Delete notification (owner only)
  deleteNotification = async (req: Request, res: Response) => {
    try {
      const existing = await this.authorizeNotification(req, res, String(req.params.id));
      if (!existing) return;
      const notification = await this.notificationService.deleteNotification(String(req.params.id));
      return res.json({ message: 'Notification deleted successfully', notification });
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };


  // Get notifications by user (owner only)
  getUserNotifications = async (req: Request, res: Response) => {
    if (!this.ensureOwnUser(req, res)) return;
    try {
      const notifications = await this.notificationService.getUserNotifications(String(req.params.userId));
      return res.json(notifications);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get unread notifications (owner only)
  getUnreadNotifications = async (req: Request, res: Response) => {
    if (!this.ensureOwnUser(req, res)) return;
    try {
      const notifications = await this.notificationService.getUnreadNotifications(String(req.params.userId));
      return res.json(notifications);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Mark notification as read (owner only)
  markAsRead = async (req: Request, res: Response) => {
    try {
      const existing = await this.authorizeNotification(req, res, String(req.params.id));
      if (!existing) return;
      const notification = await this.notificationService.markAsRead(String(req.params.id));
      return res.json(notification);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Mark all notifications as read (owner only)
  markAllAsRead = async (req: Request, res: Response) => {
    if (!this.ensureOwnUser(req, res)) return;
    try {
      const notifications = await this.notificationService.markAllAsRead(String(req.params.userId));
      return res.json(notifications);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get notifications by type (owner only)
  getNotificationsByType = async (req: Request, res: Response) => {
    if (!this.ensureOwnUser(req, res)) return;
    try {
      const { type } = req.query;
      const notifications = await this.notificationService.getNotificationsByType(String(req.params.userId), type as any);
      return res.json(notifications);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get notification count (owner only)
  getNotificationCount = async (req: Request, res: Response) => {
    if (!this.ensureOwnUser(req, res)) return;
    try {
      const count = await this.notificationService.getNotificationCount(String(req.params.userId));
      return res.json({ count });
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Create match notification (only for the authenticated user)
  createMatchNotification = async (req: Request, res: Response) => {
    const { userId, matchScore } = req.body;
    if (!req.user || String(userId) !== req.user.id) {
      return res.status(403).json({ error: 'You can only create notifications for your own account.' });
    }
    try {
      const notification = await this.notificationService.createMatchNotification(userId, matchScore);
      return res.status(201).json(notification);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Create application status notification (only for the authenticated user)
  createApplicationStatusNotification = async (req: Request, res: Response) => {
    const { userId, status } = req.body;
    if (!req.user || String(userId) !== req.user.id) {
      return res.status(403).json({ error: 'You can only create notifications for your own account.' });
    }
    try {
      const notification = await this.notificationService.createApplicationStatusNotification(userId, status);
      return res.status(201).json(notification);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // ---- Company-scoped notification feed (owner only) ----

  // Get notifications for a company (owner only)
  getCompanyNotifications = async (req: Request, res: Response) => {
    if (!this.ensureOwnCompany(req, res)) return;
    try {
      const notifications = await this.notificationService.getCompanyNotifications(String(req.params.companyId));
      return res.json(notifications);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get company notification count (owner only)
  getCompanyNotificationCount = async (req: Request, res: Response) => {
    if (!this.ensureOwnCompany(req, res)) return;
    try {
      const count = await this.notificationService.getCompanyNotificationCount(String(req.params.companyId));
      return res.json({ count });
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Mark all of a company's notifications as read (owner only)
  markAllCompanyAsRead = async (req: Request, res: Response) => {
    if (!this.ensureOwnCompany(req, res)) return;
    try {
      const result = await this.notificationService.markAllCompanyAsRead(String(req.params.companyId));
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };
}
