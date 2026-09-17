import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { UpdateUserDto } from '../types/user.types';
import {
  EmailAlreadyExistsError,
  PasswordMismatchError,
  InvalidEmailFormatError,
  InvalidPasswordError,
  ResourceNotFoundError,
  DatabaseError,
  ValidationError
} from '../utils/errors';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  private ensureOwnProfile(req: Request, res: Response): boolean {
    if (!req.user || String(req.params.id) !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'You can only access your own user profile.',
        error: 'PROFILE_ACCESS_FORBIDDEN'
      });
      return false;
    }
    return true;
  }

  // Register a new user
  register = async (req: Request, res: Response) => {
    try {
      console.log('Attempting to register new user...');
      const { fullName, email, password, confirmPassword } = req.body;
      const user = await UserService.register(fullName, email, password, confirmPassword);
      console.log('User registered successfully:', email);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user }
      });
    } catch (error: any) {
      console.error('Registration error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (error instanceof EmailAlreadyExistsError) {
        res.status(409).json({
          success: false,
          message: error.message,
          error: 'EMAIL_ALREADY_EXISTS'
        });
      } else if (error instanceof PasswordMismatchError) {
        res.status(400).json({
          success: false,
          message: error.message,
          error: 'PASSWORD_MISMATCH'
        });
      } else if (error instanceof InvalidEmailFormatError) {
        res.status(400).json({
          success: false,
          message: error.message,
          error: 'INVALID_EMAIL'
        });
      } else if (error instanceof InvalidPasswordError) {
        res.status(400).json({
          success: false,
          message: error.message,
          error: 'INVALID_PASSWORD'
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Registration failed: ${error.message || 'Unknown error occurred'}`,
          error: 'INTERNAL_SERVER_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  };

  // Get user by ID
  getUserById = async (req: Request, res: Response) => {
    if (!this.ensureOwnProfile(req, res)) return;
    try {
      console.log('Fetching user by ID:', req.params.id);
      const user = await UserService.getUserById(String(req.params.id));
      console.log('User found successfully');
      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error: any) {
      console.error('Error fetching user:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message,
          error: 'USER_NOT_FOUND'
        });
      } else if (error instanceof DatabaseError) {
        res.status(500).json({
          success: false,
          message: `Database error while fetching user: ${error.message}`,
          error: 'DATABASE_ERROR'
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message,
          error: 'INVALID_PROFILE_PREFERENCE'
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to fetch user: ${error.message || 'Unknown error occurred'}`,
          error: 'INTERNAL_SERVER_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  };

  // Update user profile
  updateUser = async (req: Request, res: Response) => {
    if (!this.ensureOwnProfile(req, res)) return;
    try {
      console.log('Updating user profile:', req.params.id);
      const userData = req.body as UpdateUserDto;
      const updatedUser = await UserService.updateUser(String(req.params.id), userData);
      console.log('User profile updated successfully');
      res.status(200).json({
        success: true,
        message: 'User profile updated successfully',
        data: { user: updatedUser }
      });
    } catch (error: any) {
      console.error('Error updating user:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message,
          error: 'USER_NOT_FOUND'
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message,
          error: 'INVALID_PROFILE_PREFERENCE'
        });
      } else if (error instanceof DatabaseError) {
        res.status(500).json({
          success: false,
          message: `Database error while updating user: ${error.message}`,
          error: 'DATABASE_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to update user: ${error.message || 'Unknown error occurred'}`,
          error: 'INTERNAL_SERVER_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  };

  // Upload resume
  uploadResume = async (req: Request, res: Response) => {
    if (!this.ensureOwnProfile(req, res)) return;
    try {
      console.log('Uploading resume for user:', req.params.id);
      const resumeUrl = req.body.resumeUrl;
      const updatedUser = await UserService.uploadResume(String(req.params.id), resumeUrl);
      console.log('Resume uploaded successfully');
      res.status(200).json({
        success: true,
        message: 'Resume uploaded successfully',
        data: { user: updatedUser }
      });
    } catch (error: any) {
      console.error('Error uploading resume:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message,
          error: 'USER_NOT_FOUND'
        });
      } else if (error instanceof DatabaseError) {
        res.status(500).json({
          success: false,
          message: `Database error while uploading resume: ${error.message}`,
          error: 'DATABASE_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to upload resume: ${error.message || 'Unknown error occurred'}`,
          error: 'INTERNAL_SERVER_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  };

  // Upload portfolio
  uploadPortfolio = async (req: Request, res: Response) => {
    if (!this.ensureOwnProfile(req, res)) return;
    try {
      console.log('Uploading portfolio for user:', req.params.id);
      const portfolioUrl = req.body.portfolioUrl;
      const updatedUser = await UserService.uploadPortfolio(String(req.params.id), portfolioUrl);
      console.log('Portfolio uploaded successfully');
      res.status(200).json({
        success: true,
        message: 'Portfolio uploaded successfully',
        data: { user: updatedUser }
      });
    } catch (error: any) {
      console.error('Error uploading portfolio:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message,
          error: 'USER_NOT_FOUND'
        });
      } else if (error instanceof DatabaseError) {
        res.status(500).json({
          success: false,
          message: `Database error while uploading portfolio: ${error.message}`,
          error: 'DATABASE_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to upload portfolio: ${error.message || 'Unknown error occurred'}`,
          error: 'INTERNAL_SERVER_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  };

  // Update skills
  updateSkills = async (req: Request, res: Response) => {
    if (!this.ensureOwnProfile(req, res)) return;
    try {
      console.log('Updating skills for user:', req.params.id);
      const { skills } = req.body;
      const updatedUser = await UserService.updateSkills(String(req.params.id), skills);
      console.log('Skills updated successfully');
      res.status(200).json({
        success: true,
        message: 'Skills updated successfully',
        data: { user: updatedUser }
      });
    } catch (error: any) {
      console.error('Error updating skills:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message,
          error: 'USER_NOT_FOUND'
        });
      } else if (error instanceof DatabaseError) {
        res.status(500).json({
          success: false,
          message: `Database error while updating skills: ${error.message}`,
          error: 'DATABASE_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to update skills: ${error.message || 'Unknown error occurred'}`,
          error: 'INTERNAL_SERVER_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  };

  // Get all students
  getAllStudents = async (_req: Request, res: Response) => {
    try {
      console.log('Fetching all students...');
      const students = await this.userService.getAllStudents();
      console.log(`Successfully fetched ${students.length} students`);
      res.status(200).json({
        success: true,
        data: { students }
      });
    } catch (error: any) {
      console.error('Error fetching students:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });

      if (error instanceof DatabaseError) {
        res.status(500).json({
          success: false,
          message: `Database error while fetching students: ${error.message}`,
          error: 'DATABASE_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to fetch students: ${error.message || 'Unknown error occurred'}`,
          error: 'INTERNAL_SERVER_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  };

  // Get all graduates
  getAllGraduates = async (_req: Request, res: Response) => {
    try {
      console.log('Fetching all graduates...');
      const graduates = await this.userService.getAllGraduates();
      console.log(`Successfully fetched ${graduates.length} graduates`);
      res.status(200).json({
        success: true,
        data: { graduates }
      });
    } catch (error: any) {
      console.error('Error fetching graduates:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (error instanceof DatabaseError) {
        res.status(500).json({
          success: false,
          message: `Database error while fetching graduates: ${error.message}`,
          error: 'DATABASE_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to fetch graduates: ${error.message || 'Unknown error occurred'}`,
          error: 'INTERNAL_SERVER_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  };

  // Update user preferences
  updatePreferences = async (req: Request, res: Response) => {
    if (!this.ensureOwnProfile(req, res)) return;
    try {
      console.log('Updating preferences for user:', req.params.id);
     const userId = String(req.params.id);
      const preferences = req.body;
      const updatedUser = await this.userService.updateUserPreferences(userId, preferences);
      console.log('Preferences updated successfully');
      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        data: { user: updatedUser }
      });
    } catch (error: any) {
      console.error('Error updating preferences:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message,
          error: 'USER_NOT_FOUND'
        });
      } else if (error instanceof DatabaseError) {
        res.status(500).json({
          success: false,
          message: `Database error while updating preferences: ${error.message}`,
          error: 'DATABASE_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to update preferences: ${error.message || 'Unknown error occurred'}`,
          error: 'INTERNAL_SERVER_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  };
}
