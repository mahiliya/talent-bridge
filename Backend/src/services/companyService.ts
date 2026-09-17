import { PrismaClient, Company, CompanySize } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  EmailAlreadyExistsError,
  PasswordMismatchError,
  InvalidEmailFormatError,
  InvalidPasswordError,
  CompanyNameRequiredError,
  ValidationError,
  ResourceNotFoundError,
  DatabaseError
} from '../utils/errors';
import {
  validateEmail,
  validatePassword,
  validateCompanyName
} from '../utils/validation';
import { CreateCompanyDto, RegisterCompanyDto } from '../types/company.types';
import { COMPANY_SAFE_SELECT, USER_SAFE_SELECT } from '../utils/safeSelect';

const prisma = new PrismaClient();

export class CompanyService {
  static async register(data: RegisterCompanyDto) {
    try {
      const name = String(data.name ?? '').trim();
      // Stored as-typed (trimmed) to match the existing user flow and the
      // login lookup, which does not normalize case.
      const email = String(data.email ?? '').trim();
      const { password, confirmPassword } = data;
      const industry = String(data.industry ?? '').trim();
      const location = String(data.location ?? '').trim();
      const phoneNumber = data.phoneNumber ? String(data.phoneNumber).trim() : '';
      const companyType = data.companyType ? String(data.companyType).trim() : '';
      const website = data.website ? String(data.website).trim() : null;

      // Company Name Validation
      if (!name) {
        throw new CompanyNameRequiredError('Company name is required.');
      }
      if (!validateCompanyName(name)) {
        throw new ValidationError('Company name must be at least 2 characters long.');
      }

      // Email Validation
      if (!email) {
        throw new InvalidEmailFormatError('Email address is required.');
      }
      if (!validateEmail(email)) {
        throw new InvalidEmailFormatError('Please provide a valid email address (e.g., company@example.com).');
      }

      // Password Validation
      if (!password) {
        throw new InvalidPasswordError('Password is required.');
      }
      if (!validatePassword(password)) {
        throw new InvalidPasswordError('Password must be at least 8 characters long.');
      }

      // Confirm Password
      if (password !== confirmPassword) {
        throw new PasswordMismatchError('Password and confirmation password do not match.');
      }

      // Other required registration fields
      if (!industry) {
        throw new ValidationError('Industry is required.');
      }
      if (!companyType) {
        throw new ValidationError('Company type is required.');
      }
      if (!location) {
        throw new ValidationError('Location is required.');
      }
      if (!phoneNumber) {
        throw new ValidationError('Phone number is required.');
      }

      // Email addresses are unique across BOTH account types, so a company
      // cannot claim an email already used by a user (or another company).
      const [existingCompany, existingUser] = await Promise.all([
        prisma.company.findUnique({ where: { email } }),
        prisma.user.findUnique({ where: { email } }),
      ]);
      if (existingCompany || existingUser) {
        throw new EmailAlreadyExistsError(`An account with email "${email}" is already registered.`);
      }

      // Hash the password with the same implementation used everywhere else.
      const hashedPassword = await bcrypt.hash(password, 10);

      // Company size is captured later during profile completion; default it so
      // the required column is satisfied at registration time.
      const size: CompanySize = data.size ?? CompanySize.SMALL;

      const newCompany = await prisma.company.create({
        data: {
          name,
          email,
          password: hashedPassword,
          industry,
          location,
          phoneNumber,
          companyType,
          website,
          size,
          isVerified: false,
        },
      });

      // Return company without password
      const { password: _, ...companyWithoutPassword } = newCompany;
      return companyWithoutPassword;
    } catch (error) {
      // Rethrow the error if it's one of our custom errors
      if (error instanceof Error) {
        throw error;
      }

      // Wrap unexpected errors
      throw new DatabaseError('An error occurred while registering the company. Please try again later.');
    }
  }

  static async getCompanyById(companyId: string) {
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          email: true,
          description: true,
          location: true,
          website: true,
          industry: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!company) {
        throw new ResourceNotFoundError(`Company with ID ${companyId} not found.`);
      }

      return company;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving the company. Please try again later.');
    }
  }

  static async updateCompany(companyId: string, companyData: Partial<{
    name: string;
    description: string;
    location: string;
    website: string;
    industry: string;
    contactPerson: string;
    phoneNumber: string;
  }>) {
    try {
      // Check if company exists
      const existingCompany = await prisma.company.findUnique({ where: { id: companyId } });
      if (!existingCompany) {
        throw new ResourceNotFoundError(`Company with ID ${companyId} not found.`);
      }

      // Update company
      const updatedCompany = await prisma.company.update({
        where: { id: companyId },
        data: companyData,
        select: {
          id: true,
          name: true,
          email: true,
          description: true,
          location: true,
          website: true,
          industry: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return updatedCompany;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while updating the company. Please try again later.');
    }
  }

  static async getCompanyJobs(companyId: string) {
    try {
      // Check if company exists
      const company = await prisma.company.findUnique({ 
        where: { id: companyId } 
      });

      if (!company) {
        throw new ResourceNotFoundError(`Company with ID ${companyId} not found.`);
      }

      // Get all jobs for this company
      const jobs = await prisma.job.findMany({
        where: { companyId }
      });

      return jobs;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving company jobs. Please try again later.');
    }
  }

  // Create a new company
  async createCompany(data: CreateCompanyDto) {
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create company with hashed password. The response never includes the
      // password hash or refresh/verification tokens.
      return prisma.company.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          industry: data.industry,
          size: data.size,
          location: data.location,
          logo: data.logo,
          website: data.website,
          foundedYear: data.foundedYear,
          description: data.description,
        },
        select: COMPANY_SAFE_SELECT,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while creating the company. Please try again later.');
    }
  }

  // Get company by email
  async getCompanyByEmail(email: string): Promise<Company | null> {
    return prisma.company.findUnique({
      where: { email },
    });
  }

  // Get company by name
  async getCompanyByName(name: string) {
    return prisma.company.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive'
        }
      },
      select: COMPANY_SAFE_SELECT,
    });
  }

  // Delete company
  async deleteCompany(id: string) {
    return prisma.company.delete({
      where: { id },
      select: COMPANY_SAFE_SELECT,
    });
  }

  // Get all companies
  async getAllCompanies() {
    return prisma.company.findMany({
      select: { ...COMPANY_SAFE_SELECT, jobs: true },
    });
  }

  // Get companies by size
  async getCompaniesBySize(size: CompanySize) {
    return prisma.company.findMany({
      where: { size },
      select: { ...COMPANY_SAFE_SELECT, jobs: true },
    });
  }

  // Get companies by industry
  async getCompaniesByIndustry(industry: string) {
    return prisma.company.findMany({
      where: { industry },
      select: { ...COMPANY_SAFE_SELECT, jobs: true },
    });
  }

  // Update company logo
  async updateCompanyLogo(id: string, logoUrl: string) {
    return prisma.company.update({
      where: { id },
      data: { logo: logoUrl },
      select: COMPANY_SAFE_SELECT,
    });
  }

  // Get company's active jobs
  async getCompanyActiveJobs(id: string) {
    return prisma.job.findMany({
      where: {
        companyId: id,
        isActive: true,
      },
    });
  }

  // Get company's job applications. The applicant relation is projected with a
  // password-free select so no password hash is ever returned.
  async getCompanyJobApplications(id: string) {
    return prisma.application.findMany({
      where: {
        job: {
          companyId: id,
        },
      },
      include: {
        job: true,
        applicant: { select: USER_SAFE_SELECT },
      },
    });
  }
} 