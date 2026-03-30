import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/edge-session";

export async function getCurrentUser() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("__session")?.value;
  if (!sessionCookie) return null;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const payload = await verifySession(sessionCookie, secret);
  if (!payload) return null;

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.uid))
      .limit(1);
    return result[0] ?? null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: "parent" | "teacher" | "admin") {
  const user = await requireUser();
  if (user.role !== role) redirect(`/${user.role}/dashboard`);
  return user;
}
