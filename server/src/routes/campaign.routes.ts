import { Router } from 'express';
import { CampaignController } from '../controllers/campaign.controller';

const router = Router();

// Schedule a campaign and enqueue delayed email jobs
router.post('/schedule', CampaignController.scheduleCampaign);

// List all campaigns
router.get('/', CampaignController.getCampaigns);

export default router;
