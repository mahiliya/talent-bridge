import {  JobType, ExperienceLevel, TargetAudience, RemotePreference } from '@prisma/client';

export { JobType, ExperienceLevel, TargetAudience, RemotePreference };

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
  category?: string;
  workMode?: RemotePreference;
  positions?: number;
  isDraft?: boolean;
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
  category?: string;
  workMode?: RemotePreference;
  positions?: number;
  isDraft?: boolean;
  deadline?: Date;
  isActive?: boolean;
}

// Raw payload accepted from the Post Opportunity form. companyId is never
// taken from here — it is always derived from the authenticated company.
export interface CompanyJobInput {
  title?: string;
  description?: string;
  requiredSkills?: string[] | string;
  requirements?: string[] | string;
  responsibilities?: string[] | string;
  category?: string;
  location?: string;
  salary?: string;
  experienceLevel?: ExperienceLevel;
  jobType?: JobType;
  isInternship?: boolean;
  internshipDuration?: string;
  workMode?: RemotePreference;
  positions?: number | string;
  deadline?: string | Date;
  targetAudience?: TargetAudience[];
  isDraft?: boolean;
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