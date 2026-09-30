import { emailQueue, addEmailToQueue, AddEmailJobPayload } from '../queues/email.queue';

export class QueueService {
  /**
   * Enqueue a job into BullMQ queue with idempotent Job ID.
   */
  static async enqueueEmail(payload: AddEmailJobPayload) {
    return await addEmailToQueue(payload);
  }

  /**
   * Get live queue metrics from BullMQ.
   */
  static async getQueueMetrics() {
    const [waitingCount, activeCount, delayedCount, completedCount, failedCount] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getDelayedCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
    ]);

    return {
      waiting: waitingCount,
      active: activeCount,
      delayed: delayedCount,
      completed: completedCount,
      failed: failedCount,
    };
  }
}
