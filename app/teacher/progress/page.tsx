import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { students, studentProgressNotes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Sparkles } from "lucide-react";
import { NewNotePanel } from "./ProgressClient";

export default async function ProgressPage() {
  const user = await requireRole("teacher");
  const schoolId = user.schoolId!;

  const [studentRows, notes] = await Promise.all([
    db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        grade: students.grade,
      })
      .from(students)
      .where(and(eq(students.schoolId, schoolId), eq(students.isActive, true)))
      .orderBy(students.grade, students.lastName),

    db
      .select({
        id: studentProgressNotes.id,
        studentId: studentProgressNotes.studentId,
        noteDate: studentProgressNotes.noteDate,
        content: studentProgressNotes.content,
        aiDrafted: studentProgressNotes.aiDrafted,
        firstName: students.firstName,
        lastName: students.lastName,
        grade: students.grade,
      })
      .from(studentProgressNotes)
      .innerJoin(students, eq(studentProgressNotes.studentId, students.id))
      .where(eq(students.schoolId, schoolId))
      .orderBy(desc(studentProgressNotes.noteDate))
      .limit(20),
  ]);

  const gradeLabel = (g: number) => (g === 0 ? "K" : `G${g}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress Notes</h1>
        <p className="text-gray-500 text-sm mt-1">
          AI-assisted monthly progress reports for each student.
        </p>
      </div>

      <NewNotePanel students={studentRows} />

      {/* Existing notes */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Recent Notes</h2>

        {notes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
            No progress notes yet. Use the panel above to draft your first one.
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">
                    {note.firstName} {note.lastName}
                  </p>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {gradeLabel(note.grade)}
                  </span>
                  {note.aiDrafted && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" />AI drafted
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(note.noteDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
