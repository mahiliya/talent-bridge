import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, authenticateUser } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// Register a new user (public)
router.post('/register', userController.register as any);

// Get all students (authentication required; password-free projection)
router.get('/students', authenticate, userController.getAllStudents as any);

// Get all graduates (authentication required; password-free projection)
router.get('/graduates', authenticate, userController.getAllGraduates as any);

// Get user by ID
router.get('/:id', authenticateUser, userController.getUserById as any);

// Update user profile
router.put('/:id', authenticateUser, userController.updateUser as any);

// Upload resume
router.put('/:id/resume', authenticateUser, userController.uploadResume as any);

// Upload portfolio
router.put('/:id/portfolio', authenticateUser, userController.uploadPortfolio as any);

// Update skills
router.put('/:id/skills', authenticateUser, userController.updateSkills as any);

// Update user preferences
router.put('/:id/preferences', authenticateUser, userController.updatePreferences as any);

export default router;

