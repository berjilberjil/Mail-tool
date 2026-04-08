"use server";

import { db } from "../db";
import {
  campaigns,
  campaignRecipients,
  campaignEvents,
  recipients,
  recipientLists,
  auditLog,
} from "../db-schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { requireSession } from "./auth-helpers";
import { enqueueEmailJobs, type EmailJobData } from "../queue/email-queue";

export async function getCampaigns() {
  const ctx = await requireSession();

  const rows = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.orgId, ctx.orgId))
    .orderBy(desc(campaigns.createdAt));

  return rows;
}

export async function getCampaign(id: string) {
  const ctx = await requireSession();
  const rows = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.orgId, ctx.orgId)));
  return rows[0] || null;
}

export async function getCampaignStats(campaignId: string) {
  const ctx = await requireSession();

  const stats = await db
    .select({
      total: sql<number>`count(*)::int`,
      sent: sql<number>`count(case when ${campaignRecipients.status} != 'pending' then 1 end)::int`,
      delivered: sql<number>`count(case when ${campaignRecipients.status} in ('delivered', 'opened', 'clicked') then 1 end)::int`,
      opened: sql<number>`count(case when ${campaignRecipients.openCount} > 0 then 1 end)::int`,
      clicked: sql<number>`count(case when ${campaignRecipients.clickCount} > 0 then 1 end)::int`,
      bounced: sql<number>`count(case when ${campaignRecipients.status} = 'bounced' then 1 end)::int`,
    })
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId));

  return stats[0] || { total: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
}

export async function getCampaignRecipients(campaignId: string) {
  const ctx = await requireSession();
  // Verify campaign belongs to this org
  const campaign = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.orgId, ctx.orgId)))
    .limit(1);
  if (campaign.length === 0) throw new Error("Campaign not found");

  const rows = await db
    .select({
      id: campaignRecipients.id,
      status: campaignRecipients.status,
      sentAt: campaignRecipients.sentAt,
      deliveredAt: campaignRecipients.deliveredAt,
      firstOpenedAt: campaignRecipients.firstOpenedAt,
      lastOpenedAt: campaignRecipients.lastOpenedAt,
      openCount: campaignRecipients.openCount,
      firstClickedAt: campaignRecipients.firstClickedAt,
      clickCount: campaignRecipients.clickCount,
      bouncedAt: campaignRecipients.bouncedAt,
      bounceType: campaignRecipients.bounceType,
      recipientEmail: recipients.email,
      recipientFirstName: recipients.firstName,
      recipientLastName: recipients.lastName,
      recipientCompany: recipients.company,
      recipientEngagement: recipients.engagementScore,
    })
    .from(campaignRecipients)
    .innerJoin(recipients, eq(campaignRecipients.recipientId, recipients.id))
    .where(eq(campaignRecipients.campaignId, campaignId))
    .orderBy(desc(campaignRecipients.firstOpenedAt));

  return rows;
}

export async function getCampaignOrgRollup(campaignId: string) {
  const ctx = await requireSession();
  const campaign = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.orgId, ctx.orgId)))
    .limit(1);
  if (campaign.length === 0) throw new Error("Campaign not found");

  const rows = await db
    .select({
      company: recipients.company,
      total: sql<number>`count(*)::int`,
      opened: sql<number>`count(case when ${campaignRecipients.openCount} > 0 then 1 end)::int`,
      firstOpen: sql<string>`min(${campaignRecipients.firstOpenedAt})`,
      lastOpen: sql<string>`max(${campaignRecipients.lastOpenedAt})`,
    })
    .from(campaignRecipients)
    .innerJoin(recipients, eq(campaignRecipients.recipientId, recipients.id))
    .where(and(eq(campaignRecipients.campaignId, campaignId), sql`${recipients.company} is not null`))
    .groupBy(recipients.company);

  return rows;
}

export async function getCampaignTimeline(campaignId: string) {
  const ctx = await requireSession();
  const campaign = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.orgId, ctx.orgId)))
    .limit(1);
  if (campaign.length === 0) throw new Error("Campaign not found");

  const rows = await db
    .select({
      hour: sql<string>`date_trunc('hour', ${campaignEvents.createdAt})`,
      opens: sql<number>`count(case when ${campaignEvents.eventType} = 'opened' then 1 end)::int`,
      clicks: sql<number>`count(case when ${campaignEvents.eventType} = 'clicked' then 1 end)::int`,
    })
    .from(campaignEvents)
    .where(eq(campaignEvents.campaignId, campaignId))
    .groupBy(sql`date_trunc('hour', ${campaignEvents.createdAt})`)
    .orderBy(sql`date_trunc('hour', ${campaignEvents.createdAt})`);

  return rows;
}

export async function createCampaign(data: {
  name: string;
  subject: string;
  previewText?: string;
  templateId?: string;
  contentHtml?: string;
  contentJson?: unknown;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  tags?: string[];
  recipientListIds: string[];
  scheduledAt?: string;
}) {
  const ctx = await requireSession();

  console.log(`[Campaign] Creating campaign "${data.name}" for org ${ctx.orgId}`);

  // Create the campaign
  const [campaign] = await db
    .insert(campaigns)
    .values({
      orgId: ctx.orgId,
      createdBy: ctx.userId,
      name: data.name,
      subject: data.subject,
      previewText: data.previewText || null,
      templateId: data.templateId || null,
      contentHtml: data.contentHtml || null,
      contentJson: data.contentJson || null,
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      replyTo: data.replyTo || null,
      tags: data.tags || [],
      status: data.scheduledAt ? "scheduled" : "draft",
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    })
    .returning();

  console.log(`[Campaign] Campaign created: ${campaign.id}`);

  // Get all recipients from the selected lists
  const recipientRows = await db
    .select()
    .from(recipients)
    .where(
      and(
        eq(recipients.orgId, ctx.orgId),
        eq(recipients.status, "active"),
        inArray(recipients.listId, data.recipientListIds)
      )
    );

  console.log(`[Campaign] Found ${recipientRows.length} active recipients from ${data.recipientListIds.length} list(s)`);

  // Create campaign_recipients entries
  if (recipientRows.length > 0) {
    await db.insert(campaignRecipients).values(
      recipientRows.map((r: { id: string }) => ({
        campaignId: campaign.id,
        recipientId: r.id,
        status: "pending" as const,
      }))
    );
  }

  // Update stats cache
  await db
    .update(campaigns)
    .set({
      statsCache: {
        sent: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unique_opens: 0,
        unique_clicks: 0,
        total: recipientRows.length,
      },
    })
    .where(eq(campaigns.id, campaign.id));

  await db.insert(auditLog).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "campaign.created",
    entityType: "campaign",
    entityId: campaign.id,
    metadata: { name: data.name, recipients: recipientRows.length },
  });

  console.log(`[Campaign] Campaign "${data.name}" ready with ${recipientRows.length} recipients`);
  return campaign;
}

export async function sendCampaign(campaignId: string) {
  const ctx = await requireSession();
  console.log(`[Send] Starting send for campaign ${campaignId}`);

  // Get campaign details
  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    console.error(`[Send] Campaign ${campaignId} not found`);
    throw new Error("Campaign not found");
  }

  console.log(`[Send] Campaign "${campaign.name}" status: ${campaign.status}`);

  // Guard against double-send
  if (campaign.status === "sending" || campaign.status === "sent") {
    console.warn(`[Send] Blocked: campaign ${campaignId} is already "${campaign.status}"`);
    throw new Error(
      `Campaign is already ${campaign.status}. Cannot send again.`
    );
  }

  // Mark campaign as sending
  console.log(`[Send] Marking campaign ${campaignId} as "sending"`);
  await db
    .update(campaigns)
    .set({ status: "sending", sentAt: new Date() })
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.orgId, ctx.orgId)));

  // Get all pending campaign recipients with their email details
  const pendingRecipients = await db
    .select({
      crId: campaignRecipients.id,
      recipientId: campaignRecipients.recipientId,
      email: recipients.email,
      firstName: recipients.firstName,
    })
    .from(campaignRecipients)
    .innerJoin(recipients, eq(campaignRecipients.recipientId, recipients.id))
    .where(
      and(
        eq(campaignRecipients.campaignId, campaignId),
        eq(campaignRecipients.status, "pending")
      )
    );

  console.log(`[Send] Found ${pendingRecipients.length} pending recipients`);

  if (pendingRecipients.length === 0) {
    console.log(`[Send] No pending recipients — marking campaign as "sent"`);
    await db
      .update(campaigns)
      .set({ status: "sent" })
      .where(eq(campaigns.id, campaignId));
    return { enqueued: 0 };
  }

  const fromAddress = campaign.fromName
    ? `${campaign.fromName} <${campaign.fromEmail}>`
    : campaign.fromEmail;

  // Build job data for each recipient
  const jobs: EmailJobData[] = pendingRecipients.map((r: typeof pendingRecipients[number]) => ({
    campaignId,
    recipientId: r.recipientId,
    crId: r.crId,
    email: r.email,
    firstName: r.firstName,
    fromAddress,
    replyTo: campaign.replyTo,
    subject: campaign.subject,
    contentHtml: campaign.contentHtml || "<p>No content</p>",
    orgId: ctx.orgId,
  }));

  // Enqueue all jobs in batches of 50 — returns instantly
  console.log(`[Send] Enqueueing ${jobs.length} jobs to Redis queue...`);
  await enqueueEmailJobs(jobs);
  console.log(`[Send] All ${jobs.length} jobs enqueued successfully`);

  await db.insert(auditLog).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "campaign.sent",
    entityType: "campaign",
    entityId: campaignId,
    metadata: { enqueued: pendingRecipients.length },
  });

  console.log(`[Send] Campaign ${campaignId} send initiated — ${pendingRecipients.length} emails queued`);
  return { enqueued: pendingRecipients.length };
}

export async function duplicateCampaign(campaignId: string) {
  const ctx = await requireSession();
  const original = await getCampaign(campaignId);
  if (!original) throw new Error("Campaign not found");

  const [campaign] = await db
    .insert(campaigns)
    .values({
      orgId: ctx.orgId,
      createdBy: ctx.userId,
      name: `${original.name} (Copy)`,
      subject: original.subject,
      previewText: original.previewText,
      templateId: original.templateId,
      contentHtml: original.contentHtml,
      contentJson: original.contentJson,
      fromName: original.fromName,
      fromEmail: original.fromEmail,
      replyTo: original.replyTo,
      tags: original.tags,
      status: "draft",
    })
    .returning();

  return campaign;
}

export async function deleteCampaign(campaignId: string) {
  const ctx = await requireSession();
  await db
    .delete(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.orgId, ctx.orgId)));
}

export async function exportCampaignCSV(campaignId: string): Promise<string> {
  const ctx = await requireSession();
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const rows = await db
    .select({
      email: recipients.email,
      firstName: recipients.firstName,
      lastName: recipients.lastName,
      company: recipients.company,
      status: campaignRecipients.status,
      sentAt: campaignRecipients.sentAt,
      deliveredAt: campaignRecipients.deliveredAt,
      firstOpenedAt: campaignRecipients.firstOpenedAt,
      openCount: campaignRecipients.openCount,
      firstClickedAt: campaignRecipients.firstClickedAt,
      clickCount: campaignRecipients.clickCount,
      bouncedAt: campaignRecipients.bouncedAt,
      bounceType: campaignRecipients.bounceType,
    })
    .from(campaignRecipients)
    .innerJoin(recipients, eq(campaignRecipients.recipientId, recipients.id))
    .where(eq(campaignRecipients.campaignId, campaignId))
    .orderBy(desc(campaignRecipients.sentAt));

  const header = "Email,First Name,Last Name,Company,Status,Sent At,Delivered At,First Opened At,Open Count,First Clicked At,Click Count,Bounced At,Bounce Type";
  const csvRows = rows.map((r: typeof rows[number]) => {
    const fields = [
      r.email,
      r.firstName || "",
      r.lastName || "",
      r.company || "",
      r.status,
      r.sentAt ? new Date(r.sentAt).toISOString() : "",
      r.deliveredAt ? new Date(r.deliveredAt).toISOString() : "",
      r.firstOpenedAt ? new Date(r.firstOpenedAt).toISOString() : "",
      String(r.openCount),
      r.firstClickedAt ? new Date(r.firstClickedAt).toISOString() : "",
      String(r.clickCount),
      r.bouncedAt ? new Date(r.bouncedAt).toISOString() : "",
      r.bounceType || "",
    ];
    return fields.map((f) => `"${f.replace(/"/g, '""')}"`).join(",");
  });

  console.log(`[Campaign] Exported CSV for campaign ${campaignId}: ${rows.length} rows`);
  return [header, ...csvRows].join("\n");
}

export async function resendToNonOpeners(campaignId: string) {
  const ctx = await requireSession();
  const original = await getCampaign(campaignId);
  if (!original) throw new Error("Campaign not found");
  if (original.status !== "sent") throw new Error("Campaign must be sent before resending to non-openers");

  // Get recipients who haven't opened
  const nonOpeners = await db
    .select({ recipientId: campaignRecipients.recipientId })
    .from(campaignRecipients)
    .where(
      and(
        eq(campaignRecipients.campaignId, campaignId),
        eq(campaignRecipients.openCount, 0),
        sql`${campaignRecipients.status} != 'bounced'`
      )
    );

  if (nonOpeners.length === 0) {
    throw new Error("All recipients have already opened this campaign");
  }

  // Create a new campaign
  const [newCampaign] = await db
    .insert(campaigns)
    .values({
      orgId: ctx.orgId,
      createdBy: ctx.userId,
      name: `${original.name} (Resend to Non-Openers)`,
      subject: original.subject,
      previewText: original.previewText,
      templateId: original.templateId,
      contentHtml: original.contentHtml,
      contentJson: original.contentJson,
      fromName: original.fromName,
      fromEmail: original.fromEmail,
      replyTo: original.replyTo,
      tags: original.tags,
      status: "draft",
    })
    .returning();

  // Add non-opener recipients to the new campaign
  await db.insert(campaignRecipients).values(
    nonOpeners.map((r: typeof nonOpeners[number]) => ({
      campaignId: newCampaign.id,
      recipientId: r.recipientId,
      status: "pending" as const,
    }))
  );

  // Update stats cache
  await db
    .update(campaigns)
    .set({
      statsCache: {
        sent: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unique_opens: 0,
        unique_clicks: 0,
        total: nonOpeners.length,
      },
    })
    .where(eq(campaigns.id, newCampaign.id));

  await db.insert(auditLog).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "campaign.resend_non_openers",
    entityType: "campaign",
    entityId: newCampaign.id,
    metadata: { originalCampaignId: campaignId, nonOpeners: nonOpeners.length },
  });

  console.log(`[Campaign] Resend to non-openers: created campaign ${newCampaign.id} with ${nonOpeners.length} recipients`);
  return newCampaign;
}
