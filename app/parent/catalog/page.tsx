import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  studentParents,
  students,
  studentBudgets,
  vendorCatalog,
  vendorCategories,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CatalogClient } from "./CatalogClient";

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount
  );

export default async function CatalogPage() {
  const user = await requireRole("parent");

  // Linked student → school
  const parentRows = await db
    .select({
      studentId: studentParents.studentId,
      schoolId: students.schoolId,
    })
    .from(studentParents)
    .innerJoin(students, eq(studentParents.studentId, students.id))
    .where(eq(studentParents.userId, user.id))
    .limit(1);

  const row = parentRows[0] ?? null;

  if (!row) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl border border-gray-200 p-10 max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No student linked
          </h2>
          <p className="text-gray-500 text-sm">
            Contact your school administrator to link your account to a student.
          </p>
        </div>
      </div>
    );
  }

  const { studentId, schoolId } = row;

  // Budget remaining
  const budgetRows = await db
    .select({
      totalAmount: studentBudgets.totalAmount,
      spentAmount: studentBudgets.spentAmount,
    })
    .from(studentBudgets)
    .where(
      and(
        eq(studentBudgets.studentId, studentId),
        eq(studentBudgets.schoolYear, "2024-2025")
      )
    )
    .limit(1);

  const budget = budgetRows[0] ?? { totalAmount: "0", spentAmount: "0" };
  const remaining =
    Number(budget.totalAmount) - Number(budget.spentAmount);

  // Catalog items for this school (active only)
  const items = await db
    .select({
      id: vendorCatalog.id,
      itemName: vendorCatalog.itemName,
      vendorName: vendorCatalog.vendorName,
      vendorUrl: vendorCatalog.vendorUrl,
      description: vendorCatalog.description,
      price: vendorCatalog.price,
      gradeLevels: vendorCatalog.gradeLevels,
      categoryId: vendorCatalog.categoryId,
      categoryName: vendorCategories.name,
    })
    .from(vendorCatalog)
    .innerJoin(
      vendorCategories,
      eq(vendorCatalog.categoryId, vendorCategories.id)
    )
    .where(
      and(
        eq(vendorCatalog.schoolId, schoolId),
        eq(vendorCatalog.isActive, true)
      )
    )
    .orderBy(vendorCategories.name, vendorCatalog.itemName);

  // Unique categories present in catalog
  const seenIds = new Set<number>();
  const categories = items
    .filter((i) => {
      if (seenIds.has(i.categoryId)) return false;
      seenIds.add(i.categoryId);
      return true;
    })
    .map((i) => ({ id: i.categoryId, name: i.categoryName }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse approved items and submit purchase requests.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Budget remaining
          </p>
          <p className="text-2xl font-bold text-green-600">{fmt(remaining)}</p>
        </div>
      </div>

      <CatalogClient
        items={items.map((i) => ({ ...i, price: String(i.price) }))}
        categories={categories}
        remaining={remaining}
      />
    </div>
  );
}
