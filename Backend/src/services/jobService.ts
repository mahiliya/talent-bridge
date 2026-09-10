import { PrismaClient, Job, JobType, ExperienceLevel, TargetAudience, RemotePreference } from '@prisma/client';
import { CreateJobDto, UpdateJobDto, CompanyJobInput } from '../types/job.types';
import {
  ResourceNotFoundError,
  ForbiddenError,
  ValidationError,
  DatabaseError
} from '../utils/errors';

const prisma = new PrismaClient();

// Normalize a comma-separated string or array into a clean string[].
const toStringArray = (value: string[] | string | undefined | null): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

export class JobService {
  // Create a new job
  async createJob(data: CreateJobDto): Promise<Job> {
    return prisma.job.create({
      data,
      include: {
        company: true,
      },
    });
  }

  // Get job by ID
  async getJobById(id: string): Promise<Job | null> {
    return prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        applications: {
          include: {
            applicant: true,
          },
        },
      },
    });
  }

  // Update job
  async updateJob(id: string, data: UpdateJobDto): Promise<Job> {
    return prisma.job.update({
      where: { id },
      data,
      include: {
        company: true,
      },
    });
  }

  // Delete job
  async deleteJob(id: string): Promise<Job> {
    return prisma.job.delete({
      where: { id },
    });
  }

  // Get all jobs
  async getAllJobs(): Promise<Job[]> {
    return prisma.job.findMany({
      where: {
        isActive: true,
      },
      include: {
        company: true,
      },
    });
  }

  // Get jobs by type
  async getJobsByType(jobType: JobType): Promise<Job[]> {
    return prisma.job.findMany({
      where: {
        jobType,
        isActive: true,
      },
      include: {
        company: true,
      },
    });
  }

  // Get jobs by experience level
  async getJobsByExperienceLevel(level: ExperienceLevel): Promise<Job[]> {
    return prisma.job.findMany({
      where: {
        experienceLevel: level,
        isActive: true,
      },
      include: {
        company: true,
      },
    });
  }

  // Get jobs by target audience
  async getJobsByTargetAudience(audience: TargetAudience): Promise<Job[]> {
    return prisma.job.findMany({
      where: {
        targetAudience: {
          has: audience
        },
        isActive: true,
      },
      include: {
        company: true,
      },
    });
  }

  // Get jobs by company
  async getJobsByCompany(companyId: string): Promise<Job[]> {
    return prisma.job.findMany({
      where: {
        companyId,
        isActive: true,
      },
      include: {
        company: true,
      },
    });
  }

  // Get jobs by location
  async getJobsByLocation(location: string): Promise<Job[]> {
    return prisma.job.findMany({
      where: {
        location,
        isActive: true,
      },
      include: {
        company: true,
      },
    });
  }

  // Get jobs by salary range
  async getJobsBySalaryRange(minSalary: number, maxSalary: number): Promise<Job[]> {
    return prisma.job.findMany({
      where: {
        salary: {
          gte: minSalary.toString(),
          lte: maxSalary.toString(),
        },
        isActive: true,
      },
      include: {
        company: true,
      },
    });
  }

  // Get jobs by skills
  async getJobsBySkills(skills: string[]): Promise<Job[]> {
    return prisma.job.findMany({
      where: {
        requirements: {
          hasEvery: skills,
        },
        isActive: true,
      },
      include: {
        company: true,
      },
    });
  }

  // Toggle job active status
  async toggleJobActiveStatus(id: string): Promise<Job> {
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return prisma.job.update({
      where: { id },
      data: {
        isActive: !job.isActive,
      },
      include: {
        company: true,
      },
    });
  }

  static async getAllJobs(filters?: {
    jobType?: JobType;
    location?: string;
    companyId?: string;
    isActive?: boolean;
  }) {
    try {
      // Build filter conditions
      const where: any = {
        isActive: true, // Default to active jobs only
        // Drafts are never exposed through public listings, regardless of any
        // isActive override supplied by the caller.
        isDraft: false,
      };

      if (filters) {
        if (filters.jobType) where.jobType = filters.jobType;
        if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
        if (filters.companyId) where.companyId = filters.companyId;
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
      }

      // Get jobs with company information
      const jobs = await prisma.job.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              location: true
            }
          }
        },
        orderBy: { postedAt: 'desc' }
      });

      return jobs;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving job listings. Please try again later.');
    }
  }

  static async getJobById(jobId: string) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              location: true,
              website: true,
            }
          }
        }
      });

      if (!job) {
        throw new ResourceNotFoundError(`Job with ID ${jobId} not found.`);
      }

      return job;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving the job details. Please try again later.');
    }
  }

  static async updateJob(jobId: string, companyId: string, jobData: UpdateJobDto) {
    try {
      // Check if job exists
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      
      if (!job) {
        throw new ResourceNotFoundError(`Job with ID ${jobId} not found.`);
      }
      
      // Check if the company owns this job
      if (job.companyId !== companyId) {
        throw new ForbiddenError('You do not have permission to update this job posting.');
      }

      // Update job
      const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: jobData,
        include: {
          company: true,
        }
      });

      return updatedJob;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while updating the job posting. Please try again later.');
    }
  }

  static async deleteJob(jobId: string, companyId: string) {
    try {
      // Check if job exists
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      
      if (!job) {
        throw new ResourceNotFoundError(`Job with ID ${jobId} not found.`);
      }
      
      // Check if the company owns this job
      if (job.companyId !== companyId) {
        throw new ForbiddenError('You do not have permission to delete this job posting.');
      }

      // Check if there are any applications for this job
      const applicationCount = await prisma.application.count({
        where: { jobId }
      });

      if (applicationCount > 0) {
        // Instead of actually deleting, mark as inactive if there are applications
        await prisma.job.update({
          where: { id: jobId },
          data: { isActive: false },
          include: {
            company: true,
          }
        });
        return { 
          success: true, 
          message: 'Job has been closed because it has existing applications.'
        };
      } else {
        // Delete the job if no applications
        await prisma.job.delete({ where: { id: jobId } });
        return { 
          success: true, 
          message: 'Job has been deleted successfully.'
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while deleting the job posting. Please try again later.');
    }
  }

  // Get job recommendations for user
  static async getJobRecommendationsForUser(userId: number, limit: number = 10) {
    try {
      // Get user's skills and preferences
      const user = await prisma.user.findUnique({
        where: { id: userId.toString() },
        select: {
          skills: true,
          preferredJobTypes: true,
        },
      });

      if (!user) {
        throw new ResourceNotFoundError(`User with ID ${userId} not found.`);
      }

      // Find matching jobs based on user's skills and preferences
      const jobs = await prisma.job.findMany({
        where: {
          isActive: true,
          isDraft: false,
          requirements: {
            hasSome: user.skills,
          },


        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              location: true,
            },
          },
        },
        take: limit,
        orderBy: {
          postedAt: 'desc',
        },
      });

      return jobs;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while getting job recommendations. Please try again later.');
    }
  }

  // Get candidate recommendations for job
  static async getCandidateRecommendationsForJob(jobId: number, limit: number = 10) {
    try {
      // Get job details
      const job = await prisma.job.findUnique({
        where: { id: jobId.toString() },
        select: {
          requirements: true,
          experienceLevel: true,
          targetAudience: true,
        },
      });

      if (!job) {
        throw new ResourceNotFoundError(`Job with ID ${jobId} not found.`);
      }

      // Find matching candidates based on job requirements
      const candidates = await prisma.user.findMany({
        where: {
          skills: {
            hasSome: job.requirements,
          },
          
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          skills: true,
          university: true,
          resume: true,
        },
        take: limit,
      });

      return candidates;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while getting candidate recommendations. Please try again later.');
    }
  }

  // ---------------------------------------------------------------------------
  // Company opportunity management (Company-only flows)
  // ---------------------------------------------------------------------------

  // Validate and map the Post Opportunity payload into Prisma job data.
  // `publishing` = true means the caller intends to publish (stricter checks).
  private static buildCompanyJobData(input: CompanyJobInput, publishing: boolean) {
    const title = String(input.title ?? '').trim();
    const description = String(input.description ?? '').trim();

    if (!title) {
      throw new ValidationError('Opportunity title is required.');
    }
    if (!description) {
      throw new ValidationError('Opportunity description is required.');
    }

    // Deadline is a required, non-null column and must be a valid future date.
    if (!input.deadline) {
      throw new ValidationError('Application deadline is required.');
    }
    const deadline = new Date(input.deadline);
    if (Number.isNaN(deadline.getTime())) {
      throw new ValidationError('Application deadline is not a valid date.');
    }
    if (deadline.getTime() <= Date.now()) {
      throw new ValidationError('Application deadline must be in the future.');
    }

    // Work mode is optional, but if supplied it must be a valid RemotePreference.
    let workMode: RemotePreference | undefined;
    if (input.workMode !== undefined && input.workMode !== null && String(input.workMode) !== '') {
      if (!Object.values(RemotePreference).includes(input.workMode as RemotePreference)) {
        throw new ValidationError(
          `Unsupported work mode "${input.workMode}". Use ON_SITE, REMOTE, HYBRID, or FLEXIBLE.`
        );
      }
      workMode = input.workMode as RemotePreference;
    }

    // Experience level defaults to ENTRY; validate when provided.
    let experienceLevel: ExperienceLevel = ExperienceLevel.ENTRY;
    if (input.experienceLevel !== undefined && String(input.experienceLevel) !== '') {
      if (!Object.values(ExperienceLevel).includes(input.experienceLevel as ExperienceLevel)) {
        throw new ValidationError(
          `Unsupported experience level "${input.experienceLevel}". Use ENTRY, JUNIOR, MID, SENIOR, or LEAD.`
        );
      }
      experienceLevel = input.experienceLevel as ExperienceLevel;
    }

    // Job type: Internship toggle maps to INTERNSHIP; otherwise honor a valid
    // provided jobType, defaulting to FULL_TIME.
    const isInternship = Boolean(input.isInternship);
    let jobType: JobType = isInternship ? JobType.INTERNSHIP : JobType.FULL_TIME;
    if (!isInternship && input.jobType !== undefined && String(input.jobType) !== '') {
      if (!Object.values(JobType).includes(input.jobType as JobType)) {
        throw new ValidationError(
          `Unsupported job type "${input.jobType}". Use FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT, or FREELANCE.`
        );
      }
      jobType = input.jobType as JobType;
    }

    // Required skills feed the recommendation engine, so published roles must
    // carry at least one. Drafts may be saved without them.
    const requirements = toStringArray(input.requiredSkills ?? input.requirements);
    if (publishing && requirements.length === 0) {
      throw new ValidationError('At least one required skill is needed to publish an opportunity.');
    }

    const responsibilities = toStringArray(input.responsibilities);

    // Positions, when provided, must be a positive integer.
    let positions: number | undefined;
    if (input.positions !== undefined && input.positions !== null && String(input.positions) !== '') {
      const parsed = Number(input.positions);
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new ValidationError('Number of positions must be a positive whole number.');
      }
      positions = parsed;
    }

    const targetAudience: TargetAudience[] = Array.isArray(input.targetAudience) && input.targetAudience.length > 0
      ? input.targetAudience
      : [TargetAudience.BOTH];

    return {
      title,
      description,
      requirements,
      responsibilities,
      location: String(input.location ?? '').trim(),
      salary: input.salary ? String(input.salary).trim() : null,
      jobType,
      experienceLevel,
      isInternship,
      internshipDuration: input.internshipDuration ? String(input.internshipDuration).trim() : null,
      targetAudience,
      category: input.category ? String(input.category).trim() : null,
      workMode: workMode ?? null,
      positions: positions ?? null,
      deadline,
    };
  }

  // Create an opportunity owned by the authenticated company.
  // Draft => hidden (isActive:false, isDraft:true). Publish => live.
  static async createCompanyJob(companyId: string, input: CompanyJobInput) {
    try {
      const isDraft = Boolean(input.isDraft);
      const data = this.buildCompanyJobData(input, !isDraft);

      return await prisma.job.create({
        data: {
          ...data,
          companyId,
          isDraft,
          isActive: !isDraft,
        },
        include: { company: { select: { id: true, name: true } } },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while creating the opportunity. Please try again later.');
    }
  }

  // Update/edit an opportunity the company owns (draft or published).
  static async updateCompanyJob(jobId: string, companyId: string, input: CompanyJobInput) {
    try {
      const existing = await prisma.job.findUnique({ where: { id: jobId } });
      if (!existing) {
        throw new ResourceNotFoundError(`Job with ID ${jobId} not found.`);
      }
      if (existing.companyId !== companyId) {
        throw new ForbiddenError('You do not have permission to modify this opportunity.');
      }

      // If the client sends an explicit isDraft, respect it; otherwise keep the
      // current draft state. Publishing (isDraft:false) enforces stricter rules.
      const willBeDraft = input.isDraft !== undefined ? Boolean(input.isDraft) : existing.isDraft;
      const data = this.buildCompanyJobData(input, !willBeDraft);

      return await prisma.job.update({
        where: { id: jobId },
        data: {
          ...data,
          isDraft: willBeDraft,
          // A draft is never active; publishing makes it active.
          isActive: willBeDraft ? false : true,
        },
        include: { company: { select: { id: true, name: true } } },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while updating the opportunity. Please try again later.');
    }
  }

  // Publish a draft (or re-publish) an opportunity the company owns.
  static async publishCompanyJob(jobId: string, companyId: string) {
    try {
      const existing = await prisma.job.findUnique({ where: { id: jobId } });
      if (!existing) {
        throw new ResourceNotFoundError(`Job with ID ${jobId} not found.`);
      }
      if (existing.companyId !== companyId) {
        throw new ForbiddenError('You do not have permission to publish this opportunity.');
      }
      if ((existing.requirements?.length ?? 0) === 0) {
        throw new ValidationError('Add at least one required skill before publishing this opportunity.');
      }
      if (existing.deadline.getTime() <= Date.now()) {
        throw new ValidationError('Update the deadline to a future date before publishing.');
      }

      return await prisma.job.update({
        where: { id: jobId },
        data: { isDraft: false, isActive: true },
        include: { company: { select: { id: true, name: true } } },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while publishing the opportunity. Please try again later.');
    }
  }

  // Toggle active status for a published opportunity the company owns.
  static async toggleCompanyJobActive(jobId: string, companyId: string) {
    try {
      const existing = await prisma.job.findUnique({ where: { id: jobId } });
      if (!existing) {
        throw new ResourceNotFoundError(`Job with ID ${jobId} not found.`);
      }
      if (existing.companyId !== companyId) {
        throw new ForbiddenError('You do not have permission to modify this opportunity.');
      }
      if (existing.isDraft) {
        throw new ValidationError('Publish this opportunity before changing its active status.');
      }

      return await prisma.job.update({
        where: { id: jobId },
        data: { isActive: !existing.isActive },
        include: { company: { select: { id: true, name: true } } },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while updating the opportunity. Please try again later.');
    }
  }

  // List every opportunity a company owns, including drafts, with a live
  // application count for the dashboard/"My Opportunities" view.
  static async getCompanyJobs(companyId: string) {
    try {
      const jobs = await prisma.job.findMany({
        where: { companyId },
        include: {
          _count: { select: { applications: true } },
        },
        orderBy: { postedAt: 'desc' },
      });

      return jobs.map((job) => {
        const { _count, ...rest } = job;
        return { ...rest, applicationCount: _count.applications };
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving your opportunities. Please try again later.');
    }
  }
}