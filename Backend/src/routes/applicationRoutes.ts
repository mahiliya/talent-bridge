import { Router } from 'express';
import { ApplicationController } from '../controllers/applicationController';
import { authenticate, authenticateCompany, authenticateUser } from '../middleware/auth';

const router = Router();
const applicationController = new ApplicationController();

// Apply for a job
router.post('/jobs/:jobId/apply', authenticateUser, applicationController.applyForJob as any);

// Get ranked applicants for one of the company's own jobs (Company only)
router.get('/jobs/:jobId', authenticateCompany, applicationController.getJobApplications);

// Get company applications (Company only; ownership enforced in controller)
router.get('/companies/:companyId', authenticateCompany, applicationController.getCompanyApplications);

// Get applications by status (Company only; scoped to the caller's own jobs)
router.get('/status/:status', authenticateCompany, applicationController.getApplicationsByStatus);

// Get application statistics (Company only; ownership enforced in controller)
router.get('/statistics/:companyId', authenticateCompany, applicationController.getApplicationStatistics);

// Get applications by user type and entity ID
router.get('/user/:entityId', authenticateUser, applicationController.getApplications);
router.get('/company/:entityId', authenticateCompany, applicationController.getApplications);

// Update application status
router.put('/:id/status', authenticateCompany, applicationController.updateApplicationStatus as any);

// Withdraw application
router.delete('/:id/withdraw', authenticateUser, applicationController.withdrawApplication as any);

// Stream an applicant's resume (PDF). Authenticated; the service enforces that
// only the applicant or the company that owns the job may access it.
router.get('/:id/resume', authenticate, applicationController.getApplicationResume as any);

// Get application by ID
router.get('/:id', authenticate, applicationController.getApplicationById);

export default router;