import { Request, Response } from 'express';
import { SlackService } from '../services/slack.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import dotenv from 'dotenv';

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

export class SlackController {
  /**
   * GET /api/slack/connect
   * Redirects authenticated user to Slack's OAuth authorization consent screen.
   */
  static connect(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const authUrl = SlackService.getSlackAuthUrl(userId);
    res.redirect(authUrl);
  }

  /**
   * GET /api/slack/callback
   * Handles Slack OAuth authorization code exchange and saves connection state.
   */
  static async callback(req: Request, res: Response) {
    const { code, state, error } = req.query;

    if (error || !code) {
      console.warn('⚠️ Slack OAuth cancelled or failed:', error);
      res.redirect(`${frontendUrl}/?slack=cancelled`);
      return;
    }

    try {
      // Retrieve userId from state or cookies
      const userId = (state as string) || (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        throw new Error('User context missing during Slack OAuth callback');
      }

      await SlackService.handleSlackCallback(code as string, userId);
      console.log(`✅ [Slack] Workspace connected successfully for User ID ${userId}`);
      res.redirect(`${frontendUrl}/?slack=connected`);
    } catch (err: any) {
      console.error('❌ Slack OAuth callback error:', err.message);
      res.redirect(`${frontendUrl}/?slack=error`);
    }
  }

  /**
   * GET /api/slack/status
   * Returns current Slack connection status for the authenticated user.
   */
  static async getStatus(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    try {
      const status = await SlackService.getSlackStatus(userId);
      res.json({ success: true, status });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/slack/disconnect
   * Disconnects/deactivates Slack connection for the authenticated user.
   */
  static async disconnect(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    try {
      const result = await SlackService.disconnectSlack(userId);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
