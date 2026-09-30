import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import dotenv from 'dotenv';

dotenv.config();

export interface SendSlackNotificationPayload {
  emailId: string;
  recipientEmail: string;
  subject: string;
  currentUsage: number;
  hourlyLimit: number;
  nextScheduledTime: string;
  hourString: string;
}

export class SlackService {
  /**
   * Generates the Slack OAuth 2.0 authorization URL.
   */
  static getSlackAuthUrl(state?: string): string {
    const rootUrl = 'https://slack.com/oauth/v2/authorize';
    const clientId = process.env.SLACK_CLIENT_ID || '';
    const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/slack/callback';

    const options = {
      client_id: clientId,
      scope: 'chat:write,incoming-webhook',
      redirect_uri: redirectUri,
      state: state || '',
    };

    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
  }

  /**
   * Exchanges authorization code for a Slack OAuth access token & webhook details,
   * then upserts the user's SlackConnection in PostgreSQL.
   */
  static async handleSlackCallback(code: string, userId: string) {
    const tokenUrl = 'https://slack.com/api/oauth.v2.access';
    const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/slack/callback';
    const clientId = process.env.SLACK_CLIENT_ID || '';
    const clientSecret = process.env.SLACK_CLIENT_SECRET || '';

    const bodyParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API error: ${errorText}`);
    }

    const data = (await response.json()) as any;

    if (!data.ok) {
      throw new Error(`Slack OAuth exchange failed: ${data.error || 'Unknown error'}`);
    }

    const accessToken = data.access_token || data.bot_user_id || '';
    const teamId = data.team?.id || null;
    const teamName = data.team?.name || 'Slack Workspace';
    const channelId = data.incoming_webhook?.channel_id || null;
    const channelName = data.incoming_webhook?.channel || '#general';
    const webhookUrl = data.incoming_webhook?.url || null;

    const slackConn = await prisma.slackConnection.upsert({
      where: { userId },
      update: {
        accessToken,
        teamId,
        teamName,
        channelId,
        channelName,
        webhookUrl,
        isConnected: true,
      },
      create: {
        userId,
        accessToken,
        teamId,
        teamName,
        channelId,
        channelName,
        webhookUrl,
        isConnected: true,
      },
    });

    return slackConn;
  }

  /**
   * Fetch current Slack connection status for a user.
   */
  static async getSlackStatus(userId: string) {
    const connection = await prisma.slackConnection.findUnique({
      where: { userId },
      select: {
        id: true,
        teamName: true,
        channelName: true,
        isConnected: true,
        createdAt: true,
      },
    });

    if (!connection || !connection.isConnected) {
      return { isConnected: false };
    }

    return {
      isConnected: true,
      teamName: connection.teamName,
      channelName: connection.channelName,
      connectedAt: connection.createdAt,
    };
  }

  /**
   * Disconnect Slack connection for a user.
   */
  static async disconnectSlack(userId: string) {
    const connection = await prisma.slackConnection.findUnique({
      where: { userId },
    });

    if (connection) {
      await prisma.slackConnection.update({
        where: { userId },
        data: { isConnected: false },
      });
    }

    return { isConnected: false, message: 'Slack disconnected successfully' };
  }

  /**
   * Dispatch rate-limit notification to Slack channel.
   * Includes duplicate-notification protection using Redis keys.
   */
  static async sendRateLimitNotification(userId: string, payload: SendSlackNotificationPayload): Promise<void> {
    try {
      // 1. Check if user has an active Slack connection in PostgreSQL
      const connection = await prisma.slackConnection.findUnique({
        where: { userId },
      });

      if (!connection || !connection.isConnected) {
        console.log(`⚠️ [Slack] Notification skipped: Slack not connected for User ${userId}.`);
        return;
      }

      // 2. Duplicate Protection: Check Redis key for email/hour combination
      const notifKey = `slack_notif:email:${payload.emailId}:${payload.hourString}`;
      const alreadySent = await redisClient.get(notifKey);

      if (alreadySent) {
        console.log(`🛡️ [Slack Duplicate Protection] Notification already dispatched for Email ${payload.emailId} in hour ${payload.hourString}. Skipping.`);
        return;
      }

      // 3. Formulate Slack message payload
      const textMessage = `🚨 *ReachInbox Alert: Hourly Email Rate Limit Reached*\n\n` +
        `• *Recipient:* \`${payload.recipientEmail}\`\n` +
        `• *Subject:* *${payload.subject}*\n` +
        `• *Status:* 🔄 *RESCHEDULED for next hour*\n` +
        `• *New Scheduled Time:* \`${payload.nextScheduledTime}\`\n` +
        `• *Hourly Limit Usage:* \`${payload.currentUsage}/${payload.hourlyLimit}\` emails/hr (${payload.hourString})\n`;

      let sentSuccess = false;

      // 4a. Try sending via Webhook URL if available
      if (connection.webhookUrl) {
        const res = await fetch(connection.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textMessage }),
        });
        if (res.ok) {
          sentSuccess = true;
        } else {
          console.warn(`⚠️ [Slack Webhook Warning] Webhook call returned status ${res.status}`);
        }
      }

      // 4b. Fallback: Try chat.postMessage API if token & channelId exist
      if (!sentSuccess && connection.accessToken && connection.channelId) {
        const res = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${connection.accessToken}`,
          },
          body: JSON.stringify({
            channel: connection.channelId,
            text: textMessage,
          }),
        });

        const slackData = (await res.json()) as any;
        if (slackData.ok) {
          sentSuccess = true;
        } else {
          console.warn(`⚠️ [Slack API Warning] chat.postMessage error:`, slackData.error);
          if (slackData.error === 'token_revoked' || slackData.error === 'account_inactive') {
            await prisma.slackConnection.update({
              where: { userId },
              data: { isConnected: false },
            });
            console.warn(`⚠️ [Slack] Connection marked as disconnected for User ${userId} due to revoked token.`);
          }
        }
      }

      if (sentSuccess) {
        // Mark notification as sent in Redis with 1 hour TTL
        await redisClient.set(notifKey, '1', 'EX', 3600);
        console.log(`💬 [Slack Notification Sent] Sent rate-limit alert for Email ${payload.emailId} to User ${userId}`);
      }
    } catch (error: any) {
      console.warn(`⚠️ [Slack Exception] Failed to send notification for User ${userId}:`, error.message);
    }
  }
}
