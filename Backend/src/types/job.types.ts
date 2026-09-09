import {  JobType, ExperienceLevel, TargetAudience } from '@prisma/client';

export { JobType, ExperienceLevel, TargetAudience };

export interface CreateJobDto {
  companyId: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  location: string;
  salary?: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  isInternship?: boolean;
  internshipDuration?: string;
  targetAudience: TargetAudience[];
  deadline: Date;
  isActive?: boolean;
}

export interface UpdateJobDto {
  title?: string;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  location?: string;
  salary?: string;
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  isInternship?: boolean;
  internshipDuration?: string;
  targetAudience?: TargetAudience[];
  deadline?: Date;
  isActive?: boolean;
}

export interface JobResponse {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  location: string;
  salary?: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  isInternship: boolean;
  internshipDuration?: string;
  targetAudience: TargetAudience[];
  postedAt: Date;
  deadline: Date;
  isActive: boolean;
  company?: {
    id: string;
    name: string;
    logo?: string;
    industry: string;
    location: string;
  };
  applications?: {
    id: string;
    applicantId: string;
    status: string;
    appliedAt: Date;
  }[];
} 