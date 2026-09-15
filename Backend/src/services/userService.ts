import { PrismaClient, User, JobType, RemotePreference } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from '../types/user.types';
import { 
  EmailAlreadyExistsError, 
  PasswordMismatchError,
  InvalidEmailFormatError,
  InvalidPasswordError,
  ResourceNotFoundError,
  DatabaseError,
  ValidationError
} from '../utils/errors';
import { 
  validateEmail, 
  validatePassword
} from '../utils/validation'; 
import { AppError } from '../utils/errorHandler';

const prisma = new PrismaClient();

export class UserService {
  // Create a new user (student or graduate)
  async createUser(data: CreateUserDto): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        preferredJobTypes: data.preferredJobTypes as JobType[],
        remotePreference: data.remotePreference as RemotePreference,
      },
    });
  }

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  // Update user profile
  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        preferredJobTypes: data.preferredJobTypes as JobType[],
        remotePreference: data.remotePreference as RemotePreference,
      },
    });
  }

  // Delete user
  async deleteUser(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  // Get all students
  async getAllStudents(): Promise<User[]> {
    try {
      console.log('Attempting to fetch all students from database...');
      const students = await prisma.user.findMany({
        where: {
          isStudent: true,
        },
      });
      console.log(`Successfully fetched ${students.length} students from database`);
      return students;
    } catch (error: any) {
      console.error('Database error while fetching students:', {
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      throw new DatabaseError(`Failed to fetch students: ${error.message}`);
    }
  }

  // Get all graduates
  async getAllGraduates(): Promise<User[]> {
    try {
      console.log('Attempting to fetch all graduates from database...');
      const graduates = await prisma.user.findMany({
        where: {
          isGraduate: true,
        },
      });
      console.log(`Successfully fetched ${graduates.length} graduates from database`);
      return graduates;
    } catch (error: any) {
      console.error('Database error while fetching graduates:', {
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      throw new DatabaseError(`Failed to fetch graduates: ${error.message}`);
    }
  }

  // Update user skills
  async updateUserSkills(id: string, skills: string[]): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { skills },
    });
  }

  // Update user preferences
  async updateUserPreferences(
    id: string,
    preferences: {
      preferredJobTypes?: JobType[];
      preferredIndustries?: string[];
      preferredLocations?: string[];
      minSalary?: number;
      remotePreference?: RemotePreference;
    }
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: preferences,
    });
  }

  // Verify user email
  

  // Update user resume
  async updateUserResume(id: string, resumeUrl: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { resume: resumeUrl },
    });
  }

  // Update user portfolio links
  async updateUserPortfolioLinks(
    id: string,
    links: {
      linkedInProfile?: string;
      githubProfile?: string;
      portfolioWebsite?: string;
    }
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: links,
    });
  }

  static async register(fullName: string, email: string, password: string, confirmPassword: string) {
    try {
      // Full Name Validation
      if (!fullName || !fullName.trim()) {
        throw new Error('Full name is required.');
      }

      if (fullName.trim().length < 2) {
        throw new Error('Full name must be at least 2 characters long.');
      }

      // Email Validation
      if (!email || !email.trim()) {
        throw new InvalidEmailFormatError('Email address is required.');
      }

      if (!validateEmail(email)) {
        throw new InvalidEmailFormatError('Please provide a valid email address (e.g., user@example.com).');
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

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new EmailAlreadyExistsError(`A user with email "${email}" is already registered.`);
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user in the database
      const newUser = await prisma.user.create({
        data: {
          fullName,
          email,
          password: hashedPassword,
        },
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      // Rethrow the error if it's one of our custom errors
      if (error instanceof Error) {
        throw error;
      }
      
      // Wrap unexpected errors
      throw new DatabaseError('An error occurred while registering the user. Please try again later.');
    }
  }

  static async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          university: true,
          fieldOfStudy: true,
          skills: true,
          portfolioWebsite: true,
          resume: true,
          preferredJobTypes: true,
          preferredLocations: true,
          preferredIndustries: true,
          minSalary: true,
          remotePreference: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new ResourceNotFoundError(`User with ID ${userId} not found.`);
      }

      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving the user. Please try again later.');
    }
  }

  static async updateUser(userId: string, userData: Partial<{
    fullName: string;
    phoneNumber: string;
    university: string;
    fieldOfStudy: string;
    skills: string[];
    portfolioWebsite: string;
    preferredJobTypes: JobType[];
    preferredLocations: string[];
    preferredIndustries: string[];
    minSalary: number;
    remotePreference: RemotePreference;
  }>) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!existingUser) {
        throw new ResourceNotFoundError(`User with ID ${userId} not found.`);
      }

      const remotePreferences = ['ON_SITE', 'REMOTE', 'HYBRID', 'FLEXIBLE'];
      const jobTypeAliases: Record<string, JobType> = {
        'FULL-TIME': JobType.FULL_TIME,
        'PART-TIME': JobType.PART_TIME,
        INTERNSHIP: JobType.INTERNSHIP,
        CONTRACT: JobType.CONTRACT,
        FREELANCE: JobType.FREELANCE,
      };
      const requestedJobTypes = userData.preferredJobTypes || [];
      const extractedRemotePreference = requestedJobTypes.find((value) =>
        remotePreferences.includes(String(value).toUpperCase())
      );
      const normalizedJobTypes = requestedJobTypes
        .filter((value) => !remotePreferences.includes(String(value).toUpperCase()))
        .map((value) => jobTypeAliases[String(value).toUpperCase()] || value);
      const invalidJobType = normalizedJobTypes.find((value) => !Object.values(JobType).includes(value as JobType));
      const remotePreference = userData.remotePreference || extractedRemotePreference;

      if (invalidJobType) {
        throw new ValidationError(`Unsupported job type "${invalidJobType}". Use INTERNSHIP, FULL_TIME, PART_TIME, CONTRACT, or FREELANCE.`);
      }

      if (remotePreference && !remotePreferences.includes(String(remotePreference).toUpperCase())) {
        throw new ValidationError(`Unsupported remote preference "${remotePreference}". Use ON_SITE, REMOTE, HYBRID, or FLEXIBLE.`);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...userData,
          preferredJobTypes: normalizedJobTypes as JobType[],
          remotePreference: remotePreference as RemotePreference | undefined,
          fullName: userData.fullName, // Ensure fullName is included if provided
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          university: true,
          fieldOfStudy: true,
          skills: true,
          portfolioWebsite: true,
          resume: true,
          preferredJobTypes: true,
          preferredLocations: true,
          preferredIndustries: true,
          minSalary: true,
          remotePreference: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while updating the user. Please try again later.');
    }
  }

  static async uploadResume(userId: string, resumeUrl: string) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { resume: resumeUrl },
        select: { id: true, resume: true }
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while uploading the resume. Please try again later.');
    }
  }

  static async uploadPortfolio(userId: string, portfolioUrl: string) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { portfolioWebsite: portfolioUrl },
        select: { id: true, portfolioWebsite: true }
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while uploading the portfolio. Please try again later.');
    }
  }

  static async updateSkills(userId: string, skills: string[]) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { skills },
        select: { id: true, skills: true }
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while updating skills. Please try again later.');
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }
}
