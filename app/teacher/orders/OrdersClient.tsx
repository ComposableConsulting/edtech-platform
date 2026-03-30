"use client";

import { useState, useMemo, useTransition } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { updatePurchaseStatus } from "./actions";

type Request = {
  id: number;
  studentName: string;
  grade: number;
  itemName: string;
  vendorName: string;
  quantity: number;
  totalPrice: string;
  status: string;
  teacherNotes: string | null;
  createdAt: Date;
};

const STATUS_FILTERS = ["all", "pending", "approved", "denied", "ordered", "received"] as const;

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700",
  ordered: "bg-blue-100 text-blue-700",
  received: "bg-gray-100 text-gray-700",
};

const fmt = (v: string | number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v));

const gradeLabel = (g: number) => (g === 0 ? "K" : `G${g}`);

export function OrdersClient({ requests }: { requests: Request[] }) {
  const [filter, setFilter] = useState<string>("pending");
  const [dialog, setDialog] = useState<Request | null>(null);
  const [dialogAction, setDialogAction] = useState<"approved" | "denied">("approved");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter]
  );

  const counts = STATUS_FILTERS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "all" ? requests.length : requests.filter((r) => r.status === s).length;
    return acc;
  }, {});

  function openDialog(req: Request, action: "approved" | "denied") {
    setDialog(req);
    setDialogAction(action);
    setNotes("");
    setError(null);
  }

  function closeDialog() {
    setDialog(null);
    setError(null);
  }

  function handleConfirm() {
    if (!dialog) return;
    startTransition(async () => {
      const result = await updatePurchaseStatus(dialog.id, dialogAction, notes);
      if (result.success) {
        closeDialog();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
              filter === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
            {counts[s] > 0 && (
              <span className={`ml-1.5 text-xs ${filter === s ? "text-blue-100" : "text-gray-400"}`}>
                {counts[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          No {filter === "all" ? "" : filter} requests.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Vendor</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Qty</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Date</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map((req) => (
                  <>
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{req.studentName}</p>
                        <p className="text-xs text-gray-400">{gradeLabel(req.grade)}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{req.itemName}</td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{req.vendorName}</td>
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{req.quantity}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">{fmt(req.totalPrice)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusStyles[req.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 hidden lg:table-cell">
                        {new Date(req.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3">
                        {req.status === "pending" ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => openDialog(req, "approved")}
                              className="px-2.5 py-1 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openDialog(req, "denied")}
                              className="px-2.5 py-1 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            >
                              Deny
                            </button>
                          </div>
                        ) : req.status === "approved" ? (
                          <button
                            onClick={() => openDialog(req, "ordered"  as "approved")}
                            className="px-2.5 py-1 text-xs font-medium border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                          >
                            Mark Ordered
                          </button>
                        ) : req.status === "ordered" ? (
                          <button
                            onClick={() => openDialog(req, "received" as "approved")}
                            className="px-2.5 py-1 text-xs font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            Mark Received
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                    {req.teacherNotes && (
                      <tr key={`${req.id}-note`} className="bg-gray-50">
                        <td colSpan={8} className="px-5 py-2">
                          <p className="text-xs text-gray-500">
                            <span className="font-medium text-gray-600">Note: </span>
                            {req.teacherNotes}
                          </p>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={!!dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {dialogAction === "approved" ? "Approve" :
               dialogAction === "denied" ? "Deny" :
               dialogAction === "ordered" ? "Mark as Ordered" : "Mark as Received"} Request
            </DialogTitle>
          </DialogHeader>

          {dialog && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
                <p className="font-semibold text-gray-900">{dialog.itemName}</p>
                <p className="text-gray-500">{dialog.studentName} &middot; {fmt(dialog.totalPrice)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {dialogAction === "denied" ? "Reason for denial" : "Note"}{" "}
                  {dialogAction !== "denied" && <span className="text-gray-400 font-normal">(optional)</span>}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={
                    dialogAction === "denied"
                      ? "Explain why this request is being denied…"
                      : "Add a note for the parent…"
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleConfirm}
              disabled={isPending || (dialogAction === "denied" && !notes.trim())}
              className={
                dialogAction === "denied"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : ""
              }
            >
              {isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
