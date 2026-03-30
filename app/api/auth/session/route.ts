import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days in seconds
const SESSION_EXPIRES_MS = SESSION_MAX_AGE * 1000; // milliseconds for Firebase

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body as { idToken: string };

    if (!idToken) {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    // Verify the ID token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // Look up user in DB; insert if not found
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, uid))
      .limit(1);

    let userRole: string;

    if (existingUsers.length === 0) {
      // First login — insert with default role of 'parent'
      const displayName =
        decodedToken.name ?? email?.split("@")[0] ?? "Unknown";

      // Use the first school in the DB (works for single-school demo)
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

      userRole = "parent";
    } else {
      userRole = existingUsers[0].role;
    }

    // Create a Firebase session cookie (server-side, HttpOnly)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_MS,
    });

    const cookieStore = cookies();

    // HttpOnly session cookie — not readable by JS
    cookieStore.set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    // Readable role cookie — read by middleware without Admin verification
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
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = cookies();

    cookieStore.set("__session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    cookieStore.set("__role", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/auth/session]", error);
    return NextResponse.json(
      { error: "Failed to clear session" },
      { status: 500 }
    );
  }
}
