import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db-schema";
import { eq } from "drizzle-orm";

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}

async function upsertOrg(orgId: string, data: Record<string, unknown>) {
  const existing = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(organisations).values({
      id: orgId,
      plan: (data.plan as string) || "free",
      razorpayCustomerId: (data.razorpayCustomerId as string) || null,
      razorpaySubscriptionId: (data.razorpaySubscriptionId as string) || null,
    });
  } else {
    await db
      .update(organisations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organisations.id, orgId));
  }
}

export async function POST(request: NextRequest) {
  console.log("[Razorpay:Webhook] Incoming webhook");

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error("[Razorpay:Webhook] RAZORPAY_KEY_SECRET not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    console.warn("[Razorpay:Webhook] ✗ Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event as string;
  console.log(`[Razorpay:Webhook] Event type: ${eventType}`);

  try {
    switch (eventType) {
      case "payment.captured": {
        const payment = event.payload?.payment?.entity;
        const orgId = payment?.notes?.orgId;
        const plan = payment?.notes?.plan;
        console.log(`[Razorpay:Webhook] Payment captured — org: ${orgId}, plan: ${plan}, amount: ${payment?.amount}`);
        if (orgId && plan) {
          await upsertOrg(orgId, { plan, razorpayCustomerId: payment.id });
          console.log(`[Razorpay:Webhook] ✓ Org ${orgId} updated to "${plan}"`);
        } else {
          console.warn("[Razorpay:Webhook] Missing orgId or plan in payment notes");
        }
        break;
      }

      case "subscription.activated": {
        const subscription = event.payload?.subscription?.entity;
        const orgId = subscription?.notes?.orgId;
        const plan = subscription?.notes?.plan;
        console.log(`[Razorpay:Webhook] Subscription activated — org: ${orgId}, plan: ${plan}`);
        if (orgId && plan) {
          await upsertOrg(orgId, { plan, razorpaySubscriptionId: subscription.id });
          console.log(`[Razorpay:Webhook] ✓ Org ${orgId} subscription activated`);
        }
        break;
      }

      case "subscription.cancelled": {
        const subscription = event.payload?.subscription?.entity;
        const orgId = subscription?.notes?.orgId;
        console.log(`[Razorpay:Webhook] Subscription cancelled — org: ${orgId}`);
        if (orgId) {
          await upsertOrg(orgId, { plan: "free", razorpaySubscriptionId: null });
          console.log(`[Razorpay:Webhook] ✓ Org ${orgId} downgraded to free`);
        }
        break;
      }

      default:
        console.log(`[Razorpay:Webhook] Unhandled event type: ${eventType}`);
    }
  } catch (err) {
    console.error("[Razorpay:Webhook] ✗ Processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  console.log(`[Razorpay:Webhook] ✓ Webhook processed: ${eventType}`);
  return NextResponse.json({ received: true });
}
