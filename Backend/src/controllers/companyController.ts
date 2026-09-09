import { Request, Response } from 'express';
import { CompanyService } from '../services/companyService';
import { CreateCompanyDto, UpdateCompanyDto } from '../types/company.types';
import {
  EmailAlreadyExistsError,
  PasswordMismatchError,
  InvalidEmailFormatError,
  InvalidPasswordError,
  CompanyNameRequiredError,
  ResourceNotFoundError,
} from '../utils/errors';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  // Register a new company
  register = async (req: Request, res: Response) => {
    try {
      const { name, email, password, confirmPassword } = req.body;
      const { industry, size, location } = req.body;
      const company = await CompanyService.register(name, email, password, confirmPassword, industry, size, location);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        res.status(409).json({ error: error.message });
      } else if (error instanceof PasswordMismatchError) {
        res.status(400).json({ error: error.message });
      } else if (error instanceof InvalidEmailFormatError) {
        res.status(400).json({ error: error.message });
      } else if (error instanceof InvalidPasswordError) {
        res.status(400).json({ error: error.message });
      } else if (error instanceof CompanyNameRequiredError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Get company by ID
  getCompanyById = async (req: Request, res: Response) => {
    try {
     const companyId = parseInt(String(req.params.id), 10);
      const company = await CompanyService.getCompanyById(companyId.toString());
      res.json(company);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  };

  // Update company profile
  updateCompany = async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(String(req.params.id), 10);
      const companyData = req.body as UpdateCompanyDto;
      const updatedCompany = await CompanyService.updateCompany(companyId.toString(), companyData);
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
      const companyId = parseInt(String(req.params.id), 10);
      const jobs = await CompanyService.getCompanyJobs(companyId.toString());
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

  // Delete company
  deleteCompany = async (req: Request, res: Response) => {
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

  // Update company logo
  updateCompanyLogo = async (req: Request, res: Response) => {
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

  // Get company's job applications
  getCompanyJobApplications = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
     const applications = await this.companyService.getCompanyJobApplications(String(id));
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  };
}
