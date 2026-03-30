"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ChevronRight, Check, ArrowLeft, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePocDraft, savePocNote, type NoteInputs } from "./actions";

type Step = "input" | "review" | "done";

const SUBJECTS = [
  "Math", "Language Arts", "Science", "History",
  "Electives", "PE & Sports", "Art & Music", "Foreign Language",
];

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { id: "input", label: "Enter Notes" },
    { id: "review", label: "Review Draft" },
    { id: "done", label: "Approved" },
  ];
  const current = steps.findIndex((s) => s.id === step);

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
              i < current
                ? "bg-blue-600 text-white"
                : i === current
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-400"
            }`}>
              {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${
              i === current ? "font-medium text-gray-900" : "text-gray-400"
            }`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-300 mx-3" />
          )}
        </div>
      ))}
    </div>
  );
}

export function NoteClient({
  studentId,
  studentName,
  gradeLabel,
}: {
  studentId: number;
  studentName: string;
  gradeLabel: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [inputs, setInputs] = useState<NoteInputs>({
    subject: "",
    engagementSummary: "",
    parentContact: "",
    nextSteps: "",
  });
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();

  function handleGenerate() {
    if (!inputs.subject || !inputs.engagementSummary || !inputs.nextSteps) return;
    setError(null);
    startGenerating(async () => {
      const result = await generatePocDraft(studentId, inputs);
      if ("error" in result && result.error) {
        setError(result.error);
      } else if (result.draft) {
        setDraft(result.draft);
        setStep("review");
      }
    });
  }

  function handleSave() {
    setError(null);
    startSaving(async () => {
      const result = await savePocNote(studentId, draft);
      if (result.success) {
        setStep("done");
      } else {
        setError(result.error ?? "Failed to save.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/poc/dashboard")}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to roster
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{studentName}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{gradeLabel} &middot; Progress Note</p>
        </div>
        <StepIndicator step={step} />
      </div>

      {/* Step 1: Input */}
      {step === "input" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Your rough notes</h2>
            <p className="text-sm text-gray-500">
              Fill in what you know. AI will turn this into a polished progress note.
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary subject this period <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInputs((i) => ({ ...i, subject: s }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    inputs.subject === s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Engagement summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Engagement summary <span className="text-red-500">*</span>
            </label>
            <textarea
              value={inputs.engagementSummary}
              onChange={(e) => setInputs((i) => ({ ...i, engagementSummary: e.target.value }))}
              rows={3}
              placeholder="e.g. Completed all assigned lessons, showed strong effort in writing. Struggled a bit with fractions but improving."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none leading-relaxed"
            />
          </div>

          {/* Parent contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Parent contact <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={inputs.parentContact}
              onChange={(e) => setInputs((i) => ({ ...i, parentContact: e.target.value }))}
              placeholder="e.g. Phone call on 3/15 — discussed math progress"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Next steps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Next steps <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={inputs.nextSteps}
              onChange={(e) => setInputs((i) => ({ ...i, nextSteps: e.target.value }))}
              placeholder="e.g. Continue Saxon Math, add tutoring for fractions"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="pt-1">
            <Button
              onClick={handleGenerate}
              disabled={
                !inputs.subject ||
                !inputs.engagementSummary.trim() ||
                !inputs.nextSteps.trim() ||
                isGenerating
              }
              className="w-full sm:w-auto"
              size="lg"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating draft…</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate with AI</>
              )}
            </Button>
            {isGenerating && (
              <p className="text-xs text-gray-400 mt-2">
                Usually takes 3–5 seconds…
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === "review" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3 text-sm text-blue-800">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            <span>
              AI-generated draft below. Review, edit as needed, then approve to save as the official record.
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Draft Progress Note</h2>
              <span className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />AI drafted
              </span>
            </div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none text-gray-800"
            />

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Edit3 className="w-3.5 h-3.5" />
              Make any edits above before approving
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
                disabled={isSaving}
              >
                ← Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={!draft.trim() || isSaving}
                size="lg"
                className="flex-1 sm:flex-none"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" />Approve &amp; Save</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === "done" && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Check className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-900">Progress note saved</p>
            <p className="text-sm text-gray-500 mt-1">
              The note has been approved and added to {studentName}&apos;s record.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setStep("input");
                setInputs({ subject: "", engagementSummary: "", parentContact: "", nextSteps: "" });
                setDraft("");
              }}
            >
              Write Another Note
            </Button>
            <Button onClick={() => router.push("/poc/dashboard")}>
              Back to Roster
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
