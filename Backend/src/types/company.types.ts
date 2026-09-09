import {  CompanySize } from '@prisma/client';

export interface CreateCompanyDto {
  name: string;
  email: string;
  password: string;
  website?: string;
  description: string;
  industry: string;
  size: CompanySize;
  location: string;
  logo?: string;
  foundedYear?: number;
  employeeCount?: number;
  headquarters?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  isVerified?: boolean;
  verificationToken?: string;
}

export interface UpdateCompanyDto {
  name?: string;
  email?: string;
  password?: string;
  website?: string;
  description?: string;
  industry?: string;
  size?: CompanySize;
  location?: string;
  logo?: string;
  foundedYear?: number;
  employeeCount?: number;
  headquarters?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  isVerified?: boolean;
  verificationToken?: string;
}

export interface CompanyResponse {
  id: string;
  name: string;
  email: string;
  logo?: string;
  website?: string;
  industry: string;
  size: CompanySize;
  foundedYear?: number;
  description?: string;
  location: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
} 