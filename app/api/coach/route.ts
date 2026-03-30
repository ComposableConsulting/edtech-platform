import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  studentParents,
  students,
  studentBudgets,
  purchaseRequests,
  vendorCatalog,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const runtime = "edge";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const user = await requireRole("parent").catch(() => null);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Invalid messages", { status: 400 });
  }

  // Load student context
  const parentRows = await db
    .select({
      studentId: studentParents.studentId,
      firstName: students.firstName,
      lastName: students.lastName,
      grade: students.grade,
      schoolId: students.schoolId,
    })
    .from(studentParents)
    .innerJoin(students, eq(studentParents.studentId, students.id))
    .where(eq(studentParents.userId, user.id))
    .limit(1);

  const student = parentRows[0] ?? null;

  let contextBlock = "";

  if (student) {
    const [budgetRows, recentPurchases] = await Promise.all([
      db
        .select({
          totalAmount: studentBudgets.totalAmount,
          spentAmount: studentBudgets.spentAmount,
        })
        .from(studentBudgets)
        .where(
          and(
            eq(studentBudgets.studentId, student.studentId),
            eq(studentBudgets.schoolYear, "2024-2025")
          )
        )
        .limit(1),

      db
        .select({
          itemName: vendorCatalog.itemName,
          vendorName: vendorCatalog.vendorName,
          totalPrice: purchaseRequests.totalPrice,
          status: purchaseRequests.status,
        })
        .from(purchaseRequests)
        .innerJoin(vendorCatalog, eq(purchaseRequests.catalogItemId, vendorCatalog.id))
        .where(eq(purchaseRequests.studentId, student.studentId))
        .orderBy(desc(purchaseRequests.createdAt))
        .limit(5),
    ]);

    const budget = budgetRows[0] ?? { totalAmount: "2000", spentAmount: "0" };
    const remaining = Number(budget.totalAmount) - Number(budget.spentAmount);

    const purchaseList =
      recentPurchases.length > 0
        ? recentPurchases
            .map(
              (p) =>
                `- ${p.itemName} (${p.vendorName}): $${Number(p.totalPrice).toFixed(2)} — ${p.status}`
            )
            .join("\n")
        : "None yet.";

    contextBlock = `
Student: ${student.firstName} ${student.lastName}
Grade: ${student.grade === 0 ? "Kindergarten" : `Grade ${student.grade}`}
School Year Budget: $${Number(budget.totalAmount).toFixed(2)}
Budget Remaining: $${remaining.toFixed(2)}
Recent purchase requests:
${purchaseList}
`;
  }

  const systemPrompt = `You are an AI Learning Coach for an independent study (IS) charter school in California. You help parents make the best use of their child's educational budget to support learning at home.

Your role:
- Help parents choose curriculum, learning materials, and enrichment activities
- Give specific, actionable vendor and product recommendations
- Help plan a balanced learning program across subjects
- Explain California IS charter school rules (parents are the primary educators; budgets cover approved educational expenses)
- Be warm, encouraging, and concise

${student ? `Current student context:\n${contextBlock}` : ""}

When recommending items, prioritize things that are high-value for the budget. If the parent mentions a subject or goal, suggest 2–3 concrete resources. Keep responses focused and practical — avoid long preambles.`;

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
