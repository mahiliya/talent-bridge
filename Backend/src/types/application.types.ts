import { ApplicationStatus as PrismaApplicationStatus } from '@prisma/client';

// Use the Prisma ApplicationStatus enum instead of defining our own
export type ApplicationStatus = PrismaApplicationStatus;

export interface CreateApplicationDto {
  userId: string;
  jobId: string;
  coverLetter?: string;
  resumeUrl?: string;
  status?: ApplicationStatus;
}

export interface UpdateApplicationDto {
  coverLetter?: string;
  resumeUrl?: string;
  status?: ApplicationStatus;
}

export interface ApplicationResponse {
  id: string;
  applicantId: string;
  jobId: string;
  coverLetter?: string;
  resumeUrl?: string;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
  job?: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
      logo?: string;
    };
  };
  applicant?: {
    id: string;
    fullName: string;
    email: string;
  };
} 