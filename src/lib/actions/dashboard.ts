"use server";

import { db } from "../db";
import {
  campaigns,
  campaignRecipients,
  campaignEvents,
  recipients,
  auditLog,
  user,
} from "../db-schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { requireSession } from "./auth-helpers";

export async function getDashboardStats() {
  const ctx = await requireSession();

  const [campaignStats] = await db
    .select({
      totalCampaigns: sql<number>`count(*)::int`,
      sentCampaigns: sql<number>`count(case when ${campaigns.status} = 'sent' then 1 end)::int`,
    })
    .from(campaigns)
    .where(eq(campaigns.orgId, ctx.orgId));

  const [recipientStats] = await db
    .select({
      totalSent: sql<number>`count(case when ${campaignRecipients.status} != 'pending' then 1 end)::int`,
      totalOpened: sql<number>`count(case when ${campaignRecipients.openCount} > 0 then 1 end)::int`,
      totalClicked: sql<number>`count(case when ${campaignRecipients.clickCount} > 0 then 1 end)::int`,
      totalBounced: sql<number>`count(case when ${campaignRecipients.status} = 'bounced' then 1 end)::int`,
    })
    .from(campaignRecipients)
    .innerJoin(campaigns, eq(campaignRecipients.campaignId, campaigns.id))
    .where(eq(campaigns.orgId, ctx.orgId));

  const [activeRecipients] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(recipients)
    .where(and(eq(recipients.orgId, ctx.orgId), eq(recipients.status, "active")));

  const totalSent = recipientStats?.totalSent || 0;
  const totalOpened = recipientStats?.totalOpened || 0;
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const clickRate =
    totalSent > 0
      ? Math.round(((recipientStats?.totalClicked || 0) / totalSent) * 100)
      : 0;
  const bounceRate =
    totalSent > 0
      ? Math.round(((recipientStats?.totalBounced || 0) / totalSent) * 100)
      : 0;

  return {
    totalCampaigns: campaignStats?.totalCampaigns || 0,
    totalEmailsSent: totalSent,
    openRate,
    clickRate,
    bounceRate,
    activeRecipients: activeRecipients?.count || 0,
  };
}

export async function getRecentCampaigns() {
  const ctx = await requireSession();

  const rows = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.orgId, ctx.orgId))
    .orderBy(desc(campaigns.createdAt))
    .limit(5);

  return rows;
}

export async function getRecentActivity() {
  const ctx = await requireSession();

  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt,
      userId: auditLog.userId,
      userName: user.name,
      userEmail: user.email,
    })
    .from(auditLog)
    .innerJoin(user, eq(auditLog.userId, user.id))
    .where(eq(auditLog.orgId, ctx.orgId))
    .orderBy(desc(auditLog.createdAt))
    .limit(20);

  return rows;
}

export async function getOpensOverTime() {
  const ctx = await requireSession();

  // Get opens over the last 7 days, grouped by day
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${campaignEvents.createdAt})::date::text`,
      opens: sql<number>`count(case when ${campaignEvents.eventType} = 'opened' then 1 end)::int`,
      clicks: sql<number>`count(case when ${campaignEvents.eventType} = 'clicked' then 1 end)::int`,
    })
    .from(campaignEvents)
    .innerJoin(campaigns, eq(campaignEvents.campaignId, campaigns.id))
    .where(
      and(
        eq(campaigns.orgId, ctx.orgId),
        gte(campaignEvents.createdAt, sevenDaysAgo)
      )
    )
    .groupBy(sql`date_trunc('day', ${campaignEvents.createdAt})`)
    .orderBy(sql`date_trunc('day', ${campaignEvents.createdAt})`);

  return rows;
}
