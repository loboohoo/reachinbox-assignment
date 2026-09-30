import { Request, Response } from 'express';
import { CampaignService } from '../services/campaign.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const ScheduleCampaignSchema = z.object({
  userId: z.string().optional(),
  senderEmail: z.string().email().optional(),
  senderName: z.string().optional(),
  campaignName: z.string().min(1, 'Campaign name is required'),
  recipients: z.array(z.string().email('Invalid recipient email')).min(1, 'At least 1 recipient is required'),
  subject: z.string().min(1, 'Subject line is required'),
  body: z.string().min(1, 'Email body is required'),
  startTime: z.string().optional(),
  minDelayBetweenEmails: z.number().min(0).optional(),
  hourlyLimit: z.number().min(1).optional(),
});

export class CampaignController {
  /**
   * POST /api/campaigns/schedule
   */
  static async scheduleCampaign(req: Request, res: Response) {
    try {
      const validatedData = ScheduleCampaignSchema.parse(req.body);
      const authenticatedUserId = (req as AuthenticatedRequest).user?.id;

      const result = await CampaignService.scheduleCampaign({
        ...validatedData,
        userId: authenticatedUserId || validatedData.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Campaign scheduled and emails enqueued successfully',
        data: result,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error.errors });
        return;
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/campaigns
   */
  static async getCampaigns(req: Request, res: Response) {
    try {
      const authenticatedUserId = (req as AuthenticatedRequest).user?.id;
      const campaigns = await CampaignService.getCampaigns(authenticatedUserId);
      res.json({ success: true, campaigns });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
