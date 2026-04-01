import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "@/lib/auth/edge-session";

export const runtime = "edge";

const SESSION_MAX_AGE = 60 * 60 * 24 * 5;

const DEMO_ACCOUNTS = {
  parent: { uid: "parent-uid-1", role: "parent" },
  teacher: { uid: "teacher-uid-placeholder", role: "teacher" },
} as const;

export async function POST(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const body = await request.json() as { role?: string };
  const role = body.role === "teacher" ? "teacher" : "parent";
  const account = DEMO_ACCOUNTS[role];

  const sessionToken = await createSession(account.uid, account.role, secret);
  const cookieStore = cookies();

  cookieStore.set("__session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  cookieStore.set("__role", account.role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return NextResponse.json({ role: account.role });
}
