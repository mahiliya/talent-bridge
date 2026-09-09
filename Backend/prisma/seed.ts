import {
  PrismaClient,
  JobType,
  ExperienceLevel,
  CompanySize,
  TargetAudience,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Fixed IDs make this seed idempotent: re-running upserts the same rows
// instead of creating duplicates. Existing users and any other data are
// never read or modified.
const COMPANY_ID = '11111111-1111-1111-1111-111111111111';

const DAY = 24 * 60 * 60 * 1000;

interface SeedJob {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  location: string;
  salary: string;
  internshipDuration: string;
}

const JOBS: SeedJob[] = [
  {
    id: '22222222-0000-0000-0000-000000000001',
    title: 'Frontend Developer Intern',
    description:
      'Join our web team to build responsive user interfaces with React, JavaScript, HTML and CSS. Great for students who love crafting clean, accessible UI.',
    requirements: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
    responsibilities: [
      'Build reusable React components',
      'Translate designs into responsive pages',
      'Fix UI bugs and improve accessibility',
    ],
    location: 'Addis Ababa',
    salary: '8000',
    internshipDuration: '3 months',
  },
  {
    id: '22222222-0000-0000-0000-000000000002',
    title: 'Backend Developer Intern',
    description:
      'Work on our Node.js and Express APIs backed by PostgreSQL and Prisma. Learn how production TypeScript services are designed and tested.',
    requirements: ['Node.js', 'Express', 'PostgreSQL', 'TypeScript', 'REST APIs'],
    responsibilities: [
      'Implement REST API endpoints',
      'Write database queries with Prisma',
      'Add unit tests for services',
    ],
    location: 'Addis Ababa',
    salary: '9000',
    internshipDuration: '6 months',
  },
  {
    id: '22222222-0000-0000-0000-000000000003',
    title: 'Data Analyst Intern',
    description:
      'Help our analytics team turn raw data into insight using Python, SQL and data visualization. Remote-friendly role for curious problem solvers.',
    requirements: ['Python', 'SQL', 'Data Visualization', 'Excel', 'Statistics'],
    responsibilities: [
      'Build dashboards and reports',
      'Clean and analyze datasets',
      'Present findings to stakeholders',
    ],
    location: 'Remote',
    salary: '8500',
    internshipDuration: '3 months',
  },
  {
    id: '22222222-0000-0000-0000-000000000004',
    title: 'Social Media Marketing Intern',
    description:
      'Own our social media management and content creation across platforms. Perfect for creative communicators who understand digital audiences.',
    requirements: [
      'Social Media Management',
      'Content Creation',
      'Communication',
      'Copywriting',
    ],
    responsibilities: [
      'Plan and schedule social media content',
      'Draft copy and simple graphics',
      'Track engagement metrics',
    ],
    location: 'Addis Ababa',
    salary: '6000',
    internshipDuration: '4 months',
  },
  {
    id: '22222222-0000-0000-0000-000000000005',
    title: 'UI/UX Design Intern',
    description:
      'Design intuitive product experiences with Figma. You will prototype, run usability checks and hand off polished designs to engineering.',
    requirements: ['Figma', 'Prototyping', 'Design', 'User Research'],
    responsibilities: [
      'Create wireframes and prototypes',
      'Maintain the design system',
      'Collaborate with developers on handoff',
    ],
    location: 'Addis Ababa',
    salary: '7000',
    internshipDuration: '3 months',
  },
  {
    id: '22222222-0000-0000-0000-000000000006',
    title: 'Mobile App Developer Intern',
    description:
      'Build cross-platform mobile apps with Flutter and Dart. Learn mobile architecture, state management and app store delivery.',
    requirements: ['Flutter', 'Dart', 'Mobile', 'Git'],
    responsibilities: [
      'Implement mobile screens and flows',
      'Integrate REST APIs',
      'Help ship releases to app stores',
    ],
    location: 'Bahir Dar',
    salary: '8000',
    internshipDuration: '6 months',
  },
];

async function main() {
  const deadline = new Date(Date.now() + 60 * DAY);
  const hashedPassword = await bcrypt.hash('Password123', 10);

  const company = await prisma.company.upsert({
    where: { email: 'careers@bluetech.example' },
    // Do not overwrite the password/verification if the company already exists.
    update: {
      name: 'BlueTech Solutions',
      description:
        'A technology company building web, data and mobile products, mentoring the next generation of interns.',
      industry: 'Technology',
      location: 'Addis Ababa',
      website: 'https://bluetech.example',
      foundedYear: 2018,
      isVerified: true,
      size: CompanySize.MEDIUM,
    },
    create: {
      id: COMPANY_ID,
      name: 'BlueTech Solutions',
      email: 'careers@bluetech.example',
      password: hashedPassword,
      description:
        'A technology company building web, data and mobile products, mentoring the next generation of interns.',
      industry: 'Technology',
      location: 'Addis Ababa',
      website: 'https://bluetech.example',
      foundedYear: 2018,
      isVerified: true,
      size: CompanySize.MEDIUM,
    },
  });

  for (const job of JOBS) {
    const data = {
      companyId: company.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      location: job.location,
      salary: job.salary,
      jobType: JobType.INTERNSHIP,
      experienceLevel: ExperienceLevel.ENTRY,
      isInternship: true,
      internshipDuration: job.internshipDuration,
      targetAudience: [TargetAudience.STUDENTS, TargetAudience.BOTH],
      deadline,
      isActive: true,
    };

    await prisma.job.upsert({
      where: { id: job.id },
      update: data,
      create: { id: job.id, ...data },
    });
  }

  const jobCount = await prisma.job.count({ where: { companyId: company.id } });
  console.log(`Seed complete: company "${company.name}" with ${jobCount} active internship jobs.`);
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
