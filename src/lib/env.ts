/**
 * Environment variable validation.
 *
 * Import this module early (e.g. in root layout or instrumentation hook)
 * so that the server crashes fast with a clear message when a required
 * variable is missing.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to your .env file or hosting provider.`
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    console.warn(
      `[env] Optional variable ${name} is not set. Related functionality may be disabled.`
    );
  }
  return value;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
  NEXT_PUBLIC_APP_URL: required("NEXT_PUBLIC_APP_URL"),
  HMAC_SECRET: required("HMAC_SECRET"),

  /** Resend API key — required for sending emails */
  RESEND_API_KEY: optional("RESEND_API_KEY"),
} as const;
