import { Request, Response } from 'express';
import { CompanyService } from '../services/companyService';
import { CreateCompanyDto, UpdateCompanyDto, RegisterCompanyDto } from '../types/company.types';
import {
  EmailAlreadyExistsError,
  PasswordMismatchError,
  InvalidEmailFormatError,
  InvalidPasswordError,
  CompanyNameRequiredError,
  ValidationError,
  ResourceNotFoundError,
} from '../utils/errors';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  // Ownership guard: a company may only manage its OWN account. The identity
  // comes from the authenticated token (set by authenticateCompany), never the
  // request body.
  private ensureOwnCompany(req: Request, res: Response): boolean {
    if (!req.company || req.company.id !== String(req.params.id)) {
      res.status(403).json({
        success: false,
        message: 'You can only manage your own company account.',
        error: 'COMPANY_ACCESS_FORBIDDEN',
      });
      return false;
    }
    return true;
  }

  // Register a new company (public). Reuses the shared password hashing and
  // validation; companies live in their own table so they are always
  // distinguishable from user accounts.
  register = async (req: Request, res: Response) => {
    try {
      const { name, email, password, confirmPassword, industry, location, phoneNumber, companyType, website } =
        req.body as RegisterCompanyDto;
      const company = await CompanyService.register({
        name,
        email,
        password,
        confirmPassword,
        industry,
        location,
        phoneNumber,
        companyType,
        website,
      });
      res.status(201).json({
        success: true,
        message: 'Company registered successfully',
        company,
      });
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        res.status(409).json({ success: false, message: error.message, error: 'EMAIL_ALREADY_EXISTS' });
      } else if (
        error instanceof PasswordMismatchError ||
        error instanceof InvalidEmailFormatError ||
        error instanceof InvalidPasswordError ||
        error instanceof CompanyNameRequiredError ||
        error instanceof ValidationError
      ) {
        res.status(400).json({ success: false, message: error.message, error: 'VALIDATION_ERROR' });
      } else {
        res.status(500).json({ success: false, message: 'An unexpected error occurred', error: 'INTERNAL_SERVER_ERROR' });
      }
    }
  };

  // Get company by ID
  getCompanyById = async (req: Request, res: Response) => {
    try {
     const companyId = String(req.params.id);
      const company = await CompanyService.getCompanyById(companyId);
      res.json(company);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Update company profile (owner only)
  updateCompany = async (req: Request, res: Response) => {
    if (!this.ensureOwnCompany(req, res)) return;
    try {
      const companyId = String(req.params.id);
      const companyData = req.body as UpdateCompanyDto;
      const updatedCompany = await CompanyService.updateCompany(companyId, companyData);
      res.json(updatedCompany);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Get company's jobs
  getCompanyJobs = async (req: Request, res: Response) => {
    try {
      const companyId = String(req.params.id);
      const jobs = await CompanyService.getCompanyJobs(companyId);
      res.json(jobs);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Create a new company
  createCompany = async (req: Request, res: Response) => {
    try {
      const companyData = req.body as CreateCompanyDto;
      const company = await this.companyService.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get company by name
  getCompanyByName = async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const company = await this.companyService.getCompanyByName(String(name));;
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
      } else {
        res.json(company);
      }
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Delete company (owner only)
  deleteCompany = async (req: Request, res: Response) => {
    if (!this.ensureOwnCompany(req, res)) return;
    try {
      const { id } = req.params;
      const company = await this.companyService.deleteCompany(String(id));
      res.json({ message: 'Company deleted successfully', company });
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get all companies
  getAllCompanies = async (_: Request, res: Response) => {
    try {
      const companies = await this.companyService.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get companies by size
  getCompaniesBySize = async (req: Request, res: Response) => {
    try {
      const { size } = req.params;
      const companies = await this.companyService.getCompaniesBySize(size as any);
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get companies by industry
  getCompaniesByIndustry = async (req: Request, res: Response) => {
    try {
      const { industry } = req.params;
     const companies = await this.companyService.getCompaniesByIndustry(String(industry));
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Update company logo (owner only)
  updateCompanyLogo = async (req: Request, res: Response) => {
    if (!this.ensureOwnCompany(req, res)) return;
    try {
      const { id } = req.params;
      const { logoUrl } = req.body;
      const company = await this.companyService.updateCompanyLogo(String(id), logoUrl);
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get company's active jobs
  getCompanyActiveJobs = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
     const jobs = await this.companyService.getCompanyActiveJobs(String(id));
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };

  // Get company's job applications (owner only)
  getCompanyJobApplications = async (req: Request, res: Response) => {
    if (!this.ensureOwnCompany(req, res)) return;
    try {
      const { id } = req.params;
     const applications = await this.companyService.getCompanyJobApplications(String(id));
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };
}
