import { requireRole } from "@/lib/auth/session";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const runtime = "edge";

export default async function PocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("teacher");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/poc/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                Coastal Connections Academy
              </p>
              <p className="text-xs text-gray-400 leading-tight">
                AI Progress Notes — Demo
              </p>
            </div>
          </Link>
          <span className="text-xs text-gray-400 hidden sm:block">
            {user.displayName}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
