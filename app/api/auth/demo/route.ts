import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/edge-session";

export const runtime = "edge";

const SESSION_MAX_AGE = 60 * 60 * 24 * 5;

const DEMO_ACCOUNTS = {
  parent: { uid: "parent-uid-1", role: "parent" },
  teacher: { uid: "teacher-uid-placeholder", role: "teacher" },
} as const;

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const body = await request.json() as { role?: string };
    const role = body.role === "teacher" ? "teacher" : "parent";
    const account = DEMO_ACCOUNTS[role];

    const sessionToken = await createSession(account.uid, account.role, secret);

    const secure = request.url.startsWith("https");
    const response = NextResponse.json({ role: account.role });

    response.cookies.set("__session", sessionToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    response.cookies.set("__role", account.role, {
      httpOnly: false,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("[POST /api/auth/demo]", error);
    return NextResponse.json({ error: "Demo login failed" }, { status: 500 });
  }
}
