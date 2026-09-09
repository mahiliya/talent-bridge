import { Router } from 'express';
import { ApplicationController } from '../controllers/applicationController';
import { authenticate, authenticateCompany, authenticateUser } from '../middleware/auth';

const router = Router();
const applicationController = new ApplicationController();

// Apply for a job
router.post('/jobs/:jobId/apply', authenticateUser, applicationController.applyForJob as any);

// Get job applications
router.get('/jobs/:jobId', applicationController.getJobApplications);

// Get company applications
router.get('/companies/:companyId', applicationController.getCompanyApplications);

// Get applications by status
router.get('/status/:status', applicationController.getApplicationsByStatus);

// Get application statistics
router.get('/statistics/:companyId', applicationController.getApplicationStatistics);

// Get applications by user type and entity ID
router.get('/user/:entityId', authenticateUser, applicationController.getApplications);
router.get('/company/:entityId', authenticateCompany, applicationController.getApplications);

// Update application status
router.put('/:id/status', authenticateCompany, applicationController.updateApplicationStatus as any);

// Withdraw application
router.delete('/:id/withdraw', authenticateUser, applicationController.withdrawApplication as any);

// Get application by ID
router.get('/:id', authenticate, applicationController.getApplicationById);

export default router;