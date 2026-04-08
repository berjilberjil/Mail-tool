import { NextRequest, NextResponse } from "next/server";
import { getRazorpay, PLANS } from "@/lib/razorpay";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  console.log("[Razorpay:Order] Create order request received");

  // Verify user is authenticated with an active org
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session?.activeOrganizationId) {
    console.warn("[Razorpay:Order] Unauthorized — no session or org");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const planKey = body.plan as keyof typeof PLANS;
  console.log(`[Razorpay:Order] Plan requested: ${planKey} by user ${session.user.id}`);

  if (!planKey || !PLANS[planKey]) {
    console.warn(`[Razorpay:Order] Invalid plan: ${planKey}`);
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = PLANS[planKey];

  try {
    console.log(`[Razorpay:Order] Creating order: ${plan.amount} ${plan.currency} for "${planKey}"`);
    const order = await getRazorpay().orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt: `order_${session.session.activeOrganizationId}_${planKey}_${Date.now()}`,
      notes: {
        orgId: session.session.activeOrganizationId || "",
        plan: planKey,
        userId: session.user.id,
      },
    });

    console.log(`[Razorpay:Order] ✓ Order created: ${order.id}`);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("[Razorpay:Order] ✗ Order creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
