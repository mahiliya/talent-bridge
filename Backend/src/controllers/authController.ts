import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
import {
  EmailAlreadyExistsError,
  PasswordMismatchError,
  InvalidEmailFormatError,
  InvalidPasswordError,
  InvalidCredentialsError,
  InvalidTokenError,
  DatabaseError
} from '../utils/errors';



export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password, userType } = req.body;

    try {
      if (userType !== 'user' && userType !== 'company') {
        res.status(400).json({
          success: false,
          message: 'Choose a valid account type.',
          error: 'INVALID_ACCOUNT_TYPE'
        });
        return;
      }

      const result = await AuthService.login(email, password, userType);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        ...result
      });
    } catch (error: any) {
      console.error('Login error:', error.message);

      if (error instanceof InvalidCredentialsError) {
        res.status(401).json({
          success: false,
          message: error.message,
          error: 'INVALID_CREDENTIALS'
        });
      } else if (error instanceof InvalidEmailFormatError) {
        res.status(400).json({
          success: false,
          message: error.message,
          error: 'INVALID_EMAIL'
        });
      } else if (error instanceof DatabaseError) {
        res.status(500).json({
          success: false,
          message: error.message,
          error: 'DATABASE_ERROR'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'An unexpected error occurred during login.',
          error: 'INTERNAL_SERVER_ERROR'
        });
      }
    }
  }

  static async logout(_req: Request, res: Response) {
    try {
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during logout.',
        error: 'LOGOUT_ERROR'
      });
    }
  }

  static async getCurrentUser(req: Request, res: Response) {
    try {
      if (req.user) {
        const user = await AuthService.getUserDetails(req.user.id);
        res.status(200).json({
          success: true,
          user
        });
      } else if (req.company) {
        const company = await AuthService.getCompanyDetails(req.company.id);
        res.status(200).json({
          success: true,
          company
        });
      }
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving user details.',
        error: 'USER_DETAILS_ERROR'
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;

    try {
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          error: 'REFRESH_TOKEN_REQUIRED'
        });
      }

      const result = await AuthService.refreshToken(refreshToken);
      
      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        ...result
      });
    } catch (error: any) {
      console.error('Refresh token error:', error.message);
      
      if (error instanceof InvalidTokenError) {
        return res.status(401).json({
          success: false,
          message: error.message,
          error: 'INVALID_REFRESH_TOKEN'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'An error occurred while refreshing the token.',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  static async register(req: Request, res: Response) {
    const { fullName, email, password, confirmPassword } = req.body;

    try {
      console.log('Registration attempt for:', email);
      const user = await UserService.register(fullName, email, password, confirmPassword);
      console.log('Registration successful for:', email);
      res.status(201).json({
        success: true,
        message: 'User successfully registered',
        user,
      });
    } catch (error: any) {
      console.error('Detailed registration error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
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
      } else if (error instanceof DatabaseError) {
        res.status(500).json({
          success: false,
          message: `Database error: ${error.message}`,
          error: 'DATABASE_ERROR'
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
  }
}

