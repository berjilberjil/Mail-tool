"use server";

import { auth } from "../auth";
import { headers } from "next/headers";

export async function getSessionContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const orgId = session.session.activeOrganizationId;

  return {
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    orgId: orgId || null,
  };
}

export async function requireSession() {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.orgId) {
    throw new Error("Unauthorized");
  }
  return ctx as { userId: string; userName: string; userEmail: string; orgId: string };
}
