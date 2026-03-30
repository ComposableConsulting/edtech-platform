import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { NoteClient } from "./NoteClient";

export const runtime = "edge";

const gradeLabel = (g: number) =>
  g === 0 ? "Kindergarten" : `Grade ${g}`;

export default async function PocProgressPage({
  params,
}: {
  params: { studentId: string };
}) {
  const user = await requireRole("teacher");
  const studentId = parseInt(params.studentId, 10);

  if (isNaN(studentId)) notFound();

  const rows = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      grade: students.grade,
    })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.schoolId, user.schoolId!)))
    .limit(1);

  const student = rows[0];
  if (!student) notFound();

  return (
    <NoteClient
      studentId={student.id}
      studentName={`${student.firstName} ${student.lastName}`}
      gradeLabel={gradeLabel(student.grade)}
    />
  );
}
