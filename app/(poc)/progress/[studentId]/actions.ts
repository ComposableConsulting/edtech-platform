"use server";

import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { students, engagementLogs, studentProgressNotes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type NoteInputs = {
  subject: string;
  engagementSummary: string;
  parentContact: string;
  nextSteps: string;
};

export async function generatePocDraft(
  studentId: number,
  inputs: NoteInputs
): Promise<{ draft: string; error?: never } | { draft?: never; error: string }> {
  await requireRole("teacher");

  // Get grade only — no name or identifiers sent to AI
  const studentRows = await db
    .select({ grade: students.grade, schoolId: students.schoolId })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  const student = studentRows[0];
  if (!student) return { error: "Student not found." };

  const gradeLabel = student.grade === 0 ? "Kindergarten" : `Grade ${student.grade}`;

  // Recent activity types only — no names or identifying details
  const logs = await db
    .select({
      activityType: engagementLogs.activityType,
      durationMinutes: engagementLogs.durationMinutes,
    })
    .from(engagementLogs)
    .where(eq(engagementLogs.studentId, studentId))
    .orderBy(desc(engagementLogs.logDate))
    .limit(15);

  const activitySummary =
    logs.length > 0
      ? logs.map((l) => `${l.activityType} (${l.durationMinutes} min)`).join(", ")
      : "No recent activity logged.";

  const prompt = `You are helping a teacher at a California independent study charter school write a monthly progress note.

STUDENT CONTEXT (anonymized):
- Grade: ${gradeLabel}
- Primary subject this period: ${inputs.subject}
- Recent activities: ${activitySummary}

TEACHER'S ROUGH NOTES:
- Engagement summary: ${inputs.engagementSummary}
- Parent contact: ${inputs.parentContact || "None this period"}
- Next steps: ${inputs.nextSteps}

Write a professional 2–3 paragraph progress note suitable for an official IS charter school record. Requirements:
- Written in first person as the teacher
- Professional, compliance-friendly tone
- References the subject focus and engagement observations
- Includes parent communication if provided
- Ends with clear next steps
- Do NOT include student name, date, or any headers — just the note body

Keep it concise: 150–200 words.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const draft = message.content[0]?.type === "text" ? message.content[0].text : "";
  if (!draft) return { error: "Failed to generate draft. Please try again." };

  return { draft };
}

export async function savePocNote(
  studentId: number,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireRole("teacher");

  if (!content.trim()) return { success: false, error: "Note content is required." };

  const studentRows = await db
    .select({ id: students.id })
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
    aiDrafted: true,
  });

  revalidatePath("/poc/dashboard");
  revalidatePath("/teacher/progress");

  return { success: true };
}
