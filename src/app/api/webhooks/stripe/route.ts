import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db-schema";
import { eq } from "drizzle-orm";

// TODO: Add Stripe dependency and verify webhook signatures in production
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  // TODO: Verify Stripe webhook signature
  // const sig = request.headers.get("stripe-signature")!;
  // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

  let event;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orgId = session.metadata?.orgId;
        const plan = session.metadata?.plan || "pro";

        if (orgId) {
          await db
            .update(organisations)
            .set({
              plan,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              updatedAt: new Date(),
            })
            .where(eq(organisations.id, orgId));
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const orgId = subscription.metadata?.orgId;

        if (orgId) {
          const status = subscription.status;
          // Map Stripe status to plan
          const plan =
            status === "active"
              ? subscription.metadata?.plan || "pro"
              : "free";

          await db
            .update(organisations)
            .set({ plan, updatedAt: new Date() })
            .where(eq(organisations.id, orgId));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const orgId = subscription.metadata?.orgId;

        if (orgId) {
          await db
            .update(organisations)
            .set({
              plan: "free",
              stripeSubscriptionId: null,
              updatedAt: new Date(),
            })
            .where(eq(organisations.id, orgId));
        }
        break;
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
