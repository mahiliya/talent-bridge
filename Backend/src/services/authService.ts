import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  InvalidCredentialsError,
  InvalidEmailFormatError,
  InvalidTokenError,
  NotFoundError,
  DatabaseError,
  InvalidPasswordError,
  PasswordMismatchError,
  EmailAlreadyExistsError
  
} from '../utils/errors';
import { validateEmail ,
  validatePassword

} from '../utils/validation';

const prisma = new PrismaClient();

export class UserService {
  
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserPayload {
  id: string;
  email: string;
  type: 'user';
}

interface CompanyPayload {
  id: string;
  email: string;
  type: 'company';
}

type TokenPayload = UserPayload | CompanyPayload;

export class AuthService {
  static async login(email: string, password: string, userType: 'user' | 'company' = 'user'): Promise<{ user?: any, company?: any } & TokenPair> {
    try {
      // Email validation
      if (!email || !email.trim()) {
        throw new InvalidEmailFormatError('Email address is required.');
      }

      if (!validateEmail(email)) {
        throw new InvalidEmailFormatError('Please provide a valid email address.');
      }

      // Password validation
      if (!password) {
        throw new InvalidCredentialsError('Password is required.');
      }

      let entity;
      // Check if the entity exists and passwords match
      if (userType === 'user') {
        entity = await prisma.user.findUnique({ where: { email } });
      } else {
        entity = await prisma.company.findUnique({ where: { email } });
      }

      if (!entity) {
        throw new InvalidCredentialsError('Invalid email or password.');
      }

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, entity.password);
      if (!isPasswordValid) {
        throw new InvalidCredentialsError('Invalid email or password.');
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens({
        id: entity.id,
        email: entity.email,
        type: userType
      });

      // Return user/company data without password and tokens
      const { password: _, ...entityWithoutPassword } = entity;
      
      return {
        [userType]: entityWithoutPassword,
        accessToken,
        refreshToken
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred during login. Please try again later.');
    }
  }

  static async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const secret = process.env.JWT_REFRESH_SECRET;
      
      if (!secret) {
        throw new Error('JWT_REFRESH_SECRET is not defined in the environment');
      }

      try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, secret) as TokenPayload;
        
        // Generate new tokens
        const tokens = this.generateTokens({
          id: decoded.id,
          email: decoded.email,
          type: decoded.type
        });
        
        return tokens;
      } catch (error) {
        throw new InvalidTokenError('Invalid or expired refresh token.');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An error occurred while refreshing the token.');
    }
  }

  static async getUserDetails(userId: string) {
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
          resume: true,
          portfolioWebsite: true,
          preferredJobTypes: true,
          preferredLocations: true,
          preferredIndustries: true,
          minSalary: true,
          remotePreference: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found.`);
      }

      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving user details.');
    }
  }

  static async getCompanyDetails(companyId: string) {
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
          size: true,
          foundedYear: true,
          industry: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!company) {
        throw new NotFoundError(`Company with ID ${companyId} not found.`);
      }

      return company;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving company details.');
    }
  }

  private static generateTokens(payload: TokenPayload): TokenPair {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT secrets are not properly configured');
    }

    const accessToken = jwt.sign(payload, accessSecret, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });

    return { accessToken, refreshToken };
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

      // Email addresses are unique across both account types.
      const existingUser = await prisma.user.findUnique({ where: { email } });
      const existingCompany = await prisma.company.findUnique({ where: { email } });
      if (existingUser || existingCompany) {
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
} 
