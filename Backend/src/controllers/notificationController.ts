import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { CreateNotificationDto, UpdateNotificationDto } from '../types/notification.types';


export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // Create a new notification
  createNotification = async (req: Request, res: Response) => {
    try {
      const notificationData = req.body as CreateNotificationDto;
      const notification = await this.notificationService.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get notification by ID
  getNotificationById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
     const notification = await this.notificationService.getNotificationById(String(id));
      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
      } else {
        res.json(notification);
      }
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Update notification
  updateNotification = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notificationData = req.body as UpdateNotificationDto;
      const notification = await this.notificationService.updateNotification(String(id), notificationData);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Delete notification
  deleteNotification = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.deleteNotification(String(id));
      res.json({ message: 'Notification deleted successfully', notification });
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };


  // Get notifications by user
  getUserNotifications = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const notifications = await this.notificationService.getUserNotifications(String(userId));
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get unread notifications
  getUnreadNotifications = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const notifications = await this.notificationService.getUnreadNotifications(String(userId));
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Mark notification as read
  markAsRead = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.markAsRead(String(id));
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Mark all notifications as read
  markAllAsRead = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const notifications = await this.notificationService.markAllAsRead(String(userId));
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get notifications by type
  getNotificationsByType = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { type } = req.query;
      const notifications = await this.notificationService.getNotificationsByType(String(userId), type as any);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get notification count
  getNotificationCount = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
     const count = await this.notificationService.getNotificationCount(String(userId));
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Create match notification
  createMatchNotification = async (req: Request, res: Response) => {
    try {
      const { userId, matchScore } = req.body;
      const notification = await this.notificationService.createMatchNotification(userId, matchScore);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Create application status notification
  createApplicationStatusNotification = async (req: Request, res: Response) => {
    try {
      const { userId, status } = req.body;
      const notification = await this.notificationService.createApplicationStatusNotification(userId, status);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };
} 