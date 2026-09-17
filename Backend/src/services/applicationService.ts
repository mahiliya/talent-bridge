import { PrismaClient, Application, ApplicationStatus } from '@prisma/client';
import {
  ResourceNotFoundError,
  ForbiddenError,
  DuplicateResourceError,
  ValidationError,
  DatabaseError
} from '../utils/errors';
import { CreateApplicationDto } from '../types/application.types';
import { MatchService } from './matchService';
import { NotificationService } from './notificationService';
import { COMPANY_SAFE_SELECT, USER_SAFE_SELECT } from '../utils/safeSelect';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

// The longest company explanation/message we persist and echo to the applicant.
const MAX_REASON_LENGTH = 1000;

// Applicant fields a company may see on an application, plus the fields the
// applicant scorer needs. Never includes the password.
const APPLICANT_DETAIL_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  skills: true,
  university: true,
  fieldOfStudy: true,
  degree: true,
  currentYear: true,
  expectedGraduation: true,
  isStudent: true,
  isGraduate: true,
  resume: true,
  portfolioWebsite: true,
  githubProfile: true,
  linkedInProfile: true,
  preferredJobTypes: true,
  preferredLocations: true,
  minSalary: true,
  remotePreference: true,
  createdAt: true,
} as const;

export class ApplicationService {
  static async applyForJob(applicantId: string, jobId: string, applicationData: {
    coverLetter?: string;
    resumeUrl?: string;
  }) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: applicantId } });
      if (!user) {
        throw new ResourceNotFoundError(`User with ID ${applicantId} not found.`);
      }

      // Check if job exists and is active
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (!job) {
        throw new ResourceNotFoundError(`Job with ID ${jobId} not found.`);
      }
      
      if (!job.isActive) {
        throw new ForbiddenError('This job is no longer accepting applications.');
      }

      // Check if user has already applied for this job
      const existingApplication = await prisma.application.findFirst({
        where: {
          applicantId,
          jobId
        }
      });

      if (existingApplication) {
        throw new DuplicateResourceError('You have already applied for this job.');
      }

      // Create application
      const application = await prisma.application.create({
        data: {
          applicantId,
          jobId,
          status: ApplicationStatus.PENDING,
          coverLetter: applicationData.coverLetter,
          resumeUrl: applicationData.resumeUrl || user.resume
        },
        include: {
          job: {
            select: {
              title: true,
              company: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      // Notify the company that owns this job about the new applicant. Scoped to
      // job.companyId so it can only ever reach the owning company. Best-effort:
      // a notification failure must not fail the application submission.
      try {
        await notificationService.createNewApplicationNotification({
          companyId: job.companyId,
          applicantName: user.fullName,
          jobTitle: application.job.title,
        });
      } catch (notifyError) {
        console.error('Failed to create new-application company notification:', notifyError);
      }

      return application;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while submitting your application. Please try again later.');
    }
  }

  static async getApplications(
    userType: 'user' | 'company', 
    entityId: string, 
    filters?: { 
      status?: ApplicationStatus 
    }
  ) {
    try {
      // Build the where clause based on user type
      const where: any = {};
      
      if (userType === 'user') {
        where.applicantId = entityId;
      } else if (userType === 'company') {
        where.job = {
          companyId: entityId
        };
      }

      // Add status filter if provided
      if (filters?.status) {
        where.status = filters.status;
      }

      // Get applications with necessary relations
      const applications = await prisma.application.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              jobType: true,
              location: true,
              workMode: true,
              isInternship: true,
              deadline: true,
              company: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          applicant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              skills: true,
              university: true
            }
          }
        },
        orderBy: { appliedAt: 'desc' }
      });

      return applications;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving applications. Please try again later.');
    }
  }

  static async getApplicationById(applicationId: string, entityId: string, entityType: 'user' | 'company') {
    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          },
          applicant: {
            select: APPLICANT_DETAIL_SELECT,
          }
        }
      });

      if (!application) {
        throw new ResourceNotFoundError(`Application with ID ${applicationId} not found.`);
      }

      // Authorization: only the applicant, or the company that owns the job.
      // entityId/entityType are derived from the auth token by the controller.
      if (
        (entityType === 'user' && application.applicantId !== entityId) ||
        (entityType === 'company' && application.job.company.id !== entityId)
      ) {
        throw new ForbiddenError('You do not have permission to view this application.');
      }

      // For the company, attach the applicant->job match score and breakdown.
      if (entityType === 'company') {
        const { score, breakdown } = MatchService.scoreApplicantForJob(application.applicant, application.job);
        return { ...application, matchScore: score, matchBreakdown: breakdown };
      }

      return application;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving the application details. Please try again later.');
    }
  }

  // Return the raw stored resume value (a base64 data URL, or an external URL)
  // for an application, enforcing the SAME authorization as getApplicationById:
  // only the applicant, or the company that owns the job, may access it.
  static async getApplicationResume(applicationId: string, entityId: string, entityType: 'user' | 'company') {
    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: {
          resumeUrl: true,
          applicantId: true,
          applicant: { select: { resume: true } },
          job: { select: { company: { select: { id: true } } } },
        },
      });

      if (!application) {
        throw new ResourceNotFoundError(`Application with ID ${applicationId} not found.`);
      }

      if (
        (entityType === 'user' && application.applicantId !== entityId) ||
        (entityType === 'company' && application.job.company.id !== entityId)
      ) {
        throw new ForbiddenError('You do not have permission to view this resume.');
      }

      // Prefer the resume submitted with the application; fall back to the one
      // on the applicant's profile.
      const resume = application.resumeUrl || application.applicant.resume;
      if (!resume) {
        throw new ResourceNotFoundError('No resume is available for this application.');
      }
      return resume;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving the resume. Please try again later.');
    }
  }

  // Applicants for one job the company owns, ranked by applicant->job match.
  static async getRankedApplicantsForJob(companyId: string, jobId: string) {
    try {
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (!job) {
        throw new ResourceNotFoundError(`Job with ID ${jobId} not found.`);
      }
      if (job.companyId !== companyId) {
        throw new ForbiddenError('You do not have permission to view applicants for this job.');
      }

      const applications = await prisma.application.findMany({
        where: { jobId },
        include: { applicant: { select: APPLICANT_DETAIL_SELECT } },
      });

      const applicants = applications
        .map((application) => {
          const { score } = MatchService.scoreApplicantForJob(application.applicant, job);
          return {
            applicationId: application.id,
            status: application.status,
            appliedAt: application.appliedAt,
            matchScore: score,
            applicant: {
              id: application.applicant.id,
              fullName: application.applicant.fullName,
              university: application.applicant.university,
              fieldOfStudy: application.applicant.fieldOfStudy,
              skills: application.applicant.skills,
            },
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      return {
        job: {
          id: job.id,
          title: job.title,
          jobType: job.jobType,
          isInternship: job.isInternship,
          location: job.location,
          workMode: job.workMode,
          deadline: job.deadline,
        },
        applicants,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving applicants. Please try again later.');
    }
  }

  static async updateApplicationStatus(
    applicationId: string,
    companyId: string,
    status: ApplicationStatus,
    reason?: string
  ) {
    try {
      // Check if application exists
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            select: {
              companyId: true
            }
          }
        }
      });

      if (!application) {
        throw new ResourceNotFoundError(`Application with ID ${applicationId} not found.`);
      }

      // Check if the company owns the job. This ownership guard is unchanged: a
      // company can never modify an application belonging to another company.
      if (application.job.companyId !== companyId) {
        throw new ForbiddenError('You do not have permission to update this application.');
      }

      // Normalize the company's explanation/message to the applicant. It is
      // persisted on the application (reusing the existing `notes` field) and
      // echoed to the candidate in their notification. When `reason` is not
      // supplied at all we leave any existing note untouched.
      let normalizedReason: string | undefined;
      if (reason !== undefined) {
        normalizedReason = String(reason).trim();
        if (normalizedReason.length > MAX_REASON_LENGTH) {
          throw new ValidationError(
            `The message to the applicant must be ${MAX_REASON_LENGTH} characters or fewer.`
          );
        }
      }

      // Update application status (and the note when a reason was provided).
      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: {
          status,
          ...(normalizedReason !== undefined ? { notes: normalizedReason || null } : {}),
        },
        include: {
          applicant: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          job: {
            select: {
              id: true,
              title: true,
              company: { select: { name: true } }
            }
          }
        }
      });

      // Notify the candidate about the decision. A notification failure must
      // never fail the status update itself, so it is best-effort.
      const NOTIFIABLE_STATUSES: ApplicationStatus[] = [
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.INTERVIEW,
      ];
      if (NOTIFIABLE_STATUSES.includes(status)) {
        try {
          await notificationService.createApplicationDecisionNotification({
            userId: updatedApplication.applicant.id,
            status,
            jobTitle: updatedApplication.job.title,
            companyName: updatedApplication.job.company.name,
            reason: normalizedReason,
          });
        } catch (notifyError) {
          console.error('Failed to create application status notification:', notifyError);
        }
      }

      return updatedApplication;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while updating the application status. Please try again later.');
    }
  }

  static async withdrawApplication(applicationId: string, applicantId: string) {
    try {
      // Check if application exists
      const application = await prisma.application.findUnique({
        where: { id: applicationId }
      });

      if (!application) {
        throw new ResourceNotFoundError(`Application with ID ${applicationId} not found.`);
      }

      // Check if the user is the applicant
      if (application.applicantId !== applicantId) {
        throw new ForbiddenError('You do not have permission to withdraw this application.');
      }

      // Delete application
      await prisma.application.delete({
        where: { id: applicationId }
      });

      return {
        success: true,
        message: 'Application has been withdrawn successfully.'
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while withdrawing the application. Please try again later.');
    }
  }

  // Create a new application
  async createApplication(data: CreateApplicationDto): Promise<Application> {
    return prisma.application.create({
      data: {
        applicantId: data.userId,
        jobId: data.jobId,
        status: data.status ?? ApplicationStatus.PENDING,
        coverLetter: data.coverLetter,
        resumeUrl: data.resumeUrl,
      },
      include: {
        job: {
          include: {
            company: { select: COMPANY_SAFE_SELECT },
          },
        },
        applicant: { select: USER_SAFE_SELECT },
      },
    });
  }

  // Get application by ID
  async getApplicationById(id: string): Promise<Application | null> {
    return prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: { select: COMPANY_SAFE_SELECT },
          },
        },
        applicant: { select: USER_SAFE_SELECT },
      },
    });
  }

  // Update application status
  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<Application> {
    return prisma.application.update({
      where: { id },
      data: { status },
      include: {
        job: {
          include: {
            company: { select: COMPANY_SAFE_SELECT },
          },
        },
        applicant: { select: USER_SAFE_SELECT },
      },
    });
  }

  // Delete application
  async deleteApplication(id: string): Promise<Application> {
    return prisma.application.delete({
      where: { id },
    });
  }

  // Get all applications for a user
  async getUserApplications(applicantId: string): Promise<Application[]> {
    return prisma.application.findMany({
      where: {
        applicantId,
      },
      include: {
        job: {
          include: {
            company: { select: COMPANY_SAFE_SELECT },
          },
        },
      },
    });
  }

  // Get all applications for a job
  async getJobApplications(jobId: string): Promise<Application[]> {
    return prisma.application.findMany({
      where: {
        jobId,
      },
      include: {
        applicant: { select: USER_SAFE_SELECT },
      },
    });
  }

  // Get all applications for a company. Applicant projected without password.
  async getCompanyApplications(companyId: string) {
    return prisma.application.findMany({
      where: {
        job: {
          companyId,
        },
      },
      include: {
        job: true,
        applicant: { select: APPLICANT_DETAIL_SELECT },
      },
    });
  }

  // Get applications by status. Applicant and company projected without secrets.
  async getApplicationsByStatus(status: ApplicationStatus) {
    return prisma.application.findMany({
      where: {
        status,
      },
      include: {
        job: {
          include: {
            company: { select: COMPANY_SAFE_SELECT },
          },
        },
        applicant: { select: APPLICANT_DETAIL_SELECT },
      },
    });
  }

  // Check if user has already applied to a job
  async hasUserApplied(applicantId: string, jobId: string): Promise<boolean> {
    const application = await prisma.application.findFirst({
      where: {
        applicantId,
        jobId,
      },
    });

    return !!application;
  }

  // Get application statistics
  async getApplicationStatistics(companyId: string) {
    const applications = await prisma.application.findMany({
      where: {
        job: {
          companyId,
        },
      },
      select: {
        status: true,
      },
    });

    const total = applications.length;
    const statusCounts = applications.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {} as Record<ApplicationStatus, number>);

    return {
      total,
      statusCounts,
    };
  }
} 