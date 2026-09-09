import { JobType, RemotePreference } from '@prisma/client';

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  isStudent: boolean;
  isGraduate: boolean;
  university?: string;
  degree?: string;
  fieldOfStudy?: string;
  currentYear?: number;
  expectedGraduation?: Date;
  skills?: string[];
  preferredJobTypes?: JobType[];
  preferredIndustries?: string[];
  preferredLocations?: string[];
  minSalary?: number;
  remotePreference?: RemotePreference;
  resume?: string;
  linkedInProfile?: string;
  githubProfile?: string;
  portfolioWebsite?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  password?: string;
  university?: string;
  degree?: string;
  fieldOfStudy?: string;
  currentYear?: number;
  expectedGraduation?: Date;
  skills?: string[];
  preferredJobTypes?: JobType[];
  preferredIndustries?: string[];
  preferredLocations?: string[];
  minSalary?: number;
  remotePreference?: RemotePreference;
  resume?: string;
  linkedInProfile?: string;
  githubProfile?: string;
  portfolioWebsite?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isStudent: boolean;
  isGraduate: boolean;
  university?: string;
  degree?: string;
  fieldOfStudy?: string;
  currentYear?: number;
  expectedGraduation?: Date;
  graduationYear?: number;
  skills?: string[];
  preferredJobTypes?: string[];
  preferredIndustries?: string[];
  preferredLocations?: string[];
  minSalary?: number;
  remotePreference?: string;
  resume?: string;
  linkedInProfile?: string;
  githubProfile?: string;
  portfolioWebsite?: string;
  createdAt: Date;
  updatedAt: Date;
} 