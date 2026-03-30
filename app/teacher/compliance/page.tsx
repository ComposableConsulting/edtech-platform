import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { students, engagementLogs } from "@/lib/db/schema";
import { eq, and, gte, count, sum } from "drizzle-orm";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const runtime = "edge";

// CA IS charter compliance: minimum ~1 hour/day → ~20 hours/month
const MONTHLY_HOURS_MIN = 20;

export default async function CompliancePage() {
  const user = await requireRole("teacher");
  const schoolId = user.schoolId!;

  // Current month window
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const studentRows = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      grade: students.grade,
    })
    .from(students)
    .where(and(eq(students.schoolId, schoolId), eq(students.isActive, true)))
    .orderBy(students.grade, students.lastName);

  const logRows = await db
    .select({
      studentId: engagementLogs.studentId,
      totalMinutes: sum(engagementLogs.durationMinutes),
      sessionCount: count(),
    })
    .from(engagementLogs)
    .innerJoin(students, eq(engagementLogs.studentId, students.id))
    .where(
      and(
        eq(students.schoolId, schoolId),
        gte(engagementLogs.createdAt, firstOfMonth)
      )
    )
    .groupBy(engagementLogs.studentId);

  const logMap = Object.fromEntries(
    logRows.map((l) => [
      l.studentId,
      {
        minutes: Number(l.totalMinutes ?? 0),
        sessions: Number(l.sessionCount),
      },
    ])
  );

  const gradeLabel = (g: number) => (g === 0 ? "K" : `G${g}`);

  const atRisk = studentRows.filter((s) => {
    const hours = (logMap[s.id]?.minutes ?? 0) / 60;
    return hours < MONTHLY_HOURS_MIN;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance Report</h1>
        <p className="text-gray-500 text-sm mt-1">
          Engagement tracking for {monthLabel} &middot; Minimum {MONTHLY_HOURS_MIN} hours/month per student
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{studentRows.length}</p>
        </div>
        <div className={`bg-white rounded-xl border p-5 ${atRisk.length > 0 ? "border-amber-300" : "border-gray-200"}`}>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">At Risk</p>
          <p className={`text-2xl font-bold ${atRisk.length > 0 ? "text-amber-600" : "text-gray-900"}`}>
            {atRisk.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">On Track</p>
          <p className="text-2xl font-bold text-green-600">{studentRows.length - atRisk.length}</p>
        </div>
      </div>

      {/* At-risk alert */}
      {atRisk.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
          <span>
            <strong>{atRisk.length} student{atRisk.length > 1 ? "s" : ""}</strong> are below the {MONTHLY_HOURS_MIN}-hour threshold for {monthLabel}. Contact their families.
          </span>
        </div>
      )}

      {/* Student table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Grade</th>
                <th className="px-5 py-3 font-medium">Hours This Month</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Sessions</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {studentRows.map((s) => {
                const log = logMap[s.id];
                const minutes = log?.minutes ?? 0;
                const hours = minutes / 60;
                const sessions = log?.sessions ?? 0;
                const onTrack = hours >= MONTHLY_HOURS_MIN;
                const pct = Math.min((hours / MONTHLY_HOURS_MIN) * 100, 100);

                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">
                      {gradeLabel(s.grade)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className={`font-semibold ${onTrack ? "text-gray-800" : "text-amber-600"}`}>
                            {hours.toFixed(1)}h
                          </span>
                          <span className="text-xs text-gray-400">/ {MONTHLY_HOURS_MIN}h</span>
                        </div>
                        <div className="w-32 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${onTrack ? "bg-green-500" : "bg-amber-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
                      {sessions}
                    </td>
                    <td className="px-5 py-3">
                      {onTrack ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />On track
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />At risk
                        </span>
                      )}
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
