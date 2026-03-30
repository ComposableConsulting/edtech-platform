"use server";

import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { purchaseRequests, students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updatePurchaseStatus(
  requestId: number,
  status: "approved" | "denied" | "ordered" | "received",
  teacherNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireRole("teacher");

  // Verify the request belongs to this teacher's school
  const rows = await db
    .select({ id: purchaseRequests.id, schoolId: students.schoolId })
    .from(purchaseRequests)
    .innerJoin(students, eq(purchaseRequests.studentId, students.id))
    .where(
      and(
        eq(purchaseRequests.id, requestId),
        eq(students.schoolId, user.schoolId!)
      )
    )
    .limit(1);

  if (!rows[0]) {
    return { success: false, error: "Request not found." };
  }

  await db
    .update(purchaseRequests)
    .set({
      status,
      teacherNotes: teacherNotes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(purchaseRequests.id, requestId));

  revalidatePath("/teacher/orders");
  revalidatePath("/teacher/dashboard");

  return { success: true };
}
