import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { newsletters } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Mail, Send } from "lucide-react";

export default async function NewslettersPage() {
  const user = await requireRole("teacher");
  const schoolId = user.schoolId!;

  const rows = await db
    .select({
      id: newsletters.id,
      title: newsletters.title,
      subjectLine: newsletters.subjectLine,
      status: newsletters.status,
      recipientType: newsletters.recipientType,
      sentAt: newsletters.sentAt,
      createdAt: newsletters.createdAt,
      htmlContent: newsletters.htmlContent,
    })
    .from(newsletters)
    .where(eq(newsletters.schoolId, schoolId))
    .orderBy(desc(newsletters.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletters</h1>
          <p className="text-gray-500 text-sm mt-1">
            Monthly family communications for Coastal Connections Academy.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          No newsletters yet.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((n) => (
            <details key={n.id} className="bg-white rounded-xl border border-gray-200 group">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none hover:bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    n.status === "sent" ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    {n.status === "sent" ? (
                      <Send className="w-4 h-4 text-green-600" />
                    ) : (
                      <Mail className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.subjectLine}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                    n.status === "sent"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {n.status}
                  </span>
                  {n.sentAt && (
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {new Date(n.sentAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  )}
                  <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              {n.htmlContent && (
                <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: n.htmlContent }}
                  />
                </div>
              )}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
