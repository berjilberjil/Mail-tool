import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaignEvents, campaignRecipients, recipients } from "@/lib/db-schema";
import { eq, sql } from "drizzle-orm";

// Resend webhook event types we handle
type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.bounced"
  | "email.complained"
  | "email.opened"
  | "email.clicked";

interface ResendWebhookPayload {
  type: ResendEventType;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Bounce-specific
    bounce?: {
      type: string; // "hard" | "soft"
      message: string;
    };
    // Click-specific
    click?: {
      link: string;
      timestamp: string;
    };
  };
}

export async function POST(request: NextRequest) {
  // TODO: Verify Resend webhook signature in production
  // const signature = request.headers.get("resend-signature");

  let payload: ResendWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = payload;
  const resendEmailId = data.email_id;

  try {
    // Find the campaign_recipient by resend_email_id
    const [cr] = await db
      .select()
      .from(campaignRecipients)
      .where(eq(campaignRecipients.resendEmailId, resendEmailId))
      .limit(1);

    if (!cr) {
      return NextResponse.json({ status: "ignored", reason: "unknown email_id" });
    }

    switch (type) {
      case "email.delivered":
        await db
          .update(campaignRecipients)
          .set({ status: "delivered", deliveredAt: sql`NOW()` })
          .where(eq(campaignRecipients.id, cr.id));

        await db.insert(campaignEvents).values({
          campaignId: cr.campaignId,
          recipientId: cr.recipientId,
          eventType: "delivered",
        });
        break;

      case "email.bounced":
        const bounceType = data.bounce?.type === "hard" ? "hard" : "soft";
        await db
          .update(campaignRecipients)
          .set({
            status: "bounced",
            bouncedAt: sql`NOW()`,
            bounceType,
          })
          .where(eq(campaignRecipients.id, cr.id));

        await db.insert(campaignEvents).values({
          campaignId: cr.campaignId,
          recipientId: cr.recipientId,
          eventType: "bounced",
          eventData: { bounce_type: bounceType, message: data.bounce?.message },
        });

        // Auto-suppress hard bounces
        if (bounceType === "hard") {
          await db
            .update(recipients)
            .set({ status: "bounced" })
            .where(eq(recipients.id, cr.recipientId));
        }
        break;

      case "email.complained":
        await db
          .update(campaignRecipients)
          .set({ status: "complained" })
          .where(eq(campaignRecipients.id, cr.id));

        await db.insert(campaignEvents).values({
          campaignId: cr.campaignId,
          recipientId: cr.recipientId,
          eventType: "complained",
        });

        // Auto-suppress complained recipients
        await db
          .update(recipients)
          .set({ status: "complained" })
          .where(eq(recipients.id, cr.recipientId));
        break;

      case "email.opened":
        await db
          .update(campaignRecipients)
          .set({
            status: sql`CASE WHEN ${campaignRecipients.status} = 'clicked' THEN 'clicked' ELSE 'opened' END`,
            firstOpenedAt: sql`COALESCE(${campaignRecipients.firstOpenedAt}, NOW())`,
            lastOpenedAt: sql`NOW()`,
            openCount: sql`${campaignRecipients.openCount} + 1`,
          })
          .where(eq(campaignRecipients.id, cr.id));

        await db.insert(campaignEvents).values({
          campaignId: cr.campaignId,
          recipientId: cr.recipientId,
          eventType: "opened",
        });
        break;

      case "email.clicked":
        await db
          .update(campaignRecipients)
          .set({
            status: "clicked",
            firstClickedAt: sql`COALESCE(${campaignRecipients.firstClickedAt}, NOW())`,
            clickCount: sql`${campaignRecipients.clickCount} + 1`,
          })
          .where(eq(campaignRecipients.id, cr.id));

        await db.insert(campaignEvents).values({
          campaignId: cr.campaignId,
          recipientId: cr.recipientId,
          eventType: "clicked",
          eventData: { url: data.click?.link },
        });
        break;
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Resend webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
