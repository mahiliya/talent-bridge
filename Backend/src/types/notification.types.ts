import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  // A notification targets EITHER a user (candidate) or a company. Exactly one
  // of userId / companyId is set.
  userId?: string;
  companyId?: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead?: boolean;
  link?: string;
}

export interface UpdateNotificationDto {
  title?: string;
  message?: string;
  type?: NotificationType;
  isRead?: boolean;
  link?: string;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  jobId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  job?: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
      logo?: string;
    };
  };
} 