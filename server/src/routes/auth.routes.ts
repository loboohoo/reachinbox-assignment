import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Google OAuth 2.0 routes
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleCallback);

// Profile and Session management routes
router.get('/me', authenticate, AuthController.getMe);
router.post('/logout', AuthController.logout);

export default router;
