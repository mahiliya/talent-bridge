# Talent Bridge Backend

A backend API for a platform connecting university graduates with companies for job opportunities.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- TypeScript
- JWT Authentication

## Project Structure

The project follows clean architecture principles:

- **Routes**: Handle API endpoints and requests
- **Controllers**: Process requests and return responses
- **Services**: Contain business logic
- **Middleware**: Handle authentication and request validation
- **Utils**: Contain helper functions and error classes
- **Prisma**: Database schema and models

## Getting Started

### Prerequisites

- Node.js (16+)
- PostgreSQL

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/talent-bridge-backend.git
   cd talent-bridge-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy the `.env.example` file to `.env` and update the variables with your database credentials:

   ```bash
   cp .env.example .env
   ```

4. Set up the database:

   ```bash
   npx prisma migrate dev --name init
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login for users and companies
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current authenticated user/company
- `POST /api/auth/refresh-token` - Refresh access token

### Users

- `POST /api/users/register` - Register a new user (duplicate of auth/register)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/resume` - Upload resume URL
- `POST /api/users/portfolio` - Upload portfolio URL
- `PUT /api/users/skills` - Update skills

### Companies

- `POST /api/companies/register` - Register a new company
- `GET /api/companies/profile` - Get company profile
- `PUT /api/companies/profile` - Update company profile
- `GET /api/companies/jobs` - Get jobs posted by the authenticated company

### Jobs

- `POST /api/jobs` - Create a job posting (company only)
- `GET /api/jobs` - Get all jobs (with filters)
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job (company only)
- `DELETE /api/jobs/:id` - Delete job (company only)
- `POST /api/jobs/:id/apply` - Apply for a job (user only)

### Applications

- `GET /api/applications` - Get applications (filtered by user or company)
- `GET /api/applications/:id` - Get application details
- `PUT /api/applications/:id/status` - Update application status (company only)
- `DELETE /api/applications/:id` - Withdraw application (user only)

### Match (Recommendations)

- `GET /api/matches/jobs` - Get job recommendations for a user
- `GET /api/matches/candidates?jobId=X` - Get candidate recommendations for a job

## Authentication

The system uses JWT tokens for authentication:

- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- All protected routes require a valid JWT token in the Authorization header

## Database Schema

- **User**: Student/graduate profiles
- **Company**: Company profiles
- **Job**: Job postings
- **Application**: Job applications from users

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run TypeScript linter
- `npx prisma studio` - Run Prisma database UI
- `npx prisma migrate dev` - Run database migrations
- `npx prisma generate` - Generate Prisma client
