import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { purchaseRequests, students, vendorCatalog } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { OrdersClient } from "./OrdersClient";

export default async function OrdersPage() {
  const user = await requireRole("teacher");
  const schoolId = user.schoolId!;

  const requests = await db
    .select({
      id: purchaseRequests.id,
      studentName: students.firstName,
      studentLastName: students.lastName,
      grade: students.grade,
      itemName: vendorCatalog.itemName,
      vendorName: vendorCatalog.vendorName,
      quantity: purchaseRequests.quantity,
      totalPrice: purchaseRequests.totalPrice,
      status: purchaseRequests.status,
      teacherNotes: purchaseRequests.teacherNotes,
      createdAt: purchaseRequests.createdAt,
    })
    .from(purchaseRequests)
    .innerJoin(students, eq(purchaseRequests.studentId, students.id))
    .innerJoin(vendorCatalog, eq(purchaseRequests.catalogItemId, vendorCatalog.id))
    .where(eq(students.schoolId, schoolId))
    .orderBy(desc(purchaseRequests.createdAt));

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and approve purchase requests from families.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-800 font-medium">
            {pendingCount} pending review
          </div>
        )}
      </div>

      <OrdersClient
        requests={requests.map((r) => ({
          ...r,
          studentName: `${r.studentName} ${r.studentLastName}`,
          totalPrice: String(r.totalPrice),
          createdAt: r.createdAt ?? new Date(),
        }))}
      />
    </div>
  );
}
