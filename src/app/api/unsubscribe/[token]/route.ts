import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { unsubscribes, recipients, campaignRecipients, campaignEvents } from "@/lib/db-schema";
import { eq, sql } from "drizzle-orm";

// Token format: base64(JSON.stringify({ email, orgId, campaignId }))
function decodeToken(token: string): {
  email: string;
  orgId: string;
  campaignId: string;
} | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const data = decodeToken(token);

  if (!data) {
    return new NextResponse("Invalid unsubscribe link", { status: 400 });
  }

  const { email, orgId, campaignId } = data;

  try {
    // Record the unsubscribe
    await db.insert(unsubscribes).values({
      orgId,
      email,
      campaignId,
    });

    // Update recipient status
    await db
      .update(recipients)
      .set({ status: "unsubscribed" })
      .where(
        sql`${recipients.orgId} = ${orgId} AND ${recipients.email} = ${email}`
      );

    // Return a simple confirmation page
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Unsubscribed</title></head>
        <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa;">
          <div style="text-align: center; padding: 2rem;">
            <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">You've been unsubscribed</h1>
            <p style="color: #666;">You will no longer receive emails from this sender.</p>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse("Something went wrong", { status: 500 });
  }
}
