"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

type Purchase = {
  id: number;
  itemName: string;
  vendorName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  status: string;
  teacherNotes: string | null;
  createdAt: Date;
};

const STATUS_LABELS = ["all", "pending", "approved", "denied", "ordered", "received"] as const;

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700",
  ordered: "bg-blue-100 text-blue-700",
  received: "bg-gray-100 text-gray-700",
};

const fmt = (v: string | number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v));

export function PurchasesClient({ purchases }: { purchases: Purchase[] }) {
  const [filter, setFilter] = useState<string>("all");

  const visible = filter === "all" ? purchases : purchases.filter((p) => p.status === filter);

  const counts = STATUS_LABELS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "all" ? purchases.length : purchases.filter((p) => p.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_LABELS.map((s) => (
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
          No {filter === "all" ? "" : filter} requests found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Vendor</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Qty</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map((p) => (
                  <>
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{p.itemName}</td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{p.vendorName}</td>
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{p.quantity}</td>
                      <td className="px-5 py-3 text-gray-700 font-medium">{fmt(p.totalPrice)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                            statusStyles[p.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 hidden lg:table-cell">
                        {new Date(p.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                    {p.teacherNotes && (
                      <tr key={`${p.id}-note`} className="bg-gray-50">
                        <td colSpan={6} className="px-5 py-2">
                          <p className="text-xs text-gray-500">
                            <span className="font-medium text-gray-600">Teacher note: </span>
                            {p.teacherNotes}
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
    </div>
  );
}
