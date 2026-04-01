import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hydrateAuthorizedSessionFromMemberships } from "@/lib/auth/memberships";
import {
  createAuthorizedSession,
  isValidDemoLogin,
  serializeAuthorizedSession,
  SESSION_BUSINESS_MAX_AGE,
  SESSION_COOKIE,
  SESSION_MAX_AGE
} from "@/lib/auth/session";
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/business-context";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    redirectTo?: string;
  };

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const redirectTo = body.redirectTo?.startsWith("/app") ? body.redirectTo : "/app";

  if (!isValidDemoLogin(email, password)) {
    return NextResponse.json(
      { success: false, message: "Use demo@leadlock.app / demo1234 for the MVP demo." },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  const initialSession = createAuthorizedSession();
  const authorizedContext = hydrateAuthorizedSessionFromMemberships(initialSession);
  const session = authorizedContext.session ?? initialSession;
  const activeBusinessId = session.activeBusinessId;

  cookieStore.set(SESSION_COOKIE, serializeAuthorizedSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, activeBusinessId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_BUSINESS_MAX_AGE
  });

  return NextResponse.json({ success: true, redirectTo });
}
