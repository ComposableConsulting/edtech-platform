import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  students,
  studentBudgets,
  purchaseRequests,
  vendorCatalog,
  engagementLogs,
} from "@/lib/db/schema";
import { eq, desc, sum, count, and, gte } from "drizzle-orm";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  DollarSign,
  TrendingUp,
  FileText,
  Mail,
  Shield,
} from "lucide-react";

const fmt = (amount: string | number | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(amount ?? 0)
  );

const gradeLabel = (grade: number) =>
  grade === 0 ? "Kindergarten" : `Grade ${grade}`;

export default async function TeacherDashboardPage() {
  const user = await requireRole("teacher");
  const schoolId = user.schoolId!;

  // 1. Total active students count
  const activeStudentRows = await db
    .select({ value: count() })
    .from(students)
    .where(and(eq(students.schoolId, schoolId), eq(students.isActive, true)));
  const activeStudentCount = activeStudentRows[0]?.value ?? 0;

  // 2. Pending purchase requests count + first 5 with student and item details
  const pendingRequests = await db
    .select({
      id: purchaseRequests.id,
      totalPrice: purchaseRequests.totalPrice,
      createdAt: purchaseRequests.createdAt,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      itemName: vendorCatalog.itemName,
    })
    .from(purchaseRequests)
    .innerJoin(students, eq(purchaseRequests.studentId, students.id))
    .innerJoin(
      vendorCatalog,
      eq(purchaseRequests.catalogItemId, vendorCatalog.id)
    )
    .where(
      and(
        eq(students.schoolId, schoolId),
        eq(purchaseRequests.status, "pending")
      )
    )
    .orderBy(desc(purchaseRequests.createdAt))
    .limit(5);

  const pendingCountRows = await db
    .select({ value: count() })
    .from(purchaseRequests)
    .innerJoin(students, eq(purchaseRequests.studentId, students.id))
    .where(
      and(
        eq(students.schoolId, schoolId),
        eq(purchaseRequests.status, "pending")
      )
    );
  const pendingCount = pendingCountRows[0]?.value ?? 0;

  // 3. Total budget allocated vs spent
  const budgetRows = await db
    .select({
      totalAllocated: sum(studentBudgets.totalAmount),
      totalSpent: sum(studentBudgets.spentAmount),
    })
    .from(studentBudgets)
    .innerJoin(students, eq(studentBudgets.studentId, students.id))
    .where(
      and(
        eq(students.schoolId, schoolId),
        eq(studentBudgets.schoolYear, "2024-2025")
      )
    );

  const totalAllocated = Number(budgetRows[0]?.totalAllocated ?? 0);
  const totalSpent = Number(budgetRows[0]?.totalSpent ?? 0);
  const budgetSpentPercent =
    totalAllocated > 0
      ? ((totalSpent / totalAllocated) * 100).toFixed(1)
      : "0.0";

  // 4. Recent engagement logs (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const engagementCountRows = await db
    .select({ value: count() })
    .from(engagementLogs)
    .innerJoin(students, eq(engagementLogs.studentId, students.id))
    .where(
      and(
        eq(students.schoolId, schoolId),
        gte(engagementLogs.createdAt, thirtyDaysAgo)
      )
    );
  const engagementCount = engagementCountRows[0]?.value ?? 0;

  // 5. Recent students (5 most recently enrolled)
  const recentStudents = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      grade: students.grade,
      studentId: students.id,
    })
    .from(students)
    .where(and(eq(students.schoolId, schoolId), eq(students.isActive, true)))
    .orderBy(desc(students.enrollmentDate))
    .limit(5);

  // Get budget remaining for recent students
  const recentStudentIds = recentStudents.map((s) => s.id);
  type BudgetMap = Record<number, { total: number; spent: number }>;
  let budgetMap: BudgetMap = {};
  if (recentStudentIds.length > 0) {
    const budgets = await db
      .select({
        studentId: studentBudgets.studentId,
        totalAmount: studentBudgets.totalAmount,
        spentAmount: studentBudgets.spentAmount,
      })
      .from(studentBudgets)
      .where(eq(studentBudgets.schoolYear, "2024-2025"));
    budgetMap = budgets.reduce<BudgetMap>((acc, b) => {
      acc[b.studentId] = {
        total: Number(b.totalAmount),
        spent: Number(b.spentAmount),
      };
      return acc;
    }, {});
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.displayName}
        </h1>
        <p className="text-gray-500 mt-1">
          Coastal Connections Academy &middot; 2024-2025 School Year
        </p>
      </div>

      {/* Row 1 — 4 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Students */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Active Students
            </p>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeStudentCount}</p>
        </div>

        {/* Pending Approvals */}
        <div
          className={`bg-white rounded-xl border p-5 ${
            pendingCount > 0 ? "border-amber-300" : "border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Pending Approvals
            </p>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                pendingCount > 0 ? "bg-amber-100" : "bg-gray-100"
              }`}
            >
              <ClipboardList
                className={`w-4 h-4 ${
                  pendingCount > 0 ? "text-amber-600" : "text-gray-400"
                }`}
              />
            </div>
          </div>
          <p
            className={`text-3xl font-bold ${
              pendingCount > 0 ? "text-amber-600" : "text-gray-900"
            }`}
          >
            {pendingCount}
          </p>
        </div>

        {/* Budget Allocated */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Budget Allocated
            </p>
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {fmt(totalAllocated)}
          </p>
        </div>

        {/* Budget Spent */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Budget Spent
            </p>
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-gray-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {fmt(totalSpent)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{budgetSpentPercent}% of allocated</p>
        </div>
      </div>

      {/* Row 2 — Pending Purchase Requests (full width) */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Pending Purchase Requests
          </h2>
          <Link
            href="/teacher/orders"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all orders &rarr;
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            No pending purchase requests.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Student Name</th>
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Requested Date</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {req.studentFirstName} {req.studentLastName}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{req.itemName}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {fmt(req.totalPrice)}
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href="/teacher/orders"
                        className="px-3 py-1 text-xs font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 3 — Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Students */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Recent Students
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentStudents.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No students found.
              </div>
            ) : (
              recentStudents.map((s) => {
                const b = budgetMap[s.id];
                const remaining = b ? b.total - b.spent : null;
                return (
                  <div
                    key={s.id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {gradeLabel(s.grade)}
                      </p>
                    </div>
                    {remaining !== null ? (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {fmt(remaining)}
                        </p>
                        <p className="text-xs text-gray-400">remaining</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">No budget</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="p-5 space-y-3">
            <Link
              href="/teacher/progress"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <FileText className="w-4 h-4 text-blue-500" />
              Write Progress Note
            </Link>
            <Link
              href="/teacher/newsletters"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <Mail className="w-4 h-4 text-purple-500" />
              Send Newsletter
            </Link>
            <Link
              href="/teacher/compliance"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <Shield className="w-4 h-4 text-green-500" />
              View Compliance Report
            </Link>
          </div>
        </div>
      </div>

      {/* Engagement note */}
      <p className="text-xs text-gray-400">
        {engagementCount} engagement{engagementCount !== 1 ? "s" : ""} logged in
        the last 30 days across all students.
      </p>
    </div>
  );
}
