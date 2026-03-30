import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  studentParents,
  students,
  studentBudgets,
  purchaseRequests,
  vendorCatalog,
  engagementLogs,
} from "@/lib/db/schema";
import { eq, desc, count, and, gte } from "drizzle-orm";
import Link from "next/link";
import { ShoppingBag, MessageSquare, Receipt } from "lucide-react";

export const runtime = "edge";

const fmt = (amount: string | number | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(amount ?? 0)
  );

const gradeLabel = (grade: number) =>
  grade === 0 ? "Kindergarten" : `Grade ${grade}`;

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700",
  ordered: "bg-blue-100 text-blue-700",
  received: "bg-gray-100 text-gray-700",
};

export default async function ParentDashboardPage() {
  const user = await requireRole("parent");

  // 1. Get linked student
  const studentParentRows = await db
    .select({ studentId: studentParents.studentId })
    .from(studentParents)
    .where(eq(studentParents.userId, user.id));

  const studentId = studentParentRows[0]?.studentId ?? null;

  if (!studentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-white rounded-xl border border-gray-200 p-10 max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No student linked
          </h2>
          <p className="text-gray-500 text-sm">
            Your account is not yet linked to a student. Please contact your
            school administrator to get set up.
          </p>
        </div>
      </div>
    );
  }

  // 2. Get student details
  const studentRows = await db
    .select({
      firstName: students.firstName,
      lastName: students.lastName,
      grade: students.grade,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  const student = studentRows[0] ?? null;

  // 3. Get student budget for 2024-2025
  const budgetRows = await db
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
    .limit(1);

  const budget = budgetRows[0] ?? { totalAmount: "0", spentAmount: "0" };
  const totalAmount = Number(budget.totalAmount);
  const spentAmount = Number(budget.spentAmount);
  const remainingAmount = totalAmount - spentAmount;
  const spentPercent =
    totalAmount > 0 ? Math.min((spentAmount / totalAmount) * 100, 100) : 0;

  // 4. Get recent purchase requests (last 5)
  const recentPurchases = await db
    .select({
      id: purchaseRequests.id,
      itemName: vendorCatalog.itemName,
      totalPrice: purchaseRequests.totalPrice,
      status: purchaseRequests.status,
      createdAt: purchaseRequests.createdAt,
    })
    .from(purchaseRequests)
    .innerJoin(
      vendorCatalog,
      eq(purchaseRequests.catalogItemId, vendorCatalog.id)
    )
    .where(eq(purchaseRequests.studentId, studentId))
    .orderBy(desc(purchaseRequests.createdAt))
    .limit(5);

  // 5. Engagement log count for current month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const engagementCountRows = await db
    .select({ value: count() })
    .from(engagementLogs)
    .where(
      and(
        eq(engagementLogs.studentId, studentId),
        gte(engagementLogs.createdAt, firstOfMonth)
      )
    );
  const engagementCount = engagementCountRows[0]?.value ?? 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {user.displayName}!
        </h1>
        {student && (
          <p className="text-gray-500 mt-1">
            Student:{" "}
            <span className="font-medium text-gray-700">
              {student.firstName} {student.lastName}
            </span>{" "}
            &middot; {gradeLabel(student.grade)}
          </p>
        )}
      </div>

      {/* Row 1 — Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            Total Budget
          </p>
          <p className="text-2xl font-bold text-gray-900">{fmt(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            Spent
          </p>
          <p className="text-2xl font-bold text-amber-600">{fmt(spentAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            Remaining
          </p>
          <p className="text-2xl font-bold text-green-600">
            {fmt(remainingAmount)}
          </p>
        </div>
      </div>

      {/* Budget progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Budget used</span>
          <span>{spentPercent.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${spentPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{fmt(spentAmount)} spent</span>
          <span>{fmt(totalAmount)} total</span>
        </div>
      </div>

      {/* Row 2 — Recent Purchase Requests */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Recent Purchase Requests
          </h2>
          <Link
            href="/parent/purchases"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </Link>
        </div>

        {recentPurchases.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            No purchase requests yet.{" "}
            <Link
              href="/parent/catalog"
              className="text-blue-600 hover:underline"
            >
              Browse the catalog to get started.
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {p.itemName}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {fmt(p.totalPrice)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          statusStyles[p.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 3 — Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/parent/catalog"
          className="group bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Browse Catalog</p>
            <p className="text-xs text-gray-400">Find items for your student</p>
          </div>
        </Link>

        <Link
          href="/parent/coach"
          className="group bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-purple-300 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
            <MessageSquare className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Chat with AI Coach
            </p>
            <p className="text-xs text-gray-400">
              Get personalized guidance
            </p>
          </div>
        </Link>

        <Link
          href="/parent/purchases"
          className="group bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-green-300 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
            <Receipt className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              View All Purchases
            </p>
            <p className="text-xs text-gray-400">
              Track all your requests
            </p>
          </div>
        </Link>
      </div>

      {/* Engagement note */}
      <p className="text-xs text-gray-400">
        {engagementCount} engagement{engagementCount !== 1 ? "s" : ""} logged
        this month.
      </p>
    </div>
  );
}
