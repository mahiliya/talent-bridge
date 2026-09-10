import express from 'express';
import { JobController } from '../controllers/jobController';
import { RequestHandler } from 'express';
import { authenticateUser, authenticateCompany, optionalAuthenticate } from '../middleware/auth';

const router = express.Router();
const jobController = new JobController();

// Create a new opportunity (Company only)
router.post('/', authenticateCompany, jobController.createJob as RequestHandler);

// List the authenticated company's own opportunities, drafts included
// (declared before "/:id" so it is not captured as an id).
router.get('/mine', authenticateCompany, jobController.getMyJobs as RequestHandler);

// Get all jobs with filters (public — published + active only)
router.get('/', jobController.getAllJobs as RequestHandler);

// Get jobs by type
router.get('/type/:type', jobController.getJobsByType as RequestHandler);

// Get jobs by experience level
router.get('/experience/:level', jobController.getJobsByExperienceLevel as RequestHandler);

// Get jobs by target audience
router.get('/audience/:audience', jobController.getJobsByTargetAudience as RequestHandler);

// Get jobs by company
router.get('/company/:companyId', jobController.getJobsByCompany as RequestHandler);

// Get jobs by location
router.get('/location/:location', jobController.getJobsByLocation as RequestHandler);

// Get jobs by salary range
router.get('/salary', jobController.getJobsBySalaryRange as RequestHandler);

// Get jobs by skills
router.get('/skills', jobController.getJobsBySkills as RequestHandler);

// Apply for a job (User only)
router.post('/:id/apply', authenticateUser, jobController.applyForJob as RequestHandler);

// Publish a draft opportunity (Company only)
router.patch('/:id/publish', authenticateCompany, jobController.publishJob as RequestHandler);

// Toggle opportunity active status (Company only)
router.patch('/:id/toggle', authenticateCompany, jobController.toggleJobActiveStatus as RequestHandler);

// Get job by ID (public for published+active; owner-only for drafts/inactive)
router.get('/:id', optionalAuthenticate, jobController.getJobById as RequestHandler);

// Update/edit an opportunity (Company only)
router.put('/:id', authenticateCompany, jobController.updateJob as RequestHandler);

// Delete an opportunity (Company only)
router.delete('/:id', authenticateCompany, jobController.deleteJob as RequestHandler);

export default router;
