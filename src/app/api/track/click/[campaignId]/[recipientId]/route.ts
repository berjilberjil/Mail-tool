import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { campaignEvents, campaignRecipients } from "@/lib/db-schema";
import { sql } from "drizzle-orm";

const HMAC_SECRET = process.env.BETTER_AUTH_SECRET || "default-secret";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function verifyHmac(url: string, signature: string): boolean {
  const expected = createHmac("sha256", HMAC_SECRET)
    .update(url)
    .digest("hex");
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; recipientId: string }> }
) {
  const { campaignId, recipientId } = await params;

  // Validate UUID format to prevent DB errors from malformed URLs
  if (!UUID_RE.test(campaignId) || !UUID_RE.test(recipientId)) {
    console.warn(`[Track:Click] Invalid UUID — campaign: ${campaignId}, recipient: ${recipientId}`);
    return new NextResponse("Invalid tracking parameters", { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const sig = searchParams.get("sig");

  // Validate URL and HMAC signature
  if (!url || !sig || !verifyHmac(url, sig)) {
    console.warn(`[Track:Click] Invalid HMAC — campaign: ${campaignId}, url: ${url}`);
    return new NextResponse("Invalid or tampered link", { status: 400 });
  }

  console.log(`[Track:Click] Link clicked — campaign: ${campaignId}, recipient: ${recipientId}, url: ${url}`);

  // Log the click event asynchronously
  try {
    const logPromise = (async () => {
      await db.insert(campaignEvents).values({
        campaignId,
        recipientId,
        eventType: "clicked",
        eventData: { url },
      });

      await db
        .update(campaignRecipients)
        .set({
          status: "clicked",
          firstClickedAt: sql`COALESCE(${campaignRecipients.firstClickedAt}, NOW())`,
          clickCount: sql`${campaignRecipients.clickCount} + 1`,
        })
        .where(
          sql`${campaignRecipients.campaignId} = ${campaignId} AND ${campaignRecipients.recipientId} = ${recipientId}`
        );
    })();

    logPromise
      .then(() => console.log(`[Track:Click] Event logged for campaign: ${campaignId}, recipient: ${recipientId}`))
      .catch((err) => console.error(`[Track:Click] DB error:`, err.message));
  } catch {
    // Silent — never break the redirect
  }

  // 302 redirect to the original URL
  return NextResponse.redirect(url, 302);
}
