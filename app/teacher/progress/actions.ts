"use server";

import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  students,
  engagementLogs,
  studentProgressNotes,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateProgressDraft(
  studentId: number
): Promise<{ draft: string; error?: never } | { draft?: never; error: string }> {
  const user = await requireRole("teacher");

  // Verify student belongs to teacher's school
  const studentRows = await db
    .select({
      firstName: students.firstName,
      lastName: students.lastName,
      grade: students.grade,
      schoolId: students.schoolId,
    })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.schoolId, user.schoolId!)))
    .limit(1);

  const student = studentRows[0];
  if (!student) return { error: "Student not found." };

  const gradeLabel = student.grade === 0 ? "Kindergarten" : `Grade ${student.grade}`;

  // Last 30 days of engagement logs
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const logs = await db
    .select({
      logDate: engagementLogs.logDate,
      activityType: engagementLogs.activityType,
      durationMinutes: engagementLogs.durationMinutes,
      description: engagementLogs.description,
    })
    .from(engagementLogs)
    .where(eq(engagementLogs.studentId, studentId))
    .orderBy(desc(engagementLogs.logDate))
    .limit(20);

  const logSummary =
    logs.length > 0
      ? logs
          .map(
            (l) =>
              `- ${l.logDate}: ${l.activityType} (${l.durationMinutes} min) — ${l.description ?? "no details"}`
          )
          .join("\n")
      : "No engagement logs available for this period.";

  const prompt = `You are writing a monthly progress note for an independent study charter school teacher in California.

Student: ${student.firstName} ${student.lastName}
Grade: ${gradeLabel}

Recent engagement log entries (last 30 days):
${logSummary}

Write a professional 2-3 paragraph progress note. Cover:
1. Overall progress and engagement this month
2. Specific subject area highlights based on the activity log
3. Any areas for growth and recommendations for next month

Write in first person as the teacher. Be specific and reference actual activities from the log. Keep it factual and professional — this is an official school document. Do not include any preamble or sign-off, just the note body.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const draft =
    message.content[0]?.type === "text" ? message.content[0].text : "";

  if (!draft) return { error: "Failed to generate draft." };

  return { draft };
}

export async function saveProgressNote(
  studentId: number,
  content: string,
  aiDrafted: boolean
): Promise<{ success: boolean; error?: string }> {
  const user = await requireRole("teacher");

  if (!content.trim()) return { success: false, error: "Note content is required." };

  const studentRows = await db
    .select({ schoolId: students.schoolId })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.schoolId, user.schoolId!)))
    .limit(1);

  if (!studentRows[0]) return { success: false, error: "Student not found." };

  const today = new Date().toISOString().split("T")[0];

  await db.insert(studentProgressNotes).values({
    studentId,
    teacherId: user.id,
    noteDate: today,
    content: content.trim(),
    aiDrafted,
  });

  revalidatePath("/teacher/progress");
  return { success: true };
}
