"use server";

import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  studentParents,
  studentBudgets,
  vendorCatalog,
  purchaseRequests,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitPurchaseRequest(
  catalogItemId: number,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  const user = await requireRole("parent");

  if (quantity < 1 || quantity > 10) {
    return { success: false, error: "Invalid quantity." };
  }

  // Get linked student
  const parentRows = await db
    .select({ studentId: studentParents.studentId })
    .from(studentParents)
    .where(eq(studentParents.userId, user.id))
    .limit(1);

  const studentId = parentRows[0]?.studentId;
  if (!studentId) {
    return { success: false, error: "No student linked to your account." };
  }

  // Get catalog item
  const itemRows = await db
    .select({
      price: vendorCatalog.price,
      isActive: vendorCatalog.isActive,
    })
    .from(vendorCatalog)
    .where(eq(vendorCatalog.id, catalogItemId))
    .limit(1);

  const item = itemRows[0];
  if (!item || !item.isActive) {
    return { success: false, error: "Item not found or unavailable." };
  }

  const unitPrice = Number(item.price);
  const totalPrice = unitPrice * quantity;

  // Check budget
  const budgetRows = await db
    .select({
      id: studentBudgets.id,
      totalAmount: studentBudgets.totalAmount,
      spentAmount: studentBudgets.spentAmount,
    })
    .from(studentBudgets)
    .where(
      and(
        eq(studentBudgets.studentId, studentId),
        eq(studentBudgets.schoolYear, "2024-2025")
      )
    )
    .limit(1);

  const budget = budgetRows[0];
  if (!budget) {
    return { success: false, error: "No budget found for this school year." };
  }

  const remaining = Number(budget.totalAmount) - Number(budget.spentAmount);
  if (totalPrice > remaining) {
    return {
      success: false,
      error: `Insufficient budget. You have $${remaining.toFixed(2)} remaining.`,
    };
  }

  // Insert purchase request
  await db.insert(purchaseRequests).values({
    studentId,
    catalogItemId,
    quantity,
    unitPrice: unitPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
    status: "pending",
    requestedBy: user.id,
  });

  // Update spent amount
  await db
    .update(studentBudgets)
    .set({
      spentAmount: (Number(budget.spentAmount) + totalPrice).toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(studentBudgets.id, budget.id));

  revalidatePath("/parent/catalog");
  revalidatePath("/parent/dashboard");

  return { success: true };
}
