import Razorpay from "razorpay";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || !KEY_SECRET) {
  console.warn(
    "[razorpay] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set. Payment features will be disabled."
  );
}

// Lazy singleton — only instantiate when actually used (avoids crash on import)
let _razorpay: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  if (!_razorpay) {
    _razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  }
  return _razorpay;
}

// Keep backward compat export for existing code
export const razorpay = KEY_ID && KEY_SECRET
  ? new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })
  : (null as unknown as Razorpay);

export const PLANS = {
  pro: { name: "Pro", amount: 99900, currency: "INR" },
  business: { name: "Business", amount: 399900, currency: "INR" },
} as const;
