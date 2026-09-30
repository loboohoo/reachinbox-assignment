import { Router } from 'express';
import { SlackController } from '../controllers/slack.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Slack OAuth endpoints
router.get('/connect', authenticate, SlackController.connect);
router.get('/callback', SlackController.callback);
router.get('/status', authenticate, SlackController.getStatus);
router.post('/disconnect', authenticate, SlackController.disconnect);

export default router;
