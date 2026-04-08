import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { campaignEvents, campaignRecipients } from "@/lib/db-schema";
import { sql } from "drizzle-orm";

const HMAC_SECRET = process.env.BETTER_AUTH_SECRET || "default-secret";

function verifyHmac(url: string, signature: string): boolean {
  const expected = createHmac("sha256", HMAC_SECRET)
    .update(url)
    .digest("hex");
  return expected === signature;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; recipientId: string }> }
) {
  const { campaignId, recipientId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const sig = searchParams.get("sig");

  // Validate URL and HMAC signature
  if (!url || !sig || !verifyHmac(url, sig)) {
    return new NextResponse("Invalid or tampered link", { status: 400 });
  }

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

    logPromise.catch((err) => console.error("Click tracking error:", err));
  } catch {
    // Silent — never break the redirect
  }

  // 302 redirect to the original URL
  return NextResponse.redirect(url, 302);
}
