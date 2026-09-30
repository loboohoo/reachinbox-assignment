import { prisma } from '../config/database';
import { addEmailToQueue } from '../queues/email.queue';
import { ElasticsearchService } from './elasticsearch.service';
import { CampaignStatus, EmailStatus } from '@prisma/client';

export interface CreateCampaignDTO {
  userId?: string;
  senderEmail?: string;
  senderName?: string;
  campaignName: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime?: string;
  minDelayBetweenEmails?: number; // In seconds
  hourlyLimit?: number;
}

export class CampaignService {
  /**
   * Schedule a new campaign and individual email records in PostgreSQL,
   * then enqueue BullMQ delayed jobs using deterministic idempotency keys.
   */
  static async scheduleCampaign(data: CreateCampaignDTO) {
    const {
      campaignName,
      recipients,
      subject,
      body,
      startTime,
      minDelayBetweenEmails = 0,
      hourlyLimit = 100,
    } = data;

    // 1. Ensure user exists (or get default user for testing)
    let user = data.userId
      ? await prisma.user.findUnique({ where: { id: data.userId } })
      : await prisma.user.findFirst();

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'oliver.brown@domain.io',
          name: 'Oliver Brown',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        },
      });
    }

    // 2. Ensure sender exists
    const senderEmail = data.senderEmail || user.email;
    let sender = await prisma.sender.findFirst({
      where: { userId: user.id, email: senderEmail },
    });

    if (!sender) {
      sender = await prisma.sender.create({
        data: {
          userId: user.id,
          name: data.senderName || user.name,
          email: senderEmail,
          smtpHost: 'smtp.ethereal.email',
          smtpPort: 587,
          smtpUser: process.env.SMTP_USER || 'ethereal_user',
          smtpPass: process.env.SMTP_PASS || 'ethereal_password',
        },
      });
    }

    // 3. Determine start time
    const startTimestamp = startTime ? new Date(startTime).getTime() : Date.now();
    const campaignStartTime = new Date(startTimestamp);

    // 4. Create Campaign record in PostgreSQL
    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: campaignName,
        status: CampaignStatus.SCHEDULED,
        startTime: campaignStartTime,
        minDelayBetweenEmails,
        hourlyLimit,
      },
    });

    // 5. Create Email records in PostgreSQL and enqueue BullMQ delayed jobs
    const createdEmails = [];
    const enqueuedJobs = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipientEmail = recipients[i];

      // Calculate initial scheduledAt per email based on minDelayBetweenEmails
      const emailScheduledTimeMs = startTimestamp + i * (minDelayBetweenEmails * 1000);
      const scheduledAt = new Date(emailScheduledTimeMs);
      const cleanEmail = recipientEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const idempotencyKey = `idempotent_${campaign.id}_${cleanEmail}_${i}`;

      // Create individual Email in PostgreSQL
      const email = await prisma.email.create({
        data: {
          campaignId: campaign.id,
          senderId: sender.id,
          recipientEmail,
          subject,
          snippet: (subject || body).slice(0, 60),
          body,
          status: EmailStatus.SCHEDULED,
          scheduledAt,
          idempotencyKey,
          attempts: 0,
        },
      });

      createdEmails.push(email);

      // Calculate BullMQ delay
      const delayMs = Math.max(0, emailScheduledTimeMs - Date.now());

      // Enqueue persistent BullMQ delayed job
      const job = await addEmailToQueue({
        emailId: email.id,
        campaignId: campaign.id,
        senderId: sender.id,
        recipientEmail: email.recipientEmail,
        subject: email.subject,
        body: email.body,
        idempotencyKey: email.idempotencyKey || email.id,
        delayMs,
      });

      // Update email record with BullMQ job ID
      await prisma.email.update({
        where: { id: email.id },
        data: { bullJobId: job.id, status: EmailStatus.QUEUED },
      });

      // Index in Elasticsearch (Fail-safe)
      await ElasticsearchService.indexEmail({
        emailId: email.id,
        campaignId: campaign.id,
        senderId: sender.id,
        sender: sender.email,
        recipient: email.recipientEmail,
        subject: email.subject,
        body: email.body,
        status: EmailStatus.QUEUED,
        scheduledAt,
        createdAt: email.createdAt,
      });

      enqueuedJobs.push({
        emailId: email.id,
        recipient: email.recipientEmail,
        scheduledAt: scheduledAt.toISOString(),
        delayMs,
        bullJobId: job.id,
      });
    }

    return {
      campaign,
      sender,
      emailsCount: createdEmails.length,
      enqueuedJobs,
    };
  }

  /**
   * Get list of all campaigns with emails summary (filtered by user if userId provided)
   */
  static async getCampaigns(userId?: string) {
    const where = userId ? { userId } : {};
    return prisma.campaign.findMany({
      where,
      include: {
        emails: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

