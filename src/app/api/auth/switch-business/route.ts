import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hydrateAuthorizedSessionFromMemberships } from "@/lib/auth/memberships";
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/business-context";
import {
  parseAuthorizedSession,
  serializeAuthorizedSession,
  SESSION_BUSINESS_MAX_AGE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  updateSessionActiveBusiness
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const currentSessionValue = cookieStore.get(SESSION_COOKIE)?.value;
  const currentSession = parseAuthorizedSession(currentSessionValue);

  if (!currentSession) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as {
    businessId?: string;
  };
  const requestedBusinessId = body.businessId?.trim();

  if (!requestedBusinessId) {
    return NextResponse.json({ success: false, message: "Business id is required." }, { status: 400 });
  }

  const authorizedContext = hydrateAuthorizedSessionFromMemberships(currentSession);
  const authorizedSession = authorizedContext.session;

  if (!authorizedSession || !authorizedSession.allowedBusinessIds.includes(requestedBusinessId)) {
    return NextResponse.json(
      { success: false, message: "That business is not available for this session." },
      { status: 403 }
    );
  }

  const nextSession = updateSessionActiveBusiness(authorizedSession, requestedBusinessId);

  cookieStore.set(SESSION_COOKIE, serializeAuthorizedSession(nextSession), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, nextSession.activeBusinessId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_BUSINESS_MAX_AGE
  });

  return NextResponse.json({
    success: true,
    activeBusinessId: nextSession.activeBusinessId
  });
}
