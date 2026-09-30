import { Queue } from 'bullmq';
import { redisOptions } from '../config/redis';

export const QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue(QUEUE_NAME, {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s backoff on failure
    },
    removeOnComplete: false, // Retain job history in Redis
    removeOnFail: false,
  },
});

export interface AddEmailJobPayload {
  emailId: string;
  campaignId?: string;
  senderId?: string;
  recipientEmail: string;
  subject: string;
  body: string;
  idempotencyKey?: string;
  delayMs?: number;
}

/**
 * Enqueue an email job into BullMQ using a deterministic/idempotent jobId.
 */
export async function addEmailToQueue(payload: AddEmailJobPayload) {
  // BullMQ v5+ strictly forbids colons (:) in custom job IDs
  const rawJobId = payload.idempotencyKey || `email-job-${payload.emailId}`;
  const jobId = rawJobId.replace(/:/g, '_');

  const job = await emailQueue.add('send-email', payload, {
    jobId, // Deterministic Job ID to prevent duplicate job creation
    delay: payload.delayMs || 0,
  });

  return job;
}
