import { requireRole } from "@/lib/auth/session";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { MobileHeader } from "@/components/shared/mobile-header";
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  MessageSquare,
} from "lucide-react";

export const runtime = "edge";

const parentNavItems = [
  {
    label: "Dashboard",
    href: "/parent/dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "Catalog",
    href: "/parent/catalog",
    icon: <ShoppingBag className="w-4 h-4" />,
  },
  {
    label: "Purchases",
    href: "/parent/purchases",
    icon: <Receipt className="w-4 h-4" />,
  },
  {
    label: "AI Coach",
    href: "/parent/coach",
    icon: <MessageSquare className="w-4 h-4" />,
  },
];

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("parent");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarNav
        items={parentNavItems}
        user={{
          displayName: user.displayName,
          email: user.email,
          role: user.role,
        }}
      />
      <MobileHeader />
      <main className="flex-1 ml-60 p-6">{children}</main>
    </div>
  );
}
