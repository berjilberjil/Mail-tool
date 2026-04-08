import { Resend } from "resend";
import {
  getTrackingPixelHtml,
  wrapLinkWithTracking,
  getUnsubscribeUrl,
} from "@/lib/tracking";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SendCampaignEmailParams {
  to: string;
  from: string; // "Name <email@domain.com>"
  replyTo?: string;
  subject: string;
  html: string; // raw template HTML — will be processed
  campaignId: string;
  recipientId: string;
  recipientEmail: string;
  orgId: string;
}

interface SendTransactionalEmailParams {
  to: string;
  from?: string;
  subject: string;
  html: string;
  replyTo?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Rewrite every `href="http(s)://..."` in the HTML so the link goes through
 * click tracking. Links that already point to our own tracking / unsubscribe
 * endpoints are left untouched.
 */
function rewriteLinks(
  html: string,
  campaignId: string,
  recipientId: string
): string {
  // Match href="http..." or href='http...' (double or single quotes)
  const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;

  return html.replace(linkRegex, (match, url: string) => {
    // Don't rewrite links that already point to our tracking or unsubscribe endpoints
    if (url.startsWith(`${APP_URL}/api/track/`) || url.startsWith(`${APP_URL}/api/unsubscribe/`)) {
      return match;
    }

    const trackedUrl = wrapLinkWithTracking(url, campaignId, recipientId);
    // Preserve the original quote character used
    const quote = match.charAt(5); // the quote char right after href=
    return `href=${quote}${trackedUrl}${quote}`;
  });
}

/**
 * Inject a tracking pixel into the HTML. Inserts it right before the closing
 * `</body>` tag when present, otherwise appends it to the end.
 */
function injectTrackingPixel(
  html: string,
  campaignId: string,
  recipientId: string
): string {
  const pixel = getTrackingPixelHtml(campaignId, recipientId);

  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }

  return html + pixel;
}

/**
 * Append an unsubscribe link to the bottom of the HTML body.
 */
function appendUnsubscribeLink(
  html: string,
  email: string,
  orgId: string,
  campaignId: string
): string {
  const unsubscribeUrl = getUnsubscribeUrl(email, orgId, campaignId);

  const unsubscribeBlock = [
    '<div style="text-align:center;padding:20px 0;font-size:12px;color:#999;">',
    `  <a href="${unsubscribeUrl}" style="color:#999;text-decoration:underline;">Unsubscribe</a>`,
    "</div>",
  ].join("");

  if (html.includes("</body>")) {
    return html.replace("</body>", `${unsubscribeBlock}</body>`);
  }

  return html + unsubscribeBlock;
}

/**
 * Process raw campaign HTML: rewrite links, add unsubscribe footer, inject
 * tracking pixel. Order matters — we rewrite links first so the unsubscribe
 * link and tracking pixel URLs are not accidentally wrapped.
 */
function processCampaignHtml(params: {
  html: string;
  campaignId: string;
  recipientId: string;
  recipientEmail: string;
  orgId: string;
}): string {
  let processed = params.html;

  // 1. Rewrite existing links for click tracking
  processed = rewriteLinks(processed, params.campaignId, params.recipientId);

  // 2. Append unsubscribe link (inserted AFTER link rewriting so it is not wrapped)
  processed = appendUnsubscribeLink(
    processed,
    params.recipientEmail,
    params.orgId,
    params.campaignId
  );

  // 3. Inject open-tracking pixel (last, so it sits right before </body>)
  processed = injectTrackingPixel(processed, params.campaignId, params.recipientId);

  return processed;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a single campaign email via Resend.
 *
 * The raw HTML is processed to add:
 *   - click-tracking link rewrites
 *   - an unsubscribe footer & List-Unsubscribe header
 *   - an open-tracking pixel
 *
 * Returns the Resend email ID.
 */
export async function sendCampaignEmail(
  params: SendCampaignEmailParams
): Promise<string> {
  const processedHtml = processCampaignHtml({
    html: params.html,
    campaignId: params.campaignId,
    recipientId: params.recipientId,
    recipientEmail: params.recipientEmail,
    orgId: params.orgId,
  });

  const unsubscribeUrl = getUnsubscribeUrl(
    params.recipientEmail,
    params.orgId,
    params.campaignId
  );

  const { data, error } = await resend.emails.send({
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: processedHtml,
    replyTo: params.replyTo,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (error || !data) {
    throw new Error(
      `Failed to send campaign email: ${error?.message ?? "Unknown error"}`
    );
  }

  return data.id;
}

/**
 * Send a transactional / system email (password reset, email verification,
 * team invitations, etc.) via Resend.
 *
 * No tracking, link rewriting, or unsubscribe handling is applied.
 *
 * Returns the Resend email ID.
 */
export async function sendTransactionalEmail(
  params: SendTransactionalEmailParams
): Promise<string> {
  const defaultFrom = `Berjil <noreply@${process.env.RESEND_DOMAIN ?? "berjil.com"}>`;

  const { data, error } = await resend.emails.send({
    from: params.from ?? defaultFrom,
    to: params.to,
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo,
  });

  if (error || !data) {
    throw new Error(
      `Failed to send transactional email: ${error?.message ?? "Unknown error"}`
    );
  }

  return data.id;
}
