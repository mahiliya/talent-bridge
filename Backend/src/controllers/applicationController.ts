import { Request, Response } from 'express';
import { ApplicationStatus } from '@prisma/client';
import { ApplicationService } from '../services/applicationService';
import {
  ResourceNotFoundError,
  ForbiddenError,
  ValidationError,
  DatabaseError,
  DuplicateResourceError
} from '../utils/errors';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  company?: { id: string; email: string };
}

export class ApplicationController {
  private applicationService: ApplicationService;

  constructor() {
    this.applicationService = new ApplicationService();
  }

  // Apply for a job
  applyForJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      const applicationData = req.body as { coverLetter?: string; resumeUrl?: string };
      
     const application = await ApplicationService.applyForJob(
      userId.toString(),
      String(jobId),
      applicationData
    );
      return res.status(201).json(application);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        return res.status(404).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        return res.status(403).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      } else if (error instanceof DuplicateResourceError) {
        return res.status(409).json({ error: error.message });
      } else {
        return res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Get applications
  getApplications = async (req: Request, res: Response) => {
    try {
      const { entityId } = req.params;
      const { status } = req.query;
      const userType = req.user ? 'user' : 'company';

      if ((userType === 'user' && req.user?.id !== String(entityId)) ||
          (userType === 'company' && req.company?.id !== String(entityId))) {
        return res.status(403).json({ error: 'You can only access your own applications.' });
      }
      
      const applications = await ApplicationService.getApplications(
        userType as 'user' | 'company',
        String(entityId),
        status ? { status: status as any } : undefined
      );
      
      return res.json(applications);
    } catch (error) {
      if (error instanceof DatabaseError) {
        return res.status(500).json({ error: error.message });
      } else {
        return res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Get application by ID. Identity is taken from the auth token (not the
  // query string) so a caller can only read applications they are party to.
  getApplicationById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const entityType: 'user' | 'company' = req.company ? 'company' : 'user';
      const entityId = req.company?.id || req.user?.id;
      if (!entityId) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const application = await ApplicationService.getApplicationById(String(id), entityId, entityType);
      return res.json(application);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        return res.status(404).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        return res.status(403).json({ error: error.message });
      } else {
        return res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Update application status
  updateApplicationStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.company?.id;
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      const { status } = req.body;
      if (!status || !Object.values(ApplicationStatus).includes(status)) {
        return res.status(400).json({
          error: `Invalid application status. Allowed: ${Object.values(ApplicationStatus).join(', ')}.`,
        });
      }

      const application = await ApplicationService.updateApplicationStatus(
        String(id),
        companyId.toString(),
        status
      );
      return res.json(application);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        return res.status(404).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        return res.status(403).json({ error: error.message });
      } else {
        return res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Withdraw application
  withdrawApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const result = await ApplicationService.withdrawApplication(String(id), userId.toString());
      return res.json(result);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        return res.status(404).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        return res.status(403).json({ error: error.message });
      } else {
        return res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Get applicants for one of the company's own jobs, ranked by match score.
  // Company-only + ownership enforced in the service.
  getJobApplications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.company?.id;
      if (!companyId) {
        return res.status(403).json({ error: 'Company authentication required.' });
      }
      const result = await ApplicationService.getRankedApplicantsForJob(companyId, String(req.params.jobId));
      return res.json(result);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        return res.status(404).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        return res.status(403).json({ error: error.message });
      } else {
        return res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Get company applications
  getCompanyApplications = async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
     const applications = await this.applicationService.getCompanyApplications(String(companyId)
    );

    res.json(applications);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get applications by status
  getApplicationsByStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const applications = await this.applicationService.getApplicationsByStatus(status as any);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get application statistics
  getApplicationStatistics = async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const statistics = await this.applicationService.getApplicationStatistics(String(companyId));
      res.json(statistics);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };
} 