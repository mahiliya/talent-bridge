import { PrismaClient, Company, CompanySize } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { 
  EmailAlreadyExistsError, 
  PasswordMismatchError,
  InvalidEmailFormatError,
  InvalidPasswordError,
  CompanyNameRequiredError,
  ResourceNotFoundError,
  DatabaseError
} from '../utils/errors';
import { 
  validateEmail, 
  validatePassword, 
  validateCompanyName
} from '../utils/validation';
import { CreateCompanyDto } from '../types/company.types';

const prisma = new PrismaClient();

export class CompanyService {
  static async register(
    name: string, 
    email: string, 
    password: string, 
    confirmPassword: string,
    industry: string,
    size: CompanySize,
    location: string
  ) {
    try {
      // Company Name Validation
      if (!name || !name.trim()) {
        throw new CompanyNameRequiredError('Company name is required.');
      }

      if (!validateCompanyName(name)) {
        throw new Error('Company name must be at least 2 characters long.');
      }

      // Email Validation
      if (!email || !email.trim()) {
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

      // Check if company already exists
      const existingCompany = await prisma.company.findUnique({ where: { email } });
      if (existingCompany) {
        throw new EmailAlreadyExistsError(`A company with email "${email}" is already registered.`);
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new company in the database
      const newCompany = await prisma.company.create({
        data: {
          name,
          email,
          password: hashedPassword,
          industry,
          size,
          location,
          isVerified: false
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
  async createCompany(data: CreateCompanyDto): Promise<Company> {
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create company with hashed password
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
  async getCompanyByName(name: string): Promise<Company | null> {
    return prisma.company.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive'
        }
      }
    });
  }

  // Delete company
  async deleteCompany(id: string): Promise<Company> {
    return prisma.company.delete({
      where: { id },
    });
  }

  // Get all companies
  async getAllCompanies(): Promise<Company[]> {
    return prisma.company.findMany({
      include: {
        jobs: true,
      },
    });
  }

  // Get companies by size
  async getCompaniesBySize(size: CompanySize): Promise<Company[]> {
    return prisma.company.findMany({
      where: { size },
      include: {
        jobs: true,
      },
    });
  }

  // Get companies by industry
  async getCompaniesByIndustry(industry: string): Promise<Company[]> {
    return prisma.company.findMany({
      where: { industry },
      include: {
        jobs: true,
      },
    });
  }

  // Update company logo
  async updateCompanyLogo(id: string, logoUrl: string): Promise<Company> {
    return prisma.company.update({
      where: { id },
      data: { logo: logoUrl },
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

  // Get company's job applications
  async getCompanyJobApplications(id: string) {
    return prisma.application.findMany({
      where: {
        job: {
          companyId: id,
        },
      },
      include: {
        job: true,
        applicant: true,
      },
    });
  }
} 