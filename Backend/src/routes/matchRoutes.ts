import { Router } from 'express';
import { MatchController } from '../controllers/matchController';
import { authenticateCompany, authenticateUser } from '../middleware/auth';

const router = Router();
const matchController = new MatchController();

// Create a match
router.post('/', matchController.createMatch);

// Get user matches
router.get('/user/:userId', authenticateUser, matchController.getUserMatches);

// Get job matches
router.get('/job/:jobId', matchController.getJobMatches);

// Get company matches
router.get('/company/:companyId', matchController.getCompanyMatches);

// Get top matches for user
router.get('/user/:userId/top', authenticateUser, matchController.getTopMatchesForUser);

// Get top matches for job
router.get('/job/:jobId/top', matchController.getTopMatchesForJob);

// Calculate match score
router.get('/score/:userId/:jobId', matchController.calculateMatchScore);

// Get job recommendations for user
router.get('/recommendations/jobs/:userId', authenticateUser, matchController.getJobRecommendations);

// Get candidate recommendations for job
router.get('/recommendations/candidates/:jobId/:companyId', authenticateCompany, matchController.getCandidateRecommendations);

// Get match by ID
router.get('/:id', matchController.getMatchById);

// Update match score
router.patch('/:id/score', matchController.updateMatchScore);

// Delete match
router.delete('/:id', matchController.deleteMatch);

export default router;