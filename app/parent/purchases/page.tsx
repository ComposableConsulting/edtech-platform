import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  studentParents,
  purchaseRequests,
  vendorCatalog,
  studentBudgets,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { PurchasesClient } from "./PurchasesClient";

export const runtime = "edge";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

export default async function PurchasesPage() {
  const user = await requireRole("parent");

  const parentRows = await db
    .select({ studentId: studentParents.studentId })
    .from(studentParents)
    .where(eq(studentParents.userId, user.id))
    .limit(1);

  const studentId = parentRows[0]?.studentId;

  if (!studentId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl border border-gray-200 p-10 max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No student linked</h2>
          <p className="text-gray-500 text-sm">
            Contact your school administrator to link your account to a student.
          </p>
        </div>
      </div>
    );
  }

  const [purchases, budgetRows] = await Promise.all([
    db
      .select({
        id: purchaseRequests.id,
        itemName: vendorCatalog.itemName,
        vendorName: vendorCatalog.vendorName,
        quantity: purchaseRequests.quantity,
        unitPrice: purchaseRequests.unitPrice,
        totalPrice: purchaseRequests.totalPrice,
        status: purchaseRequests.status,
        teacherNotes: purchaseRequests.teacherNotes,
        createdAt: purchaseRequests.createdAt,
      })
      .from(purchaseRequests)
      .innerJoin(vendorCatalog, eq(purchaseRequests.catalogItemId, vendorCatalog.id))
      .where(eq(purchaseRequests.studentId, studentId))
      .orderBy(desc(purchaseRequests.createdAt)),

    db
      .select({
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
      .limit(1),
  ]);

  const budget = budgetRows[0] ?? { totalAmount: "0", spentAmount: "0" };
  const total = Number(budget.totalAmount);
  const spent = Number(budget.spentAmount);
  const remaining = total - spent;

  const approved = purchases.filter((p) =>
    ["approved", "ordered", "received"].includes(p.status)
  );
  const pending = purchases.filter((p) => p.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Purchase Requests</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track all requests you've submitted this school year.
        </p>
      </div>

      {/* Budget summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Budget", value: fmt(total), color: "text-gray-900" },
          { label: "Spent", value: fmt(spent), color: "text-blue-600" },
          { label: "Remaining", value: fmt(remaining), color: "text-green-600" },
          { label: "Requests", value: String(purchases.length), color: "text-gray-900" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-4 space-y-1"
          >
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {pending.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          <span className="font-semibold">{pending.length} request{pending.length > 1 ? "s" : ""} pending</span>{" "}
          — awaiting teacher review.
        </div>
      )}

      <PurchasesClient
        purchases={purchases.map((p) => ({
          ...p,
          unitPrice: String(p.unitPrice),
          totalPrice: String(p.totalPrice),
          createdAt: p.createdAt ?? new Date(),
        }))}
      />
    </div>
  );
}
