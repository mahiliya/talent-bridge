import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define interfaces for the JWT payload
interface UserJwtPayload {
  id: string;
  email: string;
  type: 'user';
}

interface CompanyJwtPayload {
  id: string;
  email: string;
  type: 'company';
}

type JwtPayload = UserJwtPayload | CompanyJwtPayload;

// Extend Express Request interface to include user and company properties
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      company?: {
        id: string;
        email: string;
      };
      isUser?: boolean;
      isCompany?: boolean;
    }
  }
}

// Generic authentication middleware
export const authenticate = ( req: Request, res: Response, next: NextFunction ): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.',
        error: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_ACCESS_SECRET;
    
    if (!secret) {
      console.error('JWT_ACCESS_SECRET is not defined in the environment variables');
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR'
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown as JwtPayload;

      if (!decoded || typeof decoded.id !== 'string' || typeof decoded.email !== 'string' ||
          (decoded.type !== 'user' && decoded.type !== 'company')) {
        res.status(401).json({
          success: false,
          message: 'Invalid authentication token. Please login again.',
          error: 'INVALID_TOKEN'
        });
        return;
      }
      
      if (decoded.type === 'user') {
        req.user = {
          id: decoded.id,
          email: decoded.email
        };
        req.isUser = true;
        req.isCompany = false;
      } else if (decoded.type === 'company') {
        req.company = {
          id: decoded.id,
          email: decoded.email
        };
        req.isUser = false;
        req.isCompany = true;
      }
      
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.',
        error: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during authentication.',
      error: 'AUTHENTICATION_ERROR'
    });
  }
};

// Middleware to authenticate users only
export const authenticateUser = ( req: Request, res: Response, next: NextFunction ): void => { authenticate(req, res, (): void => { if (!req.user) { res.status(403).json({ success: false, message: 'Access forbidden. User authentication required.', error: 'USER_ACCESS_REQUIRED' }); return; }
    next();
  });
};

// Middleware to authenticate companies only
export const authenticateCompany = ( req: Request, res: Response, next: NextFunction ): void => { authenticate(req, res, (): void => { if (!req.company) { res.status(403).json({ success: false, message: 'Access forbidden. Company authentication required.', error: 'COMPANY_ACCESS_REQUIRED' }); return; }
    next();
  });
}; 