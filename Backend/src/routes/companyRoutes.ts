import { Router } from 'express';
import { CompanyController } from '../controllers/companyController';
import { authenticate, authenticateCompany } from '../middleware/auth';

const router = Router();
const companyController = new CompanyController();

// Register a new company (PUBLIC — the only unauthenticated company endpoint).
router.post('/register', companyController.register);

// Create a new company (company session required; registration is the public path).
router.post('/', authenticateCompany, companyController.createCompany);

// Directory reads: authentication required (no anonymous access), and the
// service now returns password-free company records.
router.get('/', authenticate, companyController.getAllCompanies);
router.get('/name/:name', authenticate, companyController.getCompanyByName);
router.get('/size/:size', authenticate, companyController.getCompaniesBySize);
router.get('/industry/:industry', authenticate, companyController.getCompaniesByIndustry);
router.get('/:id/jobs', authenticate, companyController.getCompanyJobs);
router.get('/:id/active-jobs', authenticate, companyController.getCompanyActiveJobs);

// Private company operations: company session + ownership (enforced in controller).
router.get('/:id/applications', authenticateCompany, companyController.getCompanyJobApplications);
router.put('/:id/logo', authenticateCompany, companyController.updateCompanyLogo);
router.put('/:id', authenticateCompany, companyController.updateCompany);
router.delete('/:id', authenticateCompany, companyController.deleteCompany);

export default router;