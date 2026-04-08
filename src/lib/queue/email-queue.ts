import { Queue } from "bullmq";
import { redis } from "../redis";

export const QUEUE_NAME = "email-sending";

export interface EmailJobData {
  campaignId: string;
  recipientId: string;
  crId: string; // campaign_recipients row ID
  email: string;
  firstName: string | null;
  fromAddress: string;
  replyTo: string | null;
  subject: string;
  contentHtml: string;
  orgId: string;
}

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

/**
 * Enqueue email jobs for a campaign in batches of 50.
 * Uses deterministic job IDs (`campaignId:recipientId`) for idempotency.
 */
export async function enqueueEmailJobs(
  jobs: EmailJobData[],
  batchSize = 50
): Promise<void> {
  console.log(`[Queue] Enqueueing ${jobs.length} jobs in batches of ${batchSize}`);
  let batchNum = 0;
  for (let i = 0; i < jobs.length; i += batchSize) {
    batchNum++;
    const batch = jobs.slice(i, i + batchSize);
    console.log(`[Queue] Adding batch ${batchNum} (${batch.length} jobs)...`);
    await emailQueue.addBulk(
      batch.map((job) => ({
        name: "send-email",
        data: job,
        opts: {
          jobId: `${job.campaignId}_${job.recipientId}`,
        },
      }))
    );
    console.log(`[Queue] Batch ${batchNum} added`);
  }
  console.log(`[Queue] All ${jobs.length} jobs enqueued in ${batchNum} batch(es)`);
}
