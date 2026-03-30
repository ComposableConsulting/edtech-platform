"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateProgressDraft, saveProgressNote } from "./actions";

type Student = { id: number; firstName: string; lastName: string; grade: number };

const gradeLabel = (g: number) => (g === 0 ? "K" : `G${g}`);

export function NewNotePanel({ students }: { students: Student[] }) {
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [draft, setDraft] = useState("");
  const [aiDrafted, setAiDrafted] = useState(false);
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function reset() {
    setSelectedId("");
    setDraft("");
    setAiDrafted(false);
    setError(null);
    setSaved(false);
  }

  function handleGenerate() {
    if (!selectedId) return;
    setError(null);
    setAiDrafted(false);
    startGenerating(async () => {
      const result = await generateProgressDraft(Number(selectedId));
      if ("error" in result && result.error) {
        setError(result.error);
      } else if (result.draft) {
        setDraft(result.draft);
        setAiDrafted(true);
      }
    });
  }

  function handleSave() {
    if (!selectedId || !draft.trim()) return;
    setError(null);
    startSaving(async () => {
      const result = await saveProgressNote(Number(selectedId), draft, aiDrafted);
      if (result.success) {
        setSaved(true);
        setTimeout(reset, 1500);
      } else {
        setError(result.error ?? "Failed to save.");
      }
    });
  }

  const selectedStudent = students.find((s) => s.id === Number(selectedId));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-500" />
        <h2 className="text-base font-semibold text-gray-900">New Progress Note</h2>
      </div>

      {/* Student selector */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Select student
          </label>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value === "" ? "" : Number(e.target.value));
              setDraft("");
              setAiDrafted(false);
              setError(null);
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            <option value="">— Choose a student —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({gradeLabel(s.grade)})
              </option>
            ))}
          </select>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={!selectedId || isGenerating}
          variant="outline"
          className="shrink-0"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Drafting…</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2 text-blue-500" />AI Draft</>
          )}
        </Button>
      </div>

      {/* Note editor */}
      {(draft || selectedId) && (
        <div className="space-y-3">
          {aiDrafted && (
            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-md px-3 py-2">
              <Sparkles className="w-3.5 h-3.5" />
              AI-drafted from {selectedStudent?.firstName}&apos;s recent engagement logs. Review and edit before saving.
            </div>
          )}
          <textarea
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setAiDrafted(false); }}
            rows={8}
            placeholder="Write or paste a progress note…"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
          )}

          {saved && (
            <p className="text-sm text-green-600 bg-green-50 rounded-md px-3 py-2">
              Note saved successfully!
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset} disabled={isSaving}>
              <X className="w-4 h-4 mr-1.5" />Clear
            </Button>
            <Button onClick={handleSave} disabled={!draft.trim() || !selectedId || isSaving}>
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Saving…</>
              ) : (
                <><Save className="w-4 h-4 mr-1.5" />Save Note</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
