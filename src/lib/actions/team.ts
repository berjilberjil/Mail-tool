"use server";

import { db } from "../db";
import { member, user, invitation, auditLog, organisations } from "../db-schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireSession } from "./auth-helpers";

export async function getTeamMembers() {
  const ctx = await requireSession();

  const rows = await db
    .select({
      memberId: member.id,
      role: member.role,
      joinedAt: member.createdAt,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, ctx.orgId))
    .orderBy(member.createdAt);

  return rows;
}

export async function getPendingInvitations() {
  const ctx = await requireSession();

  const rows = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: sql<string>`${invitation.expiresAt}`, // Using expiresAt as proxy since no createdAt
      inviterName: user.name,
    })
    .from(invitation)
    .innerJoin(user, eq(invitation.inviterId, user.id))
    .where(
      and(
        eq(invitation.organizationId, ctx.orgId),
        eq(invitation.status, "pending")
      )
    );

  return rows;
}

export async function getOrgPlan() {
  const ctx = await requireSession();

  const rows = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, ctx.orgId));

  return rows[0] || { plan: "free", stripeCustomerId: null, stripeSubscriptionId: null };
}

export async function ensureOrgRecord() {
  const ctx = await requireSession();

  // Check if org record exists in our extended table
  const existing = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, ctx.orgId));

  if (existing.length === 0) {
    await db.insert(organisations).values({
      id: ctx.orgId,
      plan: "free",
    });
  }
}

export async function getAuditLog() {
  const ctx = await requireSession();

  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(auditLog)
    .innerJoin(user, eq(auditLog.userId, user.id))
    .where(eq(auditLog.orgId, ctx.orgId))
    .orderBy(desc(auditLog.createdAt))
    .limit(50);

  return rows;
}

export async function getCampaignUsage() {
  const ctx = await requireSession();

  const { campaigns: campaignsTable } = await import("../db-schema");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [usage] = await db
    .select({
      campaignsThisMonth: sql<number>`count(*)::int`,
    })
    .from(campaignsTable)
    .where(
      and(
        eq(campaignsTable.orgId, ctx.orgId),
        sql`${campaignsTable.createdAt} >= ${thirtyDaysAgo}`
      )
    );

  return {
    campaignsThisMonth: usage?.campaignsThisMonth || 0,
  };
}
