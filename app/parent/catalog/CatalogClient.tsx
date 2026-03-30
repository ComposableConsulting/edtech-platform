"use client";

import { useState, useMemo, useTransition } from "react";
import { Search, ShoppingCart, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { submitPurchaseRequest } from "./actions";

type Category = {
  id: number;
  name: string;
};

type CatalogItem = {
  id: number;
  itemName: string;
  vendorName: string;
  vendorUrl: string | null;
  description: string | null;
  price: string;
  gradeLevels: string[] | null;
  categoryId: number;
  categoryName: string;
};

interface Props {
  items: CatalogItem[];
  categories: Category[];
  remaining: number;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount
  );

export function CatalogClient({ items, categories, remaining }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let result = items;
    if (activeCategoryId !== null) {
      result = result.filter((i) => i.categoryId === activeCategoryId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.itemName.toLowerCase().includes(q) ||
          i.vendorName.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, activeCategoryId, search]);

  function openRequest(item: CatalogItem) {
    setSelectedItem(item);
    setQuantity(1);
    setError(null);
    setSuccess(false);
  }

  function closeDialog() {
    setSelectedItem(null);
    setError(null);
    setSuccess(false);
  }

  function handleSubmit() {
    if (!selectedItem) return;
    setError(null);
    startTransition(async () => {
      const result = await submitPurchaseRequest(selectedItem.id, quantity);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  const totalCost = selectedItem ? Number(selectedItem.price) * quantity : 0;
  const overBudget = totalCost > remaining;

  return (
    <>
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search items or vendors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategoryId(null)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            activeCategoryId === null
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setActiveCategoryId(cat.id === activeCategoryId ? null : cat.id)
            }
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeCategoryId === cat.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Item count */}
      <p className="text-sm text-gray-400">
        {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        {activeCategoryId || search ? " matching filters" : ""}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          No items found. Try adjusting your search or filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 leading-tight">
                    {item.itemName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    {item.vendorName}
                    {item.vendorUrl && (
                      <a
                        href={item.vendorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </p>
                </div>
                <span className="text-base font-bold text-gray-900 shrink-0">
                  {fmt(Number(item.price))}
                </span>
              </div>

              {item.description && (
                <p className="text-sm text-gray-500 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5 mt-auto">
                <Badge variant="secondary" className="text-xs">
                  {item.categoryName}
                </Badge>
                {item.gradeLevels?.map((g) => (
                  <Badge key={g} variant="outline" className="text-xs">
                    {g}
                  </Badge>
                ))}
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={() => openRequest(item)}
                disabled={Number(item.price) > remaining}
              >
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                {Number(item.price) > remaining ? "Over budget" : "Request"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Request dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Item</DialogTitle>
          </DialogHeader>

          {selectedItem && !success && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                <p className="font-semibold text-gray-900">{selectedItem.itemName}</p>
                <p className="text-sm text-gray-500">{selectedItem.vendorName}</p>
                <p className="text-sm font-medium text-gray-700">
                  {fmt(Number(selectedItem.price))} each
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 w-20 shrink-0">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <button
                    className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button
                    className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    disabled={quantity >= 10}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                <span className="text-gray-500">Total cost</span>
                <span className={`font-semibold ${overBudget ? "text-red-600" : "text-gray-900"}`}>
                  {fmt(totalCost)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Budget remaining</span>
                <span className="font-medium text-green-600">{fmt(remaining)}</span>
              </div>

              {overBudget && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                  This request exceeds your remaining budget.
                </p>
              )}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
            </div>
          )}

          {success && (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-semibold text-gray-900">Request submitted!</p>
              <p className="text-sm text-gray-500">
                Your teacher will review it shortly.
              </p>
            </div>
          )}

          <DialogFooter>
            {!success ? (
              <>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isPending}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || overBudget}
                >
                  {isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  Submit Request
                </Button>
              </>
            ) : (
              <Button onClick={closeDialog} className="w-full">
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
