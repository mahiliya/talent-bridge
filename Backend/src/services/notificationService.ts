import { PrismaClient, Notification, NotificationType } from '@prisma/client';
import { CreateNotificationDto, UpdateNotificationDto } from '../types/notification.types';

const prisma = new PrismaClient();

export class NotificationService {
  // Create a new notification
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    return prisma.notification.create({
      data,
      include: {
        user: true
      }
    });
  }

  // Get notification by ID
  async getNotificationById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id },
      include: {
        user: true
      }
    });
  }

  // Update notification
  async updateNotification(id: string, data: UpdateNotificationDto): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data,
      include: {
        user: true
      }
    });
  }

  // Delete notification
  async deleteNotification(id: string): Promise<Notification> {
    return prisma.notification.delete({
      where: { id }
    });
  }

  // Get all notifications for a user
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Get unread notifications for a user
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        isRead: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Mark notification as read
  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        user: true
      }
    });
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    });

    return { count: result.count };
  }

  // Get notifications by type
  async getNotificationsByType(userId: string, type: NotificationType): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        type
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Get notification count for a user
  async getNotificationCount(userId: string): Promise<{ total: number; unread: number }> {
    const [total, unread] = await Promise.all([
      prisma.notification.count({
        where: { userId }
      }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      })
    ]);

    return { total, unread };
  }

  // Create match notification
  async createMatchNotification(userId: string, matchScore: number): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.NEW_MATCH,
      title: 'New Job Match!',
      message: `We found a job that matches your profile with a ${matchScore}% match score.`,
      isRead: false
    });
  }

  // Create application status notification
  async createApplicationStatusNotification(
    userId: string,
    status: string
  ): Promise<Notification> {
    const title = 'Application Status Update';
    let message = '';

    switch (status) {
      case 'REVIEWING':
        message = 'Your application is being reviewed.';
        break;
      case 'SHORTLISTED':
        message = 'Congratulations! You have been shortlisted for this position.';
        break;
      case 'INTERVIEWING':
        message = 'You have been selected for an interview.';
        break;
      case 'OFFERED':
        message = 'Congratulations! You have received a job offer.';
        break;
      case 'ACCEPTED':
        message = 'Your application has been accepted.';
        break;
      case 'REJECTED':
        message = 'We regret to inform you that your application was not successful.';
        break;
      default:
        message = `Your application status has been updated to ${status}.`;
    }

    return this.createNotification({
      userId,
      type: NotificationType.APPLICATION_UPDATE,
      title,
      message,
      isRead: false
    });
  }
} 