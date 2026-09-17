import { Request, Response } from 'express';
import { JobService } from '../services/jobService';
import { ApplicationService } from '../services/applicationService';
import {
  ResourceNotFoundError,
  ForbiddenError,
  ValidationError,
  DatabaseError
} from '../utils/errors';
import { CompanyJobInput, JobType, ExperienceLevel, TargetAudience } from '../types/job.types';

export class JobController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  // Translate service errors into HTTP responses (shared by company flows).
  private handleJobError(error: unknown, res: Response) {
    if (error instanceof ResourceNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof ForbiddenError) {
      return res.status(403).json({ error: error.message });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }

  // Create a new opportunity (Company-only). companyId comes from the
  // authenticated company, never from the request body.
  createJob = async (req: Request, res: Response) => {
    try {
      const companyId = req.company?.id;
      if (!companyId) {
        return res.status(403).json({ error: 'Company authentication required.' });
      }
      const job = await JobService.createCompanyJob(companyId, req.body as CompanyJobInput);
      return res.status(201).json(job);
    } catch (error) {
      return this.handleJobError(error, res);
    }
  };

  // List the authenticated company's own opportunities (drafts included).
  getMyJobs = async (req: Request, res: Response) => {
    try {
      const companyId = req.company?.id;
      if (!companyId) {
        return res.status(403).json({ error: 'Company authentication required.' });
      }
      const jobs = await JobService.getCompanyJobs(companyId);
      return res.json(jobs);
    } catch (error) {
      return this.handleJobError(error, res);
    }
  };

  // Publish a draft opportunity (Company-only, ownership enforced).
  publishJob = async (req: Request, res: Response) => {
    try {
      const companyId = req.company?.id;
      if (!companyId) {
        return res.status(403).json({ error: 'Company authentication required.' });
      }
      const job = await JobService.publishCompanyJob(String(req.params.id), companyId);
      return res.json(job);
    } catch (error) {
      return this.handleJobError(error, res);
    }
  };

  // Get job by ID. Published + active jobs are public. Drafts and inactive
  // jobs are only visible to the company that owns them; everyone else gets a
  // 404 so their existence is not leaked.
  getJobById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const job = await JobService.getJobById(String(id));

      const isPubliclyVisible = !job.isDraft && job.isActive;
      if (!isPubliclyVisible) {
        const isOwner = Boolean(req.company?.id) && req.company?.id === job.companyId;
        if (!isOwner) {
          return res.status(404).json({ error: `Job with ID ${id} not found.` });
        }
      }

      return res.json(job);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Update/edit an opportunity (Company-only). Ownership is enforced in the
  // service against the authenticated company id.
  updateJob = async (req: Request, res: Response) => {
    try {
      const companyId = req.company?.id;
      if (!companyId) {
        return res.status(403).json({ error: 'Company authentication required.' });
      }
      const job = await JobService.updateCompanyJob(String(req.params.id), companyId, req.body as CompanyJobInput);
      return res.json(job);
    } catch (error) {
      return this.handleJobError(error, res);
    }
  };

  // Delete an opportunity (Company-only, ownership enforced).
  deleteJob = async (req: Request, res: Response) => {
    try {
      const companyId = req.company?.id;
      if (!companyId) {
        return res.status(403).json({ error: 'Company authentication required.' });
      }
      const result = await JobService.deleteJob(String(req.params.id), companyId);
      return res.json(result);
    } catch (error) {
      return this.handleJobError(error, res);
    }
  };

  // Get all jobs
  getAllJobs = async (req: Request, res: Response) => {
    try {
      const filters = {
        jobType: req.query.jobType as JobType | undefined,
        location: req.query.location as string | undefined,
        companyId: req.query.companyId as string | undefined,
        // When isActive is not provided, leave it undefined so the service
        // defaults to active jobs only. Only honor an explicit true/false.
        isActive: req.query.isActive === undefined ? undefined : req.query.isActive === 'true',
      };
      const jobs = await JobService.getAllJobs(filters);
      res.json(jobs);
    } catch (error) {
      if (error instanceof DatabaseError) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Get jobs by type
  getJobsByType = async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      if (!Object.values(JobType).includes(type as JobType)) {
        res.status(400).json({ error: 'Invalid job type' });
        return;
      }
      const jobs = await this.jobService.getJobsByType(type as JobType);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get jobs by experience level
  getJobsByExperienceLevel = async (req: Request, res: Response) => {
    try {
      const { level } = req.params;
      const jobs = await this.jobService.getJobsByExperienceLevel(level as ExperienceLevel);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get jobs by target audience
  getJobsByTargetAudience = async (req: Request, res: Response) => {
    try {
      const { audience } = req.params;
      const jobs = await this.jobService.getJobsByTargetAudience(audience as TargetAudience);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get jobs by company
  getJobsByCompany = async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const jobs = await this.jobService.getJobsByCompany(String(companyId));
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get jobs by location
  getJobsByLocation = async (req: Request, res: Response) => {
    try {
      const { location } = req.params;
     const jobs = await this.jobService.getJobsByLocation(String(location));
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get jobs by salary range
  getJobsBySalaryRange = async (req: Request, res: Response) => {
    try {
      const { minSalary, maxSalary } = req.query;
      const jobs = await this.jobService.getJobsBySalaryRange(
        Number(minSalary),
        Number(maxSalary)
      );
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get jobs by skills
  getJobsBySkills = async (req: Request, res: Response) => {
    try {
      const { skills } = req.query;
      const skillsArray = Array.isArray(skills) 
        ? skills.map(s => String(s))
        : [String(skills)];
      const jobs = await this.jobService.getJobsBySkills(skillsArray);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Toggle opportunity active status (Company-only, ownership enforced).
  toggleJobActiveStatus = async (req: Request, res: Response) => {
    try {
      const companyId = req.company?.id;
      if (!companyId) {
        return res.status(403).json({ error: 'Company authentication required.' });
      }
      const job = await JobService.toggleCompanyJobActive(String(req.params.id), companyId);
      return res.json(job);
    } catch (error) {
      return this.handleJobError(error, res);
    }
  };

  // Get job recommendations for user
  getJobRecommendations = async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 10;
      const recommendations = await JobService.getJobRecommendationsForUser(userId, limit);
      res.json(recommendations);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Get candidate recommendations for job
  getCandidateRecommendations = async (req: Request, res: Response) => {
    try {
     const jobId = String(req.params.jobId);
      const limit = parseInt(req.query.limit as string) || 10;
      const recommendations = await JobService.getCandidateRecommendationsForJob(jobId,  limit);
      res.json(recommendations);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Apply for job
  applyForJob = async (req: Request, res: Response) => {
    try {
      const { coverLetter, resumeUrl } = req.body;
      const userId = req.user?.id;
      const jobId = String(req.params.id);
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User ID is required.',
          error: 'USER_ID_REQUIRED'
        });
        return;
      }
      
      if (!jobId) {
        res.status(400).json({
          success: false,
          message: 'Invalid job ID.',
          error: 'INVALID_JOB_ID'
        });
        return;
      }
      
      const application = await ApplicationService.applyForJob(userId, jobId, { coverLetter, resumeUrl: String(resumeUrl || '') });
      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        application
      });
    } catch (error: any) {
      console.error('Apply for job error:', error.message);
      
      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message,
          error: 'RESOURCE_NOT_FOUND'
        });
      } else if (error instanceof ForbiddenError) {
        res.status(403).json({
          success: false,
          message: error.message,
          error: 'FORBIDDEN'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'An error occurred while submitting your application.',
          error: 'INTERNAL_SERVER_ERROR'
        });
      }
    }
  };
}