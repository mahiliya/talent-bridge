import { Router } from 'express';
import { MatchController } from '../controllers/matchController';
import { authenticate, authenticateCompany, authenticateUser } from '../middleware/auth';

const router = Router();
const matchController = new MatchController();

// Create a match (User only; controller enforces body.userId === self)
router.post('/', authenticateUser, matchController.createMatch);

// Get user matches (User only; own account)
router.get('/user/:userId', authenticateUser, matchController.getUserMatches);

// Get job matches (Company only; controller enforces job ownership)
router.get('/job/:jobId', authenticateCompany, matchController.getJobMatches);

// Get company matches (Company only; own company)
router.get('/company/:companyId', authenticateCompany, matchController.getCompanyMatches);

// Get top matches for user (User only; own account)
router.get('/user/:userId/top', authenticateUser, matchController.getTopMatchesForUser);

// Get top matches for job (Company only; controller enforces job ownership)
router.get('/job/:jobId/top', authenticateCompany, matchController.getTopMatchesForJob);

// Calculate match score (User only; own account)
router.get('/score/:userId/:jobId', authenticateUser, matchController.calculateMatchScore);

// Get job recommendations for user (User only; own account)
router.get('/recommendations/jobs/:userId', authenticateUser, matchController.getJobRecommendations);

// Get candidate recommendations for job (Company only; own company — IDOR-safe)
router.get('/recommendations/candidates/:jobId/:companyId', authenticateCompany, matchController.getCandidateRecommendations);

// Get match by ID (authenticated; controller enforces match ownership)
router.get('/:id', authenticate, matchController.getMatchById);

// Update match score (authenticated; controller enforces match ownership)
router.patch('/:id/score', authenticate, matchController.updateMatchScore);

// Delete match (authenticated; controller enforces match ownership)
router.delete('/:id', authenticate, matchController.deleteMatch);

export default router;