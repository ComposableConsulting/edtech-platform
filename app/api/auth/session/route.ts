import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyFirebaseIdToken, createSession } from "@/lib/auth/edge-session";

export const runtime = "edge";

const SESSION_MAX_AGE = 60 * 60 * 24 * 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body as { idToken: string };

    if (!idToken) {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const secret = process.env.SESSION_SECRET;

    if (!apiKey || !secret) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const firebaseUser = await verifyFirebaseIdToken(idToken, apiKey);
    if (!firebaseUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { uid, email } = firebaseUser;

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, uid))
      .limit(1);

    let userRole: string;

    if (existingUsers.length === 0) {
      const displayName = email?.split("@")[0] ?? "Unknown";
      const schoolRows = await db.select({ id: schools.id }).from(schools).limit(1);
      const schoolId = schoolRows[0]?.id ?? null;
      const role = email?.includes("+teacher") ? "teacher" : "parent";

      await db.insert(users).values({
        id: uid,
        email: email!,
        displayName,
        role,
        schoolId,
      });

      userRole = role;
    } else {
      userRole = existingUsers[0].role;
    }

    const sessionToken = await createSession(uid, userRole, secret);
    const secure = request.url.startsWith("https");
    const response = NextResponse.json({ role: userRole });

    response.cookies.set("__session", sessionToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    response.cookies.set("__role", userRole, {
      httpOnly: false,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("[POST /api/auth/session]", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const secure = request.url.startsWith("https");
    const response = NextResponse.json({ success: true });
    const opts = {
      httpOnly: true,
      secure,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    };
    response.cookies.set("__session", "", opts);
    response.cookies.set("__role", "", { ...opts, httpOnly: false });
    return response;
  } catch (error) {
    console.error("[DELETE /api/auth/session]", error);
    return NextResponse.json({ error: "Failed to clear session" }, { status: 500 });
  }
}
