import express from 'express';
import { JobController } from '../controllers/jobController';
import { RequestHandler } from 'express';
import { authenticate, authenticateUser, authenticateCompany } from '../middleware/auth';

const router = express.Router();
const jobController = new JobController();

// Create a new opportunity (Company only)
router.post('/', authenticateCompany, jobController.createJob as RequestHandler);

// List the authenticated company's own opportunities, drafts included
// (declared before "/:id" so it is not captured as an id).
router.get('/mine', authenticateCompany, jobController.getMyJobs as RequestHandler);

// Browsing opportunities requires authentication (any signed-in user or
// company). Per the product rule, job data is never publicly browsable — these
// were previously public and are now gated. Company ownership, draft/inactive
// visibility, and application rules are all still enforced downstream.
router.get('/', authenticate, jobController.getAllJobs as RequestHandler);

// Get jobs by type
router.get('/type/:type', authenticate, jobController.getJobsByType as RequestHandler);

// Get jobs by experience level
router.get('/experience/:level', authenticate, jobController.getJobsByExperienceLevel as RequestHandler);

// Get jobs by target audience
router.get('/audience/:audience', authenticate, jobController.getJobsByTargetAudience as RequestHandler);

// Get jobs by company
router.get('/company/:companyId', authenticate, jobController.getJobsByCompany as RequestHandler);

// Get jobs by location
router.get('/location/:location', authenticate, jobController.getJobsByLocation as RequestHandler);

// Get jobs by salary range
router.get('/salary', authenticate, jobController.getJobsBySalaryRange as RequestHandler);

// Get jobs by skills
router.get('/skills', authenticate, jobController.getJobsBySkills as RequestHandler);

// Apply for a job (User only)
router.post('/:id/apply', authenticateUser, jobController.applyForJob as RequestHandler);

// Publish a draft opportunity (Company only)
router.patch('/:id/publish', authenticateCompany, jobController.publishJob as RequestHandler);

// Toggle opportunity active status (Company only)
router.patch('/:id/toggle', authenticateCompany, jobController.toggleJobActiveStatus as RequestHandler);

// Get job by ID. Now requires authentication (opportunities are not public).
// The controller still enforces that drafts/inactive jobs are visible only to
// the owning company; other authenticated users get a 404 for those.
router.get('/:id', authenticate, jobController.getJobById as RequestHandler);

// Update/edit an opportunity (Company only)
router.put('/:id', authenticateCompany, jobController.updateJob as RequestHandler);

// Delete an opportunity (Company only)
router.delete('/:id', authenticateCompany, jobController.deleteJob as RequestHandler);

export default router;
