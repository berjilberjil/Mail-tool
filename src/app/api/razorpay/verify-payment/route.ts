import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organisations } from "@/lib/db-schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  console.log("[Razorpay:Verify] Payment verification request received");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session?.activeOrganizationId) {
    console.warn("[Razorpay:Verify] Unauthorized — no session or org");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan,
  } = body;

  console.log(`[Razorpay:Verify] Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}, Plan: ${plan}`);

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
    console.warn("[Razorpay:Verify] Missing required fields");
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify signature
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error("[Razorpay:Verify] RAZORPAY_KEY_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedSignature);
  const actualBuf = Buffer.from(razorpay_signature);
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    console.warn("[Razorpay:Verify] ✗ Signature mismatch — possible tampering");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[Razorpay:Verify] ✓ Signature verified");

  // Upsert org plan (ensure row exists, then update)
  const orgId = session.session.activeOrganizationId;

  const existing = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(organisations).values({
      id: orgId,
      plan,
      razorpayCustomerId: razorpay_payment_id,
    });
  } else {
    await db
      .update(organisations)
      .set({
        plan,
        razorpayCustomerId: razorpay_payment_id,
        updatedAt: new Date(),
      })
      .where(eq(organisations.id, orgId));
  }

  console.log(`[Razorpay:Verify] ✓ Org ${orgId} upgraded to "${plan}"`);
  return NextResponse.json({ success: true, plan });
}
