"use server";

import { db } from "../db";
import { member, user, invitation, auditLog, organisations } from "../db-schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireSession } from "./auth-helpers";
import { auth } from "../auth";
import { headers } from "next/headers";

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

  return rows[0] || {
    plan: "free",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    razorpayCustomerId: null,
    razorpaySubscriptionId: null,
  };
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

export async function inviteTeamMember(email: string, role: string) {
  const ctx = await requireSession();

  const result = await auth.api.createInvitation({
    headers: await headers(),
    body: {
      email,
      role: role as "member" | "admin",
      organizationId: ctx.orgId,
    },
  });

  await db.insert(auditLog).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "member.invited",
    entityType: "invitation",
    entityId: email,
    metadata: { email, role },
  });

  console.log(`[Team] Invited ${email} as ${role} to org ${ctx.orgId}`);
  return result;
}

export async function removeTeamMember(memberIdToRemove: string) {
  const ctx = await requireSession();

  await auth.api.removeMember({
    headers: await headers(),
    body: {
      memberIdOrEmail: memberIdToRemove,
      organizationId: ctx.orgId,
    },
  });

  await db.insert(auditLog).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "member.removed",
    entityType: "member",
    entityId: memberIdToRemove,
    metadata: {},
  });

  console.log(`[Team] Removed member ${memberIdToRemove} from org ${ctx.orgId}`);
}

export async function changeTeamMemberRole(memberIdToUpdate: string, newRole: string) {
  const ctx = await requireSession();

  await auth.api.updateMemberRole({
    headers: await headers(),
    body: {
      memberId: memberIdToUpdate,
      role: newRole as "member" | "admin",
      organizationId: ctx.orgId,
    },
  });

  await db.insert(auditLog).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "member.role_changed",
    entityType: "member",
    entityId: memberIdToUpdate,
    metadata: { newRole },
  });

  console.log(`[Team] Changed role of member ${memberIdToUpdate} to ${newRole}`);
}

export async function revokeInvitation(invitationId: string) {
  const ctx = await requireSession();

  await auth.api.cancelInvitation({
    headers: await headers(),
    body: {
      invitationId,
    },
  });

  await db.insert(auditLog).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "invitation.revoked",
    entityType: "invitation",
    entityId: invitationId,
    metadata: {},
  });

  console.log(`[Team] Revoked invitation ${invitationId}`);
}

export async function deleteOrganisation() {
  const ctx = await requireSession();

  // Check user is owner
  const memberRow = await db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, ctx.orgId), eq(member.userId, ctx.userId)))
    .limit(1);

  if (!memberRow[0] || memberRow[0].role !== "owner") {
    throw new Error("Only the organisation owner can delete it");
  }

  await auth.api.deleteOrganization({
    headers: await headers(),
    body: {
      organizationId: ctx.orgId,
    },
  });

  console.log(`[Team] Organisation ${ctx.orgId} deleted by ${ctx.userId}`);
}

export async function getOrgSettings() {
  const ctx = await requireSession();

  const rows = await db
    .select({
      defaultFromEmail: organisations.defaultFromEmail,
      defaultReplyTo: organisations.defaultReplyTo,
    })
    .from(organisations)
    .where(eq(organisations.id, ctx.orgId));

  return rows[0] || { defaultFromEmail: null, defaultReplyTo: null };
}

export async function updateOrgSettings(data: {
  defaultFromEmail?: string;
  defaultReplyTo?: string;
}) {
  const ctx = await requireSession();

  await db
    .update(organisations)
    .set({
      defaultFromEmail: data.defaultFromEmail || null,
      defaultReplyTo: data.defaultReplyTo || null,
      updatedAt: new Date(),
    })
    .where(eq(organisations.id, ctx.orgId));

  await db.insert(auditLog).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "org.settings_updated",
    entityType: "organisation",
    entityId: ctx.orgId,
    metadata: { defaultFromEmail: data.defaultFromEmail, defaultReplyTo: data.defaultReplyTo },
  });
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
