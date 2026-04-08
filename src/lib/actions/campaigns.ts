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
import { sendCampaignEmail } from "../email";

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

  // Create campaign_recipients entries
  if (recipientRows.length > 0) {
    await db.insert(campaignRecipients).values(
      recipientRows.map((r) => ({
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

  return campaign;
}

export async function sendCampaign(campaignId: string) {
  const ctx = await requireSession();

  // Get campaign details
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  // Mark campaign as sending
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

  let sentCount = 0;
  let failedCount = 0;
  const fromAddress = campaign.fromName
    ? `${campaign.fromName} <${campaign.fromEmail}>`
    : campaign.fromEmail;

  // Send emails via Resend (sequentially to respect rate limits)
  for (const recipient of pendingRecipients) {
    try {
      const resendEmailId = await sendCampaignEmail({
        to: recipient.email,
        from: fromAddress,
        replyTo: campaign.replyTo || undefined,
        subject: campaign.subject,
        html: campaign.contentHtml || "<p>No content</p>",
        campaignId,
        recipientId: recipient.recipientId,
        recipientEmail: recipient.email,
        orgId: ctx.orgId,
      });

      // Mark as sent and store Resend email ID
      await db
        .update(campaignRecipients)
        .set({
          status: "sent",
          sentAt: new Date(),
          resendEmailId,
        })
        .where(eq(campaignRecipients.id, recipient.crId));

      await db.insert(campaignEvents).values({
        campaignId,
        recipientId: recipient.recipientId,
        eventType: "sent",
        eventData: { resendEmailId },
      });

      sentCount++;
    } catch (error) {
      console.error(`Failed to send to ${recipient.email}:`, error);
      failedCount++;

      // Mark as failed but don't stop the campaign
      await db
        .update(campaignRecipients)
        .set({ status: "bounced", bouncedAt: new Date(), bounceType: "soft" })
        .where(eq(campaignRecipients.id, recipient.crId));
    }
  }

  // Update campaign status
  const finalStatus = failedCount === pendingRecipients.length ? "failed" : "sent";
  await db
    .update(campaigns)
    .set({
      status: finalStatus,
      statsCache: {
        sent: sentCount,
        opened: 0,
        clicked: 0,
        bounced: failedCount,
        unique_opens: 0,
        unique_clicks: 0,
        total: pendingRecipients.length,
      },
    })
    .where(eq(campaigns.id, campaignId));

  await db.insert(auditLog).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "campaign.sent",
    entityType: "campaign",
    entityId: campaignId,
    metadata: { sent: sentCount, failed: failedCount, total: pendingRecipients.length },
  });

  return { sent: sentCount, failed: failedCount };
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
