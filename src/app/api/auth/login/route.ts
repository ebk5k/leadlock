import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isValidDemoLogin, SESSION_COOKIE, SESSION_MAX_AGE, SESSION_VALUE } from "@/lib/auth/session";

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
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });

  return NextResponse.json({ success: true, redirectTo });
}
