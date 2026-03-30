import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { studentParents, students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CoachClient } from "./CoachClient";

export default async function CoachPage() {
  const user = await requireRole("parent");

  const parentRows = await db
    .select({
      firstName: students.firstName,
      lastName: students.lastName,
      grade: students.grade,
    })
    .from(studentParents)
    .innerJoin(students, eq(studentParents.studentId, students.id))
    .where(eq(studentParents.userId, user.id))
    .limit(1);

  const student = parentRows[0] ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Learning Coach</h1>
        <p className="text-gray-500 text-sm mt-1">
          Get personalized curriculum advice and budget guidance powered by AI.
        </p>
      </div>

      {student ? (
        <CoachClient
          studentName={`${student.firstName} ${student.lastName}`}
          gradeLevel={student.grade === 0 ? "K" : String(student.grade)}
        />
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-xl border border-gray-200 p-10 max-w-md text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No student linked</h2>
            <p className="text-gray-500 text-sm">
              Contact your school administrator to link your account to a student.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
