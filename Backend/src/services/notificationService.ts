import { PrismaClient, Notification, NotificationType } from '@prisma/client';
import { CreateNotificationDto, UpdateNotificationDto } from '../types/notification.types';

const prisma = new PrismaClient();

export class NotificationService {
  // Create a new notification
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    return prisma.notification.create({
      data
    });
  }

  // Get notification by ID
  async getNotificationById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id }
    });
  }

  // Update notification
  async updateNotification(id: string, data: UpdateNotificationDto): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data
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

  // Get all notifications for a company
  async getCompanyNotifications(companyId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        companyId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Notification count for a company (total + unread)
  async getCompanyNotificationCount(companyId: string): Promise<{ total: number; unread: number }> {
    const [total, unread] = await Promise.all([
      prisma.notification.count({ where: { companyId } }),
      prisma.notification.count({ where: { companyId, isRead: false } }),
    ]);
    return { total, unread };
  }

  // Mark all of a company's notifications as read
  async markAllCompanyAsRead(companyId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: { companyId, isRead: false },
      data: { isRead: true },
    });
    return { count: result.count };
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
      data: { isRead: true }
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

  // Create application status notification (basic; kept for the standalone
  // /application-status endpoint). The richer, job/company-aware variant used by
  // the real status-change flow is createApplicationDecisionNotification below.
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

  // Rich candidate notification for a real decision (shortlist / accept / reject
  // / interview). Includes the job, the company, an optional company message, and
  // a link to the applicant's dashboard applications area. Called from the
  // application status-change flow when a company updates an application.
  async createApplicationDecisionNotification(params: {
    userId: string;
    status: string;
    jobTitle: string;
    companyName: string;
    reason?: string | null;
  }): Promise<Notification> {
    const { userId, status, jobTitle, companyName, reason } = params;

    let title: string;
    let message: string;
    switch (status) {
      case 'SHORTLISTED':
        title = `You've been shortlisted — ${jobTitle}`;
        message = `Your application for ${jobTitle} at ${companyName} has been shortlisted. Your application is progressing to the next stage.`;
        break;
      case 'ACCEPTED':
        title = `Application accepted — ${jobTitle}`;
        message = `Congratulations! Your application for ${jobTitle} at ${companyName} has been accepted. The team will contact you via email. Thank you for applying.`;
        break;
      case 'REJECTED':
        title = `Application update — ${jobTitle}`;
        message = `Thank you for applying for ${jobTitle} at ${companyName}. Unfortunately, your application was not selected this time. We encourage you to explore and apply for other opportunities on Talent Bridge.`;
        break;
      case 'INTERVIEW':
        title = `Interview invitation — ${jobTitle}`;
        message = `You have been invited to interview for ${jobTitle} at ${companyName}. The team will be in touch with the details.`;
        break;
      default:
        title = `Application update — ${jobTitle}`;
        message = `Your application for ${jobTitle} at ${companyName} has an update.`;
    }

    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
    if (trimmedReason) {
      message += `\n\nMessage from ${companyName}: "${trimmedReason}"`;
    }

    return this.createNotification({
      userId,
      type: NotificationType.APPLICATION_UPDATE,
      title,
      message,
      isRead: false,
      link: '/dashboard#applications',
    });
  }

  // Company notification for a newly received application. Belongs to the
  // company that owns the job (companyId), never to a user.
  async createNewApplicationNotification(params: {
    companyId: string;
    applicantName: string;
    jobTitle: string;
  }): Promise<Notification> {
    const { companyId, applicantName, jobTitle } = params;
    return this.createNotification({
      companyId,
      type: NotificationType.APPLICATION_UPDATE,
      title: `New applicant — ${jobTitle}`,
      message: `${applicantName} applied for ${jobTitle}. Open the opportunity to review the application.`,
      isRead: false,
      link: '/company/dashboard',
    });
  }
} 