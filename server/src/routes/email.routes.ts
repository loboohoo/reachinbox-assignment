import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';

const router = Router();

// Full-text search email endpoint
router.get('/search', EmailController.searchEmails);

export default router;
