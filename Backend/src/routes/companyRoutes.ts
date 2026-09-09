import { Router } from 'express';
import { CompanyController } from '../controllers/companyController';

const router = Router();
const companyController = new CompanyController();

// Register a new company
router.post('/register', companyController.register);

// Create a new company
router.post('/', companyController.createCompany);

// Get all companies
router.get('/', companyController.getAllCompanies);

// Get company by name
router.get('/name/:name', companyController.getCompanyByName);

// Get companies by size
router.get('/size/:size', companyController.getCompaniesBySize);

// Get companies by industry
router.get('/industry/:industry', companyController.getCompaniesByIndustry);

// Get company's jobs
router.get('/:id/jobs', companyController.getCompanyJobs);

// Get company's active jobs
router.get('/:id/active-jobs', companyController.getCompanyActiveJobs);

// Get company's job applications
router.get('/:id/applications', companyController.getCompanyJobApplications);

// Update company logo
router.put('/:id/logo', companyController.updateCompanyLogo);

// Update company profile
router.put('/:id', companyController.updateCompany);

// Delete company
router.delete('/:id', companyController.deleteCompany);

export default router;