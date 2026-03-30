import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { students, studentProgressNotes } from "@/lib/db/schema";
import { eq, and, desc, max } from "drizzle-orm";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

const gradeLabel = (g: number) => (g === 0 ? "Kindergarten" : `Grade ${g}`);

export default async function PocDashboardPage() {
  const user = await requireRole("teacher");
  const schoolId = user.schoolId!;

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

  const lastNoteRows = await db
    .select({
      studentId: studentProgressNotes.studentId,
      lastNote: max(studentProgressNotes.noteDate),
    })
    .from(studentProgressNotes)
    .groupBy(studentProgressNotes.studentId);

  const lastNoteMap = Object.fromEntries(
    lastNoteRows.map((n) => [n.studentId, n.lastNote])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Roster</h1>
        <p className="text-gray-500 text-sm mt-1">
          Select a student to draft an AI-assisted progress note.
        </p>
      </div>

      {/* Student grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {studentRows.map((s) => {
          const lastNote = lastNoteMap[s.id] ?? null;
          return (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700 shrink-0">
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {gradeLabel(s.grade)}
                    {lastNote && (
                      <> &middot; Last note{" "}
                        {new Date(lastNote).toLocaleDateString("en-US", {
                          month: "short", day: "numeric",
                        })}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Link
                href={`/poc/progress/${s.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Write Note
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
