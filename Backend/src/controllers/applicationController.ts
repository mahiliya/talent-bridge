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

  // Stream an applicant's resume so an authorized company (or the applicant)
  // can view the PDF in the browser. Identity comes from the auth token; the
  // service enforces that only the applicant or the owning company may access
  // it. Resumes are stored as base64 data URLs, so we decode and serve the
  // bytes with the correct content type rather than exposing the raw string.
  getApplicationResume = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const entityType: 'user' | 'company' = req.company ? 'company' : 'user';
      const entityId = req.company?.id || req.user?.id;
      if (!entityId) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const resume = await ApplicationService.getApplicationResume(String(id), entityId, entityType);

      // Stored resumes are base64 data URLs, e.g. "data:application/pdf;base64,....".
      const dataUrlMatch = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(resume);
      if (dataUrlMatch) {
        const mime = dataUrlMatch[1] || 'application/pdf';
        const isBase64 = dataUrlMatch[2] === ';base64';
        const raw = dataUrlMatch[3];
        const buffer = isBase64
          ? Buffer.from(raw, 'base64')
          : Buffer.from(decodeURIComponent(raw), 'utf-8');

        res.setHeader('Content-Type', mime);
        // "inline" so the browser renders the PDF instead of downloading it.
        res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
        res.setHeader('Content-Length', String(buffer.length));
        return res.status(200).end(buffer);
      }

      // If a real external URL was stored, send the viewer there.
      if (/^https?:\/\//i.test(resume)) {
        return res.redirect(resume);
      }

      // Anything else (e.g. a stale/relative path) cannot be rendered.
      return res.status(404).json({ error: 'The stored resume is not in a viewable format.' });
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
      const { status, reason } = req.body;
      if (!status || !Object.values(ApplicationStatus).includes(status)) {
        return res.status(400).json({
          error: `Invalid application status. Allowed: ${Object.values(ApplicationStatus).join(', ')}.`,
        });
      }
      if (reason !== undefined && typeof reason !== 'string') {
        return res.status(400).json({ error: 'The message to the applicant must be text.' });
      }

      const application = await ApplicationService.updateApplicationStatus(
        String(id),
        companyId.toString(),
        status,
        reason
      );
      return res.json(application);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        return res.status(404).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        return res.status(403).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
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

  // Get company applications (owner only)
  getCompanyApplications = async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params;
    if (!req.company || req.company.id !== String(companyId)) {
      return res.status(403).json({ error: 'You can only access your own company applications.' });
    }
    try {
      const applications = await this.applicationService.getCompanyApplications(String(companyId));
      return res.json(applications);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get applications by status — scoped to the authenticated company's own jobs
  // (using the password-free company-scoped query).
  getApplicationsByStatus = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.company) {
      return res.status(403).json({ error: 'Company authentication required.' });
    }
    try {
      const { status } = req.params;
      const applications = await ApplicationService.getApplications('company', req.company.id, {
        status: status as any,
      });
      return res.json(applications);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get application statistics (owner only)
  getApplicationStatistics = async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params;
    if (!req.company || req.company.id !== String(companyId)) {
      return res.status(403).json({ error: 'You can only access your own company statistics.' });
    }
    try {
      const statistics = await this.applicationService.getApplicationStatistics(String(companyId));
      return res.json(statistics);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };
} 