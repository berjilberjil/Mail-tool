import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { campaignEvents, campaignRecipients } from "@/lib/db-schema";
import { eq, sql } from "drizzle-orm";

// 1x1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; recipientId: string }> }
) {
  const { campaignId, recipientId } = await params;

  // Return the tracking pixel immediately
  const response = new Response(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  // Log the open event asynchronously (fire-and-forget)
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Use waitUntil if available (Vercel Edge), otherwise just fire async
  try {
    const logPromise = (async () => {
      // Insert event
      await db.insert(campaignEvents).values({
        campaignId,
        recipientId,
        eventType: "opened",
        eventData: { ip, user_agent: userAgent },
      });

      // Update campaign_recipients
      await db
        .update(campaignRecipients)
        .set({
          status: "opened",
          firstOpenedAt: sql`COALESCE(${campaignRecipients.firstOpenedAt}, NOW())`,
          lastOpenedAt: sql`NOW()`,
          openCount: sql`${campaignRecipients.openCount} + 1`,
        })
        .where(
          sql`${campaignRecipients.campaignId} = ${campaignId} AND ${campaignRecipients.recipientId} = ${recipientId}`
        );
    })();

    // Fire and forget — don't block the response
    logPromise.catch((err) => console.error("Open tracking error:", err));
  } catch {
    // Silently ignore — tracking should never break the pixel response
  }

  return response;
}
