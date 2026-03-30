import { requireRole } from "@/lib/auth/session";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { MobileHeader } from "@/components/shared/mobile-header";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Mail,
  Shield,
} from "lucide-react";

const teacherNavItems = [
  {
    label: "Dashboard",
    href: "/teacher/dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "Students",
    href: "/teacher/students",
    icon: <Users className="w-4 h-4" />,
  },
  {
    label: "Orders",
    href: "/teacher/orders",
    icon: <ClipboardList className="w-4 h-4" />,
  },
  {
    label: "Progress Notes",
    href: "/teacher/progress",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    label: "Newsletters",
    href: "/teacher/newsletters",
    icon: <Mail className="w-4 h-4" />,
  },
  {
    label: "Compliance",
    href: "/teacher/compliance",
    icon: <Shield className="w-4 h-4" />,
  },
];

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("teacher");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarNav
        items={teacherNavItems}
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
