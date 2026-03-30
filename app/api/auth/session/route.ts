import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyFirebaseIdToken, createSession } from "@/lib/auth/edge-session";

export const runtime = "edge";

const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days in seconds

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

    // Verify the Firebase ID token via REST API (no Admin SDK needed)
    const firebaseUser = await verifyFirebaseIdToken(idToken, apiKey);
    if (!firebaseUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { uid, email } = firebaseUser;

    // Look up user in DB; insert if not found
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

    // Create edge-compatible HMAC session
    const sessionToken = await createSession(uid, userRole, secret);

    const cookieStore = cookies();

    cookieStore.set("__session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    cookieStore.set("__role", userRole, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return NextResponse.json({ role: userRole });
  } catch (error) {
    console.error("[POST /api/auth/session]", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = cookies();
    const opts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    };
    cookieStore.set("__session", "", opts);
    cookieStore.set("__role", "", { ...opts, httpOnly: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/auth/session]", error);
    return NextResponse.json({ error: "Failed to clear session" }, { status: 500 });
  }
}
