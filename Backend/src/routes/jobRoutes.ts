import express from 'express';
import { JobController } from '../controllers/jobController';
import { RequestHandler } from 'express';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();
const jobController = new JobController();

// Create a new job
router.post('/', jobController.createJob as RequestHandler);

// Get all jobs with filters
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

// Apply for a job
router.post('/:id/apply', authenticateUser, jobController.applyForJob as RequestHandler);

// Toggle job active status
router.patch('/:id/toggle', jobController.toggleJobActiveStatus as RequestHandler);

// Get job by ID
router.get('/:id', jobController.getJobById as RequestHandler);

// Update job
router.put('/:id', jobController.updateJob as RequestHandler);

// Delete job
router.delete('/:id', jobController.deleteJob as RequestHandler);

export default router;
