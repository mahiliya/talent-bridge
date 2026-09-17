// Centralized Prisma `select` projections that NEVER expose secrets.
//
// These are used in place of unscoped `include: { user/company/applicant: true }`
// so that password hashes (and company refresh/verification tokens) can never
// leak through any API response, including nested relations.

// Company fields safe to return in any API response.
// Excludes: password, refreshToken, verificationToken.
export const COMPANY_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  description: true,
  industry: true,
  location: true,
  website: true,
  foundedYear: true,
  isVerified: true,
  logo: true,
  size: true,
  phoneNumber: true,
  companyType: true,
};

// Full user profile safe to return to an AUTHORIZED viewer of that user
// (e.g. the company reviewing its own applicant). Excludes: password.
export const USER_SAFE_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  createdAt: true,
  updatedAt: true,
  resume: true,
  skills: true,
  university: true,
  currentYear: true,
  degree: true,
  expectedGraduation: true,
  fieldOfStudy: true,
  githubProfile: true,
  isGraduate: true,
  isStudent: true,
  linkedInProfile: true,
  minSalary: true,
  portfolioWebsite: true,
  preferredIndustries: true,
  preferredJobTypes: true,
  preferredLocations: true,
  remotePreference: true,
  experienceLevel: true,
};

// Minimal projection for BULK user listings (students/graduates). Excludes the
// password hash and the more private fields (resume, phone) that should not be
// dumped in bulk.
export const USER_LIST_SELECT = {
  id: true,
  fullName: true,
  email: true,
  university: true,
  fieldOfStudy: true,
  degree: true,
  skills: true,
  isStudent: true,
  isGraduate: true,
  preferredLocations: true,
  portfolioWebsite: true,
  createdAt: true,
};
