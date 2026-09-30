import { Worker, Job } from 'bullmq';
import { redisOptions } from '../config/redis';
import { QUEUE_NAME, AddEmailJobPayload, addEmailToQueue } from '../queues/email.queue';
import { prisma } from '../config/database';
import { sendMailViaEthereal } from '../utils/mailer';
import { RateLimitService } from '../services/ratelimit.service';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { SlackService } from '../services/slack.service';
import { EmailStatus } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

export const emailWorker = new Worker<AddEmailJobPayload>(
  QUEUE_NAME,
  async (job: Job<AddEmailJobPayload>) => {
    const { emailId, recipientEmail, subject, body } = job.data;

    console.log(`\n⚙️ [Worker] Picked up job ${job.id} for Email ID: ${emailId} -> ${recipientEmail}`);

    // 1. Fetch email record from PostgreSQL (Source of Truth)
    const emailRecord = await prisma.email.findUnique({
      where: { id: emailId },
      include: { sender: true, campaign: true },
    });

    if (!emailRecord) {
      console.warn(`⚠️ [Worker] Email record ${emailId} not found in PostgreSQL. Skipping.`);
      return { skipped: true, reason: 'Record not found' };
    }

    // 2. Idempotency Check: If already SENT, skip sending immediately (NEVER touches Redis rate-limit)
    if (emailRecord.status === EmailStatus.SENT) {
      console.log(`🛡️ [Idempotency] Email ${emailId} is already SENT. Skipping duplicate send.`);
      return { skipped: true, reason: 'Already SENT' };
    }

    // 3. ATOMIC DB CLAIM FIRST: Transition specific email ID from SCHEDULED/QUEUED -> PROCESSING
    const claimResult = await prisma.email.updateMany({
      where: {
        id: emailId,
        status: { in: [EmailStatus.SCHEDULED, EmailStatus.QUEUED] },
      },
      data: {
        status: EmailStatus.PROCESSING,
        attempts: { increment: 1 },
      },
    });

    if (claimResult.count === 0) {
      console.warn(`⚠️ [Worker] Could not claim email ${emailId}. Current status is not SCHEDULED or QUEUED (already PROCESSING, SENT, or FAILED). Skipping execution.`);
      return { skipped: true, reason: 'Could not claim row for processing' };
    }

    // 4. RATE-LIMIT RESERVATION (Only executed AFTER successful DB claim)
    const hourlyLimit = emailRecord.campaign?.hourlyLimit || 100;
    const senderId = emailRecord.senderId || 'default-sender';

    const rateLimit = await RateLimitService.reserveSlot(senderId, hourlyLimit);

    if (!rateLimit.allowed) {
      // 🛑 RATE LIMIT REACHED FOR THIS HOUR -> RESCHEDULE TO NEXT HOUR
      const { delayMs, nextHourDate } = RateLimitService.getNextHourDelay();

      console.log(`\n🛑 [Rate Limit Reached]`);
      console.log(` 👤 Sender ID:          ${senderId}`);
      console.log(` ⏰ Current Hour:        ${rateLimit.hourString}`);
      console.log(` 📊 Current Usage:       ${rateLimit.currentUsage}/${rateLimit.limit}`);
      console.log(` 🔒 Configured Limit:    ${rateLimit.limit} emails/hour`);
      console.log(` 🔄 Decision:            RESCHEDULED for next hour`);
      console.log(` ⏳ Next Scheduled Time: ${nextHourDate.toISOString()} (Delay: ${Math.round(delayMs / 1000)}s)`);

      // Enqueue persistent BullMQ delayed job for top of next hour
      const rescheduledJobId = `email-job-${emailId}-rescheduled-${nextHourDate.getTime()}`;

      const newJob = await addEmailToQueue({
        emailId: emailRecord.id,
        campaignId: emailRecord.campaignId || undefined,
        senderId: emailRecord.senderId || undefined,
        recipientEmail: emailRecord.recipientEmail,
        subject: emailRecord.subject,
        body: emailRecord.body,
        idempotencyKey: rescheduledJobId,
        delayMs,
      });

      // Update PostgreSQL source of truth back to QUEUED for next hour
      await prisma.email.update({
        where: { id: emailId },
        data: {
          scheduledAt: nextHourDate,
          bullJobId: newJob.id,
          status: EmailStatus.QUEUED,
        },
      });

      // Update status in Elasticsearch (Fail-safe)
      await ElasticsearchService.updateEmailStatus(emailRecord.id, EmailStatus.QUEUED, { scheduledAt: nextHourDate });

      // Trigger Slack Notification to connected user (Fail-safe, non-blocking)
      const campaignOwnerId = emailRecord.campaign?.userId || emailRecord.sender?.userId;
      if (campaignOwnerId) {
        await SlackService.sendRateLimitNotification(campaignOwnerId, {
          emailId: emailRecord.id,
          recipientEmail: emailRecord.recipientEmail,
          subject: emailRecord.subject,
          currentUsage: rateLimit.currentUsage,
          hourlyLimit: rateLimit.limit,
          nextScheduledTime: nextHourDate.toISOString(),
          hourString: rateLimit.hourString,
        });
      }

      return {
        rescheduled: true,
        reason: 'Hourly rate limit reached',
        senderId,
        hourString: rateLimit.hourString,
        currentUsage: rateLimit.currentUsage,
        limit: rateLimit.limit,
        nextScheduledTime: nextHourDate.toISOString(),
      };
    }

    // 🟢 RATE LIMIT SLOT RESERVED & DB RECORD CLAIMED -> PROCEED TO SMTP SEND
    console.log(`\n🟢 [Rate Limit Reserved & DB Claimed]`);
    console.log(` 👤 Sender ID:          ${senderId}`);
    console.log(` ⏰ Current Hour:        ${rateLimit.hourString}`);
    console.log(` 📊 Slot Reserved:      ${rateLimit.currentUsage}/${rateLimit.limit}`);
    console.log(` 🔒 Configured Limit:    ${rateLimit.limit} emails/hour`);
    console.log(` 📤 Decision:            DISPATCHING VIA SMTP`);

    // Determine sender address
    const fromAddress = emailRecord.sender
      ? `"${emailRecord.sender.name}" <${emailRecord.sender.email}>`
      : '"ReachInbox Outreach" <oliver.brown@domain.io>';

    try {
      // 5. Send email via Ethereal SMTP
      console.log(`📤 [SMTP] Dispatching email to ${recipientEmail} via Ethereal SMTP...`);
      const mailResult = await sendMailViaEthereal({
        from: fromAddress,
        to: recipientEmail,
        subject,
        html: body,
      });

      // 6. Update PostgreSQL on Success: status = SENT, sentAt, messageId
      const updatedEmail = await prisma.email.update({
        where: { id: emailId },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          messageId: mailResult.messageId,
        },
      });

      // Update status in Elasticsearch (Fail-safe)
      await ElasticsearchService.updateEmailStatus(emailRecord.id, EmailStatus.SENT, {
        sentAt: updatedEmail.sentAt,
        messageId: mailResult.messageId,
      });

      console.log(`✅ [SMTP] Email ${emailId} SENT successfully!`);
      console.log(`🆔 Message ID: ${mailResult.messageId}`);
      if (mailResult.previewUrl) {
        console.log(`🔗 Ethereal Preview URL: ${mailResult.previewUrl}`);
      }

      return {
        success: true,
        emailId: updatedEmail.id,
        status: updatedEmail.status,
        sentAt: updatedEmail.sentAt,
        messageId: mailResult.messageId,
        previewUrl: mailResult.previewUrl,
        rateLimitUsage: `${rateLimit.currentUsage}/${rateLimit.limit}`,
      };
    } catch (error: any) {
      console.error(`❌ [SMTP Error] Failed to send email ${emailId}:`, error.message);

      // Update DB status to FAILED on error
      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: EmailStatus.FAILED,
        },
      });

      // Update status in Elasticsearch (Fail-safe)
      await ElasticsearchService.updateEmailStatus(emailRecord.id, EmailStatus.FAILED);

      // Re-throw error so BullMQ triggers retry/backoff mechanism
      throw error;
    }
  },
  {
    connection: redisOptions,
    concurrency, // Configurable worker concurrency
  }
);

emailWorker.on('completed', (job, result) => {
  console.log(`🎉 [Worker] Job ${job.id} completed. Result:`, result);
});

emailWorker.on('failed', (job, err) => {
  console.error(`💥 [Worker] Job ${job?.id} failed. Attempt ${job?.attemptsMade}. Error:`, err.message);
});
