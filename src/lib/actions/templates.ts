"use server";

import { db } from "../db";
import { templates, auditLog } from "../db-schema";
import { eq, and, desc } from "drizzle-orm";
import { requireSession } from "./auth-helpers";

export async function getTemplates() {
  const ctx = await requireSession();
  const rows = await db
    .select()
    .from(templates)
    .where(and(eq(templates.orgId, ctx.orgId), eq(templates.isGallery, false)))
    .orderBy(desc(templates.createdAt));
  return rows;
}

export async function getGalleryTemplates() {
  const rows = await db
    .select()
    .from(templates)
    .where(eq(templates.isGallery, true))
    .orderBy(desc(templates.createdAt));
  return rows;
}

export async function getTemplate(id: string) {
  const ctx = await requireSession();
  const rows = await db
    .select()
    .from(templates)
    .where(and(eq(templates.id, id), eq(templates.orgId, ctx.orgId)));
  return rows[0] || null;
}

export async function createTemplate(data: {
  name: string;
  subject: string;
  contentJson?: unknown;
  contentHtml?: string;
}) {
  const ctx = await requireSession();
  const [row] = await db
    .insert(templates)
    .values({
      orgId: ctx.orgId,
      createdBy: ctx.userId,
      name: data.name,
      subject: data.subject,
      contentJson: data.contentJson || null,
      contentHtml: data.contentHtml || null,
      isGallery: false,
    })
    .returning();

  await db.insert(auditLog).values({
    orgId: ctx.orgId,
    userId: ctx.userId,
    action: "template.created",
    entityType: "template",
    entityId: row.id,
    metadata: { name: data.name },
  });

  return row;
}

export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    subject?: string;
    contentJson?: unknown;
    contentHtml?: string;
  }
) {
  const ctx = await requireSession();
  const [row] = await db
    .update(templates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(templates.id, id), eq(templates.orgId, ctx.orgId)))
    .returning();
  return row;
}

export async function deleteTemplate(id: string) {
  const ctx = await requireSession();
  await db
    .delete(templates)
    .where(and(eq(templates.id, id), eq(templates.orgId, ctx.orgId)));
}

export async function duplicateTemplate(id: string) {
  const ctx = await requireSession();
  const original = await getTemplate(id);
  if (!original) throw new Error("Template not found");

  const [row] = await db
    .insert(templates)
    .values({
      orgId: ctx.orgId,
      createdBy: ctx.userId,
      name: `${original.name} (Copy)`,
      subject: original.subject,
      contentJson: original.contentJson,
      contentHtml: original.contentHtml,
      isGallery: false,
    })
    .returning();
  return row;
}

export async function seedGalleryTemplates() {
  const existing = await db
    .select()
    .from(templates)
    .where(eq(templates.isGallery, true));

  if (existing.length > 0) return existing;

  const ctx = await requireSession();

  const gallery = [
    {
      name: "Product Launch",
      subject: "Introducing {{product_name}} — Now Available",
      contentHtml: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a1a; font-size: 28px;">Introducing Our Latest Product</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">We're thrilled to announce the launch of our newest product. It's been months in the making, and we can't wait for you to try it.</p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin: 24px 0;">
          <h2 style="color: #333; font-size: 20px;">Key Features</h2>
          <ul style="color: #666; font-size: 15px; line-height: 1.8;">
            <li>Feature one description</li>
            <li>Feature two description</li>
            <li>Feature three description</li>
          </ul>
        </div>
        <a href="#" style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Learn More</a>
      </div>`,
      isGallery: true,
      createdBy: ctx.userId,
      orgId: ctx.orgId,
    },
    {
      name: "Weekly Newsletter",
      subject: "This Week at {{company_name}}",
      contentHtml: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">Weekly Newsletter</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Here's what happened this week and what's coming up next.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <h2 style="color: #333; font-size: 18px;">Top Story</h2>
        <p style="color: #666; font-size: 15px; line-height: 1.6;">Your main story content goes here. Keep it engaging and relevant to your audience.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <h2 style="color: #333; font-size: 18px;">Quick Updates</h2>
        <p style="color: #666; font-size: 15px; line-height: 1.6;">Additional updates and news items for your subscribers.</p>
      </div>`,
      isGallery: true,
      createdBy: ctx.userId,
      orgId: ctx.orgId,
    },
    {
      name: "Event Invitation",
      subject: "You're Invited: {{event_name}}",
      contentHtml: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
        <h1 style="color: #1a1a1a; font-size: 28px;">You're Invited!</h1>
        <p style="color: #666; font-size: 18px; line-height: 1.6;">Join us for an exciting event</p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 32px; margin: 24px 0; color: white;">
          <h2 style="font-size: 22px; margin-bottom: 8px;">Event Name</h2>
          <p style="font-size: 16px; opacity: 0.9;">Date: TBD | Time: TBD</p>
          <p style="font-size: 16px; opacity: 0.9;">Location: TBD</p>
        </div>
        <a href="#" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 40px; border-radius: 6px; text-decoration: none; font-weight: 600;">RSVP Now</a>
      </div>`,
      isGallery: true,
      createdBy: ctx.userId,
      orgId: ctx.orgId,
    },
    {
      name: "Welcome Email",
      subject: "Welcome to {{company_name}}!",
      contentHtml: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a1a; font-size: 28px;">Welcome aboard! 🎉</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">We're excited to have you join us. Here's everything you need to get started.</p>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0;">
          <h2 style="color: #333; font-size: 18px;">Getting Started</h2>
          <ol style="color: #666; font-size: 15px; line-height: 2;">
            <li>Complete your profile</li>
            <li>Explore our features</li>
            <li>Connect with your team</li>
          </ol>
        </div>
        <a href="#" style="display: inline-block; background: #10b981; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Get Started</a>
      </div>`,
      isGallery: true,
      createdBy: ctx.userId,
      orgId: ctx.orgId,
    },
    {
      name: "Plain Text",
      subject: "A message from {{sender_name}}",
      contentHtml: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <p style="color: #333; font-size: 16px; line-height: 1.8;">Hi there,</p>
        <p style="color: #333; font-size: 16px; line-height: 1.8;">This is a simple plain text email template. Perfect for personal outreach and one-on-one communication.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.8;">Write your message here. Keep it concise and actionable.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.8;">Best regards,<br/>Your Name</p>
      </div>`,
      isGallery: true,
      createdBy: ctx.userId,
      orgId: ctx.orgId,
    },
  ];

  const rows = await db.insert(templates).values(gallery).returning();
  return rows;
}
