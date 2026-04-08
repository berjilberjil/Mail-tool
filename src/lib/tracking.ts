import { createHmac } from "crypto";

const HMAC_SECRET = process.env.BETTER_AUTH_SECRET || "default-secret";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Generate the tracking pixel URL for a campaign recipient
 */
export function getTrackingPixelUrl(
  campaignId: string,
  recipientId: string
): string {
  return `${APP_URL}/api/track/open/${campaignId}/${recipientId}`;
}

/**
 * Generate an HMAC signature for a URL
 */
export function signUrl(url: string): string {
  return createHmac("sha256", HMAC_SECRET).update(url).digest("hex");
}

/**
 * Wrap a link with click tracking redirect
 */
export function wrapLinkWithTracking(
  originalUrl: string,
  campaignId: string,
  recipientId: string
): string {
  const sig = signUrl(originalUrl);
  const encodedUrl = encodeURIComponent(originalUrl);
  return `${APP_URL}/api/track/click/${campaignId}/${recipientId}?url=${encodedUrl}&sig=${sig}`;
}

/**
 * Generate an unsubscribe token
 */
export function generateUnsubscribeToken(
  email: string,
  orgId: string,
  campaignId: string
): string {
  const payload = JSON.stringify({ email, orgId, campaignId });
  return Buffer.from(payload).toString("base64url");
}

/**
 * Generate the unsubscribe URL
 */
export function getUnsubscribeUrl(
  email: string,
  orgId: string,
  campaignId: string
): string {
  const token = generateUnsubscribeToken(email, orgId, campaignId);
  return `${APP_URL}/api/unsubscribe/${token}`;
}

/**
 * Generate the tracking pixel HTML to inject into emails
 */
export function getTrackingPixelHtml(
  campaignId: string,
  recipientId: string
): string {
  const url = getTrackingPixelUrl(campaignId, recipientId);
  return `<img src="${url}" width="1" height="1" style="display:none" alt="" />`;
}
