import "dotenv/config";
import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import {
  campaigns,
  campaignRecipients,
  campaignEvents,
} from "../lib/db-schema";
import { sendCampaignEmail } from "../lib/email";
import { QUEUE_NAME, type EmailJobData } from "../lib/queue/email-queue";

// --- connections (standalone process, not part of Next.js) ---

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
console.log(`[Worker] Connecting to Redis at ${REDIS_URL}`);
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[Worker] DATABASE_URL is required — exiting");
  process.exit(1);
}

console.log("[Worker] Connecting to PostgreSQL...");
const sql_client = postgres(DATABASE_URL);
const db = drizzle(sql_client);

// --- helpers ---

async function checkCampaignCompletion(campaignId: string) {
  const [result] = await db
    .select({
      pending: sql<number>`count(case when ${campaignRecipients.status} = 'pending' then 1 end)::int`,
      total: sql<number>`count(*)::int`,
      sent: sql<number>`count(case when ${campaignRecipients.status} = 'sent' then 1 end)::int`,
      delivered: sql<number>`count(case when ${campaignRecipients.status} in ('delivered','opened','clicked') then 1 end)::int`,
      bounced: sql<number>`count(case when ${campaignRecipients.status} = 'bounced' then 1 end)::int`,
    })
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId));

  console.log(
    `[Worker] Campaign ${campaignId} progress: ${result.pending} pending, ${result.sent} sent, ${result.delivered} delivered, ${result.bounced} bounced (${result.total} total)`
  );

  if (result.pending > 0) return; // still processing

  // All recipients processed — finalize
  const finalStatus = result.sent === 0 && result.delivered === 0 ? "failed" : "sent";

  await db
    .update(campaigns)
    .set({
      status: finalStatus,
      statsCache: {
        sent: result.sent + result.delivered,
        opened: 0,
        clicked: 0,
        bounced: result.bounced,
        unique_opens: 0,
        unique_clicks: 0,
        total: result.total,
      },
    })
    .where(eq(campaigns.id, campaignId));

  console.log(
    `[Worker] ✓ Campaign ${campaignId} COMPLETED → "${finalStatus}" (${result.sent + result.delivered} sent, ${result.bounced} bounced)`
  );
}

// --- worker ---

const worker = new Worker<EmailJobData>(
  QUEUE_NAME,
  async (job: Job<EmailJobData>) => {
    const {
      campaignId,
      recipientId,
      crId,
      email,
      fromAddress,
      replyTo,
      subject,
      contentHtml,
      orgId,
    } = job.data;

    console.log(`[Worker] [Job ${job.id}] Sending to ${email} (attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3})`);

    const resendEmailId = await sendCampaignEmail({
      to: email,
      from: fromAddress,
      replyTo: replyTo || undefined,
      subject,
      html: contentHtml,
      campaignId,
      recipientId,
      recipientEmail: email,
      orgId,
    });

    // Mark as sent
    await db
      .update(campaignRecipients)
      .set({
        status: "sent",
        sentAt: new Date(),
        resendEmailId,
      })
      .where(eq(campaignRecipients.id, crId));

    await db.insert(campaignEvents).values({
      campaignId,
      recipientId,
      eventType: "sent",
      eventData: { resendEmailId },
    });

    console.log(`[Worker] [Job ${job.id}] ✓ Sent to ${email} → Resend ID: ${resendEmailId}`);
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

// On job completion, check if campaign is done
worker.on("completed", async (job) => {
  if (!job) return;
  console.log(`[Worker] [Job ${job.id}] Completed — checking campaign completion...`);
  try {
    await checkCampaignCompletion(job.data.campaignId);
  } catch (err) {
    console.error(`[Worker] Error checking campaign completion:`, err);
  }
});

// On final failure (all retries exhausted), mark as bounced
worker.on("failed", async (job, err) => {
  if (!job) return;
  const isFinal = job.attemptsMade >= (job.opts.attempts ?? 3);
  console.error(
    `[Worker] [Job ${job.id}] ✗ Failed (attempt ${job.attemptsMade}/${job.opts.attempts || 3}${isFinal ? " — FINAL" : " — will retry"}): ${err.message}`
  );

  if (isFinal) {
    try {
      console.log(`[Worker] [Job ${job.id}] Marking ${job.data.email} as bounced (soft)`);
      await db
        .update(campaignRecipients)
        .set({
          status: "bounced",
          bouncedAt: new Date(),
          bounceType: "soft",
        })
        .where(eq(campaignRecipients.id, job.data.crId));

      await checkCampaignCompletion(job.data.campaignId);
    } catch (dbErr) {
      console.error("[Worker] Error updating bounced status:", dbErr);
    }
  }
});

worker.on("error", (err) => {
  console.error("[Worker] Worker error:", err.message);
});

connection.on("connect", () => {
  console.log("[Worker] Redis connected");
});

connection.on("error", (err) => {
  console.error("[Worker] Redis connection error:", err.message);
});

console.log(`[Worker] Email worker started. Listening on queue "${QUEUE_NAME}"...`);
console.log(`[Worker] Concurrency: 5 | Rate limit: 10 jobs/sec | Retries: 3 with exponential backoff`);

// Graceful shutdown
async function shutdown() {
  console.log("[Worker] Shutting down gracefully...");
  await worker.close();
  console.log("[Worker] Worker closed");
  await connection.quit();
  console.log("[Worker] Redis disconnected");
  await sql_client.end();
  console.log("[Worker] Database disconnected");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
