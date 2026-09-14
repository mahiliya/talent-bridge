import { PrismaClient, JobType, Match } from '@prisma/client';
import { 
  ResourceNotFoundError,
  DatabaseError 
} from '../utils/errors';
import { CreateMatchDto} from '../types/match.types';

const prisma = new PrismaClient();

const normalizeText = (value: string | null | undefined) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeSkill = (value: string | null | undefined) => {
  const normalized = normalizeText(value);
  return normalized.split(' ').filter(Boolean);
};

export class MatchService {
  static scoreJobForUser(
    user: {
      skills?: string[];
      preferredJobTypes?: JobType[];
      preferredLocations?: string[];
      fieldOfStudy?: string | null;
      university?: string | null;
      minSalary?: number | null;
      remotePreference?: string | null;
      isStudent?: boolean;
    },
    job: {
      title: string;
      description?: string | null;
      requirements?: string[];
      jobType: JobType;
      location: string;
      salary?: string | null;
    }
  ) {
    const jobText = [job.title, job.description ?? '', ...(job.requirements ?? [])].join(' ');
    const normalizedJobText = normalizeText(jobText);

    let score = 0;

    const skillMatches = (user.skills ?? []).filter((skill) => {
      const parts = normalizeSkill(skill);
      if (!parts.length) return false;
      return parts.some((part) => normalizedJobText.includes(part));
    });

    if (skillMatches.length > 0) {
      score += Math.min(45, skillMatches.length * 12);
    }

    if (user.preferredJobTypes?.includes(job.jobType)) {
      score += 20;
    }

    if (user.preferredLocations?.some((location) => normalizeText(job.location).includes(normalizeText(location)))) {
      score += 20;
    }

    if (user.fieldOfStudy && normalizeText(user.fieldOfStudy) && normalizedJobText.includes(normalizeText(user.fieldOfStudy))) {
      score += 10;
    }

    if (user.university && job.title && normalizeText(job.title).includes(normalizeText(user.university))) {
      score += 5;
    }

    if (job.jobType === JobType.INTERNSHIP && user.isStudent) {
      score += 10;
    }

    if (user.minSalary && job.salary) {
      const parsedSalary = Number.parseInt(job.salary, 10);
      if (!Number.isNaN(parsedSalary) && parsedSalary >= user.minSalary) {
        score += 10;
      }
    }

    if (user.remotePreference && user.remotePreference === 'REMOTE' && normalizeText(job.location).includes('remote')) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  // ---------------------------------------------------------------------------
  // Applicant -> Job scoring (company applicant ranking).
  //
  // This is a DISTINCT scorer from scoreJobForUser: it measures how well an
  // applicant fits a specific job, using only fields that actually exist in the
  // schema. Weights: Skills 45, Field of study 15, Education 10, Job type 10,
  // Location/Remote 10, Salary 10. Criteria with no comparable data on the JOB
  // side are marked "not applicable" and excluded from the denominator so an
  // applicant is never given (or denied) false points. The final percentage is
  // earned / (sum of applicable max) * 100.
  // ---------------------------------------------------------------------------
  static scoreApplicantForJob(
    user: {
      skills?: string[];
      fieldOfStudy?: string | null;
      isStudent?: boolean;
      isGraduate?: boolean;
      preferredJobTypes?: string[];
      preferredLocations?: string[];
      minSalary?: number | null;
      remotePreference?: string | null;
    },
    job: {
      requirements?: string[];
      title?: string | null;
      description?: string | null;
      category?: string | null;
      jobType?: string | null;
      isInternship?: boolean;
      targetAudience?: string[];
      location?: string | null;
      workMode?: string | null;
      salary?: string | null;
    }
  ): {
    score: number;
    breakdown: Array<{ key: string; label: string; earned: number; max: number; applicable: boolean; detail: string }>;
  } {
    const lc = (value: string | null | undefined) => String(value ?? '').toLowerCase().trim();
    const parseSalary = (value: string | null | undefined) => {
      const match = String(value ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/);
      return match ? parseFloat(match[0]) : null;
    };

    // --- Skills (45): ratio of required skills matched. Exact = 1.0, partial
    // (substring either direction, e.g. "node" vs "node.js") = 0.5. The
    // original-cased requirement names are kept so the breakdown can name the
    // skills the applicant does and does not have. ---
    const reqSkillsRaw = (job.requirements ?? []).filter((s) => lc(s));
    const userSkills = (user.skills ?? []).map(lc).filter(Boolean);
    let matchedCredit = 0;
    const matched: string[] = [];
    const missing: string[] = [];
    for (const reqRaw of reqSkillsRaw) {
      const req = lc(reqRaw);
      let best = 0;
      for (const skill of userSkills) {
        if (skill === req) { best = 1; break; }
        if (skill.includes(req) || req.includes(skill)) best = Math.max(best, 0.5);
      }
      matchedCredit += best;
      if (best > 0) matched.push(reqRaw);
      else missing.push(reqRaw);
    }
    const reqCount = reqSkillsRaw.length;
    const skillsApplicable = reqCount > 0;
    const skillsEarned = skillsApplicable ? Math.round((matchedCredit / reqCount) * 45) : 0;
    const skillsDetail = !skillsApplicable
      ? 'Job lists no required skills'
      : (matched.length
          ? `The applicant has ${matched.join(', ')} — ${matched.length} of ${reqCount} required skill${reqCount === 1 ? '' : 's'}.`
          : `The applicant matches none of the ${reqCount} required skills.`) +
        (missing.length ? ` Missing: ${missing.join(', ')}.` : '');

    // --- Field of study (15): applicant's field-of-study terms found in the
    // job's category/title/description/requirements text. ---
    const fos = lc(user.fieldOfStudy);
    const jobText = normalizeText(
      [job.category, job.title, job.description, ...(job.requirements ?? [])].join(' ')
    );
    let fosEarned = 0;
    let fosDetail: string;
    if (!fos) {
      fosDetail = 'Applicant has no field of study on file';
    } else {
      const words = fos.split(/\s+/).filter((w) => w.length > 2);
      const hits = words.filter((w) => jobText.includes(w));
      fosEarned = words.length ? Math.round((hits.length / words.length) * 15) : 0;
      fosDetail = `${hits.length}/${words.length || 0} field-of-study term(s) found in the job`;
    }

    // --- Education (10): only meaningful when the job targets students XOR
    // graduates. targetAudience of BOTH / empty => not applicable. ---
    const ta = job.targetAudience ?? [];
    const wantsStudents = ta.includes('STUDENTS');
    const wantsGraduates = ta.includes('GRADUATES');
    const eduApplicable = !ta.includes('BOTH') && wantsStudents !== wantsGraduates;
    let eduEarned = 0;
    let eduDetail: string;
    if (!eduApplicable) {
      eduDetail = 'Job specifies no student/graduate requirement';
    } else if (wantsStudents) {
      eduEarned = user.isStudent ? 10 : 0;
      eduDetail = user.isStudent ? 'Applicant is a student (job targets students)' : 'Job targets students; applicant is not marked as a student';
    } else {
      eduEarned = user.isGraduate ? 10 : 0;
      eduDetail = user.isGraduate ? 'Applicant is a graduate (job targets graduates)' : 'Job targets graduates; applicant is not marked as a graduate';
    }

    // --- Job type / internship (10) ---
    let jobTypeEarned = 0;
    let jobTypeDetail: string;
    if (job.jobType && (user.preferredJobTypes ?? []).includes(job.jobType)) {
      jobTypeEarned = 10;
      jobTypeDetail = `Applicant prefers ${job.jobType} roles`;
    } else if (job.isInternship && user.isStudent) {
      jobTypeEarned = 5;
      jobTypeDetail = 'Internship and applicant is a student';
    } else {
      jobTypeDetail = 'No job-type preference match';
    }

    // --- Location / Remote (10): best of location match or work-mode compat. ---
    const jobLoc = lc(job.location);
    const locMatch = (user.preferredLocations ?? []).some((l) => {
      const pl = lc(l);
      return pl && jobLoc && (jobLoc.includes(pl) || pl.includes(jobLoc));
    }) ? 1 : 0;
    let remMatch = 0;
    const wm = job.workMode;
    const rp = user.remotePreference;
    if (wm && rp) {
      if (rp === 'FLEXIBLE' || rp === wm) remMatch = 1;
      else if (wm === 'HYBRID' || rp === 'HYBRID') remMatch = 0.5;
    }
    const locScore = Math.max(locMatch, remMatch);
    const locEarned = Math.round(locScore * 10);
    const locDetail = locMatch
      ? 'Preferred location matches the job location'
      : remMatch === 1
        ? `Work-mode compatible (${wm} / prefers ${rp})`
        : remMatch === 0.5
          ? `Partial work-mode compatibility (${wm} / prefers ${rp})`
          : 'No location or work-mode match';

    // --- Salary (10): only when BOTH sides have numeric data. ---
    const jobSalary = parseSalary(job.salary);
    const minSalary = typeof user.minSalary === 'number' ? user.minSalary : null;
    const salaryApplicable = jobSalary !== null && minSalary !== null;
    let salaryEarned = 0;
    let salaryDetail: string;
    if (!salaryApplicable) {
      salaryDetail = 'Salary not comparable (missing numeric data on one side)';
    } else {
      salaryEarned = (jobSalary as number) >= (minSalary as number) ? 10 : 0;
      salaryDetail = salaryEarned
        ? `Job salary (${jobSalary}) meets applicant minimum (${minSalary})`
        : `Job salary (${jobSalary}) is below applicant minimum (${minSalary})`;
    }

    const breakdown = [
      { key: 'skills', label: 'Skills', earned: skillsEarned, max: 45, applicable: skillsApplicable, detail: skillsDetail },
      { key: 'fieldOfStudy', label: 'Field of study', earned: fosEarned, max: 15, applicable: true, detail: fosDetail },
      { key: 'education', label: 'Education', earned: eduEarned, max: 10, applicable: eduApplicable, detail: eduDetail },
      { key: 'jobType', label: 'Job type', earned: jobTypeEarned, max: 10, applicable: true, detail: jobTypeDetail },
      { key: 'location', label: 'Location / Remote', earned: locEarned, max: 10, applicable: true, detail: locDetail },
      { key: 'salary', label: 'Salary', earned: salaryEarned, max: 10, applicable: salaryApplicable, detail: salaryDetail },
    ];

    const applicable = breakdown.filter((item) => item.applicable);
    const denominator = applicable.reduce((sum, item) => sum + item.max, 0);
    const numerator = applicable.reduce((sum, item) => sum + item.earned, 0);
    const score = denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

    return { score, breakdown };
  }


  // Create a new match
  async createMatch(data: CreateMatchDto): Promise<Match> {
    // Calculate match factors
    const matchFactors = {
      skillsMatch: 0,
      jobTypeMatch: 0,
      locationMatch: 0,
      salaryMatch: 0,
      remoteMatch: 0
    };

    // Get user and job details
    const [user, job] = await Promise.all([
      prisma.user.findUnique({
        where: { id: data.userId },
        select: {
          skills: true,
          preferredJobTypes: true,
          preferredLocations: true,
          minSalary: true,
          remotePreference: true,
        },
      }),
      prisma.job.findUnique({
        where: { id: data.jobId },
        select: {
          requirements: true,
          jobType: true,
          location: true,
          salary: true,
        },
      }),
    ]);

    if (!user || !job) {
      throw new ResourceNotFoundError('User or job not found');
    }

    // Calculate match factors
    // Skills match
    const commonSkills = user.skills.filter(skill => 
      job.requirements.some(req => req.toLowerCase().includes(skill.toLowerCase()))
    );
    matchFactors.skillsMatch = job.requirements.length > 0
      ? commonSkills.length / job.requirements.length
      : 0;

    // Job type match
    matchFactors.jobTypeMatch = user.preferredJobTypes.includes(job.jobType) ? 1 : 0;

    // Location match
    matchFactors.locationMatch = user.preferredLocations.includes(job.location) ? 1 : 0;

    // Salary match
    if (user.minSalary && job.salary) {
      const jobSalary = parseInt(job.salary);
      if (!isNaN(jobSalary) && jobSalary >= user.minSalary) {
        matchFactors.salaryMatch = 1;
      }
    }

    // Remote match
    if (user.remotePreference) {
      matchFactors.remoteMatch = 1;
    }

    return prisma.match.create({
      data: {
        ...data,
        matchFactors,
      },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        user: true,
      },
    });
  }

  // Get match by ID
  async getMatchById(id: string): Promise<Match | null> {
    return prisma.match.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        user: true,
      },
    });
  }

  // Update match score
  async updateMatchScore(id: string, score: number): Promise<Match> {
    return prisma.match.update({
      where: { id },
      data: { score },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        user: true,
      },
    });
  }

  // Delete match
  async deleteMatch(id: string): Promise<Match> {
    return prisma.match.delete({
      where: { id },
    });
  }

  // Get all matches for a user
  async getUserMatches(userId: string): Promise<Match[]> {
    return prisma.match.findMany({
      where: {
        userId,
      },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
    });
  }

  // Get all matches for a job
  async getJobMatches(jobId: string): Promise<Match[]> {
    return prisma.match.findMany({
      where: {
        jobId,
      },
      include: {
        user: true,
      },
      orderBy: {
        score: 'desc',
      },
    });
  }

  // Get all matches for a company
  async getCompanyMatches(companyId: string): Promise<Match[]> {
    return prisma.match.findMany({
      where: {
        job: {
          companyId,
        },
      },
      include: {
        job: true,
        user: true,
      },
      orderBy: {
        score: 'desc',
      },
    });
  }

  // Get top matches for a user
  async getTopMatchesForUser(userId: string, limit: number = 10): Promise<Match[]> {
    return prisma.match.findMany({
      where: {
        userId,
      },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
      take: limit,
    });
  }

  // Get top matches for a job
  async getTopMatchesForJob(jobId: string, limit: number = 10): Promise<Match[]> {
    return prisma.match.findMany({
      where: {
        jobId,
      },
      include: {
        user: true,
      },
      orderBy: {
        score: 'desc',
      },
      take: limit,
    });
  }

  // Calculate match score between user and job
  async calculateMatchScore(userId: string, jobId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        skills: true,
        preferredJobTypes: true,
        preferredIndustries: true,
        preferredLocations: true,
        minSalary: true,
        remotePreference: true,
      },
    });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        requirements: true,
        jobType: true,
        location: true,
        salary: true,
      },
    });

    if (!user || !job) {
      throw new Error('User or job not found');
    }

    let score = 0;
    const weights = {
      skills: 0.4,
      jobType: 0.2,
      location: 0.2,
      salary: 0.1,
      remote: 0.1,
    };

    // Skills match
    const commonSkills = user.skills.filter(skill => 
      job.requirements.some(req => req.toLowerCase().includes(skill.toLowerCase()))
    );
    if (job.requirements.length > 0) {
      score += (commonSkills.length / job.requirements.length) * weights.skills;
    }

    // Job type match
    if (user.preferredJobTypes.includes(job.jobType)) {
      score += weights.jobType;
    }

    // Location match
    if (user.preferredLocations.some(location =>
      job.location.toLowerCase().includes(location.toLowerCase())
    )) {
      score += weights.location;
    }

    // Salary match
    if (user.minSalary && job.salary) {
      const jobSalary = parseInt(job.salary);
      if (!isNaN(jobSalary) && jobSalary >= user.minSalary) {
        score += weights.salary;
      }
    }

    return Math.round(score * 100); // Convert to percentage
  }

  static async getJobRecommendationsForUser(userId: string, limit: number = 10) {
    try {
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: {
          id: true,
          skills: true,
          university: true,
          fieldOfStudy: true,
          preferredJobTypes: true,
          preferredLocations: true,
          minSalary: true,
          remotePreference: true,
          isStudent: true,
        }
      });

      if (!user) {
        throw new ResourceNotFoundError(`User with ID ${userId} not found.`);
      }

      const hasProfileData =
        (user.skills?.length ?? 0) > 0 ||
        (user.preferredJobTypes?.length ?? 0) > 0 ||
        (user.preferredLocations?.length ?? 0) > 0 ||
        Boolean(user.fieldOfStudy) ||
        Boolean(user.university) ||
        user.minSalary !== null ||
        Boolean(user.remotePreference);

      if (!hasProfileData) {
        return [];
      }

      const allOpenJobs = await prisma.job.findMany({
        where: {
          isActive: true,
          isDraft: false,
          applications: {
            none: {
              applicantId: userId
            }
          }
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              location: true
            }
          }
        }
      });

      const scoredJobs = allOpenJobs
        .map((job) => ({
          ...job,
          matchScore: MatchService.scoreJobForUser(user, job),
        }))
        .filter((job) => job.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

      return scoredJobs;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving job recommendations. Please try again later.');
    }
  }

  static async getCandidateRecommendationsForJob(jobId: string, companyId: string, limit: number = 10) {
    try {
      // Check if job exists and belongs to company
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          companyId: true,
          title: true,
          requirements: true,
          description: true
        }
      });

      if (!job) {
        throw new ResourceNotFoundError(`Job with ID ${jobId} not found.`);
      }

      if (job.companyId !== companyId) {
        throw new ResourceNotFoundError('You do not have permission to access this job.');
      }

      // Extract keywords from job description and requirements
      const jobKeywords = [
        ...(job.requirements?.flatMap(req => req.toLowerCase().split(/[\s,;]+/)) || []),
        ...(job.description?.toLowerCase().split(/[\s,;]+/) || []),
        ...(job.title?.toLowerCase().split(/[\s,;]+/) || [])
      ];

      // Get all users who haven't applied to this job yet
      const users = await prisma.user.findMany({
        where: {
          applications: {
            none: {
              jobId
            }
          }
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          skills: true,
          university: true,
          resume: true,
        }
      });

      // Score candidates based on skill match
      const scoredCandidates = users.map(user => {
        let score = 0;

        // Score based on skills match
        if (user.skills && user.skills.length > 0) {
          for (const skill of user.skills) {
            if (jobKeywords.some(keyword => keyword.includes(skill.toLowerCase()))) {
              score += 10;
            }
          }
        }

        // Bonus for having a resume and portfolio
        if (user.resume) score += 5;

        return { user, score };
      });

      // Sort by score (descending) and return top results
      return scoredCandidates
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.user);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('An error occurred while retrieving candidate recommendations. Please try again later.');
    }
  }
} 