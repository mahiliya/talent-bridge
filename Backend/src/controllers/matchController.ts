import { Request, Response } from 'express';
import { MatchService } from '../services/matchService';
import {
  ResourceNotFoundError,
  DatabaseError
} from '../utils/errors';

export class MatchController {
  private matchService: MatchService;

  constructor() {
    this.matchService = new MatchService();
  }

  private ensureOwnUserRequest(req: Request, res: Response): boolean {
    if (!req.user || req.user.id !== String(req.params.userId)) {
      res.status(403).json({ error: 'You can only access your own recommendations.' });
      return false;
    }
    return true;
  }

  private ensureOwnCompanyRequest(req: Request, res: Response): boolean {
    if (!req.company || req.company.id !== String(req.params.companyId)) {
      res.status(403).json({ error: 'You can only access your own company matches.' });
      return false;
    }
    return true;
  }

  // Authorize access to a single match: allowed for the match's user, or the
  // company that owns the match's job. Returns the match, or null after sending
  // a 404/403 response.
  private async authorizeMatch(req: Request, res: Response, matchId: string) {
    const match: any = await this.matchService.getMatchById(matchId);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return null;
    }
    const ownsAsUser = Boolean(req.user) && match.userId === req.user!.id;
    const ownsAsCompany = Boolean(req.company) && match.job?.companyId === req.company!.id;
    if (!ownsAsUser && !ownsAsCompany) {
      res.status(403).json({ error: 'You do not have access to this match.' });
      return null;
    }
    return match;
  }

  // Authorize a company-scoped job match read: the job must belong to the
  // authenticated company.
  private async ensureOwnsJob(req: Request, res: Response, jobId: string): Promise<boolean> {
    const ownerCompanyId = await MatchService.getJobCompanyId(jobId);
    if (!ownerCompanyId) {
      res.status(404).json({ error: 'Job not found' });
      return false;
    }
    if (!req.company || req.company.id !== ownerCompanyId) {
      res.status(403).json({ error: 'You can only access matches for your own jobs.' });
      return false;
    }
    return true;
  }

  // Create a new match (a user may only create matches for their own account)
  createMatch = async (req: Request, res: Response) => {
    if (!req.user || String(req.body?.userId) !== req.user.id) {
      return res.status(403).json({ error: 'You can only create matches for your own account.' });
    }
    try {
      const match = await this.matchService.createMatch(req.body);
      return res.status(201).json(match);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        return res.status(404).json({ error: error.message });
      } else {
        return res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Get match by ID (owner user or owning company only)
  getMatchById = async (req: Request, res: Response) => {
    try {
      const match = await this.authorizeMatch(req, res, String(req.params.id));
      if (!match) return; // response already sent (404/403)
      return res.json(match);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Update match score (owner user or owning company only)
  updateMatchScore = async (req: Request, res: Response) => {
    try {
      const authorized = await this.authorizeMatch(req, res, String(req.params.id));
      if (!authorized) return;
      const { score } = req.body;
      const match = await this.matchService.updateMatchScore(String(req.params.id), score);
      return res.json(match);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Delete match (owner user or owning company only)
  deleteMatch = async (req: Request, res: Response) => {
    try {
      const authorized = await this.authorizeMatch(req, res, String(req.params.id));
      if (!authorized) return;
      const match = await this.matchService.deleteMatch(String(req.params.id));
      return res.json(match);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get all matches for a user
  getUserMatches = async (req: Request, res: Response) => {
    if (!this.ensureOwnUserRequest(req, res)) return;
    try {
      const matches = await this.matchService.getUserMatches(String(req.params.userId));
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get all matches for a job (owning company only)
  getJobMatches = async (req: Request, res: Response) => {
    try {
      if (!(await this.ensureOwnsJob(req, res, String(req.params.jobId)))) return;
      const matches = await this.matchService.getJobMatches(String(req.params.jobId));
      return res.json(matches);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get all matches for a company (owner only)
  getCompanyMatches = async (req: Request, res: Response) => {
    if (!this.ensureOwnCompanyRequest(req, res)) return;
    try {
      const matches = await this.matchService.getCompanyMatches(String(req.params.companyId));
      return res.json(matches);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get top matches for a user
  getTopMatchesForUser = async (req: Request, res: Response) => {
    if (!this.ensureOwnUserRequest(req, res)) return;
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
     const matches = await this.matchService.getTopMatchesForUser(String(userId), limit);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get top matches for a job (owning company only)
  getTopMatchesForJob = async (req: Request, res: Response) => {
    try {
      if (!(await this.ensureOwnsJob(req, res, String(req.params.jobId)))) return;
      const limit = parseInt(req.query.limit as string) || 10;
      const matches = await this.matchService.getTopMatchesForJob(String(req.params.jobId), limit);
      return res.json(matches);
    } catch (error) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Calculate match score between user and job (a user may only compute for self)
  calculateMatchScore = async (req: Request, res: Response) => {
    if (!req.user || req.user.id !== String(req.params.userId)) {
      return res.status(403).json({ error: 'You can only calculate scores for your own account.' });
    }
    try {
      const { userId, jobId } = req.params;
      const score = await this.matchService.calculateMatchScore(String(userId), String(jobId));
      return res.json({ score });
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        return res.status(404).json({ error: error.message });
      } else {
        return res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Get job recommendations for user
  getJobRecommendations = async (req: Request, res: Response) => {
    if (!this.ensureOwnUserRequest(req, res)) return;
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recommendations = await MatchService.getJobRecommendationsForUser(
        String(req.params.userId),
        limit
      );
      res.json(recommendations);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof DatabaseError) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Get candidate recommendations for job. The authenticated company's identity
  // (not the URL param) is used, and must match the requested company — so
  // Company A cannot read Company B's recommendations.
  getCandidateRecommendations = async (req: Request, res: Response) => {
    const { jobId, companyId } = req.params;
    if (!req.company || req.company.id !== String(companyId)) {
      return res.status(403).json({ error: 'You can only access candidate recommendations for your own company.' });
    }
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recommendations = await MatchService.getCandidateRecommendationsForJob(
        String(jobId),
        req.company.id,
        limit
      );
      return res.json(recommendations);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        return res.status(404).json({ error: error.message });
      } else if (error instanceof DatabaseError) {
        return res.status(500).json({ error: error.message });
      } else {
        return res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };
}
