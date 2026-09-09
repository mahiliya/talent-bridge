import { PrismaClient, Job, JobType, ExperienceLevel, TargetAudience } from '@prisma/client';
import { CreateJobDto, UpdateJobDto } from '../types/job.types';
import { 
  ResourceNotFoundError,
  ForbiddenError,
  DatabaseError
} from '../utils/errors';

const prisma = new PrismaClient();

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
} 