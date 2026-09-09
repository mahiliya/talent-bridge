import { Request, Response } from 'express';
import { JobService } from '../services/jobService';
import { ApplicationService } from '../services/applicationService';
import {
  ResourceNotFoundError,
  ForbiddenError,
  DatabaseError
} from '../utils/errors';
import { CreateJobDto, UpdateJobDto, JobType, ExperienceLevel, TargetAudience } from '../types/job.types';

export class JobController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  // Create a new job
  createJob = async (req: Request, res: Response) => {
    try {
      const jobData = req.body as CreateJobDto;
      const job = await this.jobService.createJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get job by ID
  getJobById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
     const job = await JobService.getJobById(String(id));
      res.json(job);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Update job
  updateJob = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { companyId } = req.body;
      if (!companyId) {
        res.status(403).json({ error: 'Company ID is required' });
        return;
      }
      const jobData = req.body as UpdateJobDto;
     const job = await JobService.updateJob(String(id), companyId.toString(), jobData);
      res.json(job);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Delete job
  deleteJob = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { companyId } = req.body;
      if (!companyId) {
        res.status(403).json({ error: 'Company ID is required' });
        return;
      }
      const result = await JobService.deleteJob(String(id), companyId.toString());
      res.json(result);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
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

  // Toggle job active status
  toggleJobActiveStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const job = await this.jobService.toggleJobActiveStatus(String(id));
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get job recommendations for user
  getJobRecommendations = async (req: Request, res: Response) => {
    try {
      const userId = parseInt(String(req.params.userId), 10);
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
     const jobId = parseInt(String(req.params.jobId), 10);
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