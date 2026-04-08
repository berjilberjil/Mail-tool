"use server";

import { db } from "../db";
import { recipientLists, recipients, auditLog } from "../db-schema";
import { eq, and, desc, sql, count, ilike } from "drizzle-orm";
import { requireSession } from "./auth-helpers";

// ============ RECIPIENT LISTS ============

export async function getRecipientLists() {
  const ctx = await requireSession();

  const lists = await db
    .select({
      id: recipientLists.id,
      name: recipientLists.name,
      description: recipientLists.description,
      createdAt: recipientLists.createdAt,
      updatedAt: recipientLists.updatedAt,
      totalCount: sql<number>`count(${recipients.id})::int`,
      activeCount: sql<number>`count(case when ${recipients.status} = 'active' then 1 end)::int`,
      unsubscribedCount: sql<number>`count(case when ${recipients.status} = 'unsubscribed' then 1 end)::int`,
      bouncedCount: sql<number>`count(case when ${recipients.status} = 'bounced' then 1 end)::int`,
    })
    .from(recipientLists)
    .leftJoin(recipients, eq(recipients.listId, recipientLists.id))
    .where(eq(recipientLists.orgId, ctx.orgId))
    .groupBy(recipientLists.id)
    .orderBy(desc(recipientLists.createdAt));

  return lists;
}

export async function getRecipientList(id: string) {
  const ctx = await requireSession();
  const rows = await db
    .select()
    .from(recipientLists)
    .where(and(eq(recipientLists.id, id), eq(recipientLists.orgId, ctx.orgId)));
  return rows[0] || null;
}

export async function createRecipientList(data: { name: string; description?: string }) {
  const ctx = await requireSession();
  const [row] = await db
    .insert(recipientLists)
    .values({
      orgId: ctx.orgId,
      name: data.name,
      description: data.description || null,
    })
    .returning();

  await db.insert(auditLog).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "list.created",
    entityType: "recipient_list",
    entityId: row.id,
    metadata: { name: data.name },
  });

  return row;
}

export async function updateRecipientList(id: string, data: { name?: string; description?: string }) {
  const ctx = await requireSession();
  const [row] = await db
    .update(recipientLists)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(recipientLists.id, id), eq(recipientLists.orgId, ctx.orgId)))
    .returning();
  return row;
}

export async function deleteRecipientList(id: string) {
  const ctx = await requireSession();
  await db
    .delete(recipientLists)
    .where(and(eq(recipientLists.id, id), eq(recipientLists.orgId, ctx.orgId)));
}

// ============ RECIPIENTS ============

export async function getRecipients(listId: string, filters?: { status?: string; search?: string }) {
  const ctx = await requireSession();

  let query = db
    .select()
    .from(recipients)
    .where(
      and(
        eq(recipients.orgId, ctx.orgId),
        eq(recipients.listId, listId),
        filters?.status ? eq(recipients.status, filters.status) : undefined,
        filters?.search
          ? sql`(${recipients.email} ilike ${'%' + filters.search + '%'} or ${recipients.firstName} ilike ${'%' + filters.search + '%'} or ${recipients.lastName} ilike ${'%' + filters.search + '%'} or ${recipients.company} ilike ${'%' + filters.search + '%'})`
          : undefined
      )
    )
    .orderBy(desc(recipients.createdAt));

  return await query;
}

export async function getRecipientStats() {
  const ctx = await requireSession();

  const stats = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(case when ${recipients.status} = 'active' then 1 end)::int`,
      unsubscribed: sql<number>`count(case when ${recipients.status} = 'unsubscribed' then 1 end)::int`,
      bounced: sql<number>`count(case when ${recipients.status} = 'bounced' then 1 end)::int`,
    })
    .from(recipients)
    .where(eq(recipients.orgId, ctx.orgId));

  return stats[0] || { total: 0, active: 0, unsubscribed: 0, bounced: 0 };
}

export async function addRecipient(data: {
  listId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}): Promise<{ success: boolean; error?: string; recipient?: typeof recipients.$inferSelect }> {
  const ctx = await requireSession();

  const normalizedEmail = data.email.toLowerCase().trim();

  // Check if email already exists in this org
  const existing = await db
    .select({ id: recipients.id, listId: recipients.listId })
    .from(recipients)
    .where(and(eq(recipients.orgId, ctx.orgId), eq(recipients.email, normalizedEmail)))
    .limit(1);

  if (existing.length > 0) {
    return {
      success: false,
      error: existing[0].listId === data.listId
        ? `${normalizedEmail} is already in this list.`
        : `${normalizedEmail} already exists in another list in your organization.`,
    };
  }

  // Auto-detect company from email domain if not provided
  const company = data.company || extractCompanyFromEmail(data.email);

  const [row] = await db
    .insert(recipients)
    .values({
      orgId: ctx.orgId,
      listId: data.listId,
      email: normalizedEmail,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      company,
    })
    .returning();

  return { success: true, recipient: row };
}

export async function addRecipientsFromCSV(
  listId: string,
  rows: Array<{ email: string; firstName?: string; lastName?: string; company?: string }>
) {
  const ctx = await requireSession();

  const values = rows.map((r) => ({
    orgId: ctx.orgId,
    listId,
    email: r.email.toLowerCase().trim(),
    firstName: r.firstName || null,
    lastName: r.lastName || null,
    company: r.company || extractCompanyFromEmail(r.email),
  }));

  if (values.length === 0) return [];

  const inserted = await db
    .insert(recipients)
    .values(values)
    .onConflictDoNothing()
    .returning();

  await db.insert(auditLog).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "recipients.imported",
    entityType: "recipient_list",
    entityId: listId,
    metadata: { count: inserted.length },
  });

  return inserted;
}

export async function deleteRecipient(id: string) {
  const ctx = await requireSession();
  await db
    .delete(recipients)
    .where(and(eq(recipients.id, id), eq(recipients.orgId, ctx.orgId)));
}

function extractCompanyFromEmail(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  const freeProviders = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "protonmail.com", "aol.com", "mail.com"];
  if (freeProviders.includes(domain)) return null;
  // Extract company name from domain
  return domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
}
