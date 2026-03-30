import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  students,
  studentBudgets,
  engagementLogs,
} from "@/lib/db/schema";
import { eq, and, desc, max } from "drizzle-orm";
import Link from "next/link";

export const runtime = "edge";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

const gradeLabel = (g: number) => (g === 0 ? "Kindergarten" : `Grade ${g}`);

export default async function StudentsPage() {
  const user = await requireRole("teacher");
  const schoolId = user.schoolId!;

  const [studentRows, budgetRows, lastLogRows] = await Promise.all([
    db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        grade: students.grade,
        enrollmentDate: students.enrollmentDate,
        isActive: students.isActive,
      })
      .from(students)
      .where(and(eq(students.schoolId, schoolId), eq(students.isActive, true)))
      .orderBy(students.grade, students.lastName),

    db
      .select({
        studentId: studentBudgets.studentId,
        totalAmount: studentBudgets.totalAmount,
        spentAmount: studentBudgets.spentAmount,
      })
      .from(studentBudgets)
      .where(eq(studentBudgets.schoolYear, "2024-2025")),

    db
      .select({
        studentId: engagementLogs.studentId,
        lastLog: max(engagementLogs.logDate),
      })
      .from(engagementLogs)
      .groupBy(engagementLogs.studentId),
  ]);

  const budgetMap = Object.fromEntries(
    budgetRows.map((b) => [
      b.studentId,
      { total: Number(b.totalAmount), spent: Number(b.spentAmount) },
    ])
  );

  const lastLogMap = Object.fromEntries(
    lastLogRows.map((l) => [l.studentId, l.lastLog])
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-500 text-sm mt-1">
          {studentRows.length} active student{studentRows.length !== 1 ? "s" : ""} &middot; 2024-2025
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Grade</th>
                <th className="px-5 py-3 font-medium">Budget</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {studentRows.map((s) => {
                const b = budgetMap[s.id];
                const total = b?.total ?? 0;
                const spent = b?.spent ?? 0;
                const remaining = total - spent;
                const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
                const lastLog = lastLogMap[s.id] ?? null;

                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-gray-400 sm:hidden mt-0.5">
                        {gradeLabel(s.grade)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">
                      {gradeLabel(s.grade)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 min-w-[140px]">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">{fmt(spent)} spent</span>
                          <span className="font-medium text-green-600">{fmt(remaining)} left</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              pct > 90 ? "bg-red-400" : pct > 70 ? "bg-amber-400" : "bg-blue-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400">{pct.toFixed(0)}% of {fmt(total)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-sm hidden md:table-cell">
                      {lastLog
                        ? new Date(lastLog).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : <span className="text-gray-300">None logged</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
