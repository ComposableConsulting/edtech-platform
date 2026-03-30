import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  schools,
  users,
  students,
  studentParents,
  studentBudgets,
  vendorCategories,
  vendorCatalog,
  purchaseRequests,
  purchaseOrders,
  studentProgressNotes,
  engagementLogs,
  newsletters,
  aiCoachConversations,
  contactLogs,
} from "@/lib/db/schema";

// ─── Base Select Types ────────────────────────────────────────────────────────

export type School = InferSelectModel<typeof schools>;
export type User = InferSelectModel<typeof users>;
export type Student = InferSelectModel<typeof students>;
export type StudentParent = InferSelectModel<typeof studentParents>;
export type StudentBudget = InferSelectModel<typeof studentBudgets>;
export type VendorCategory = InferSelectModel<typeof vendorCategories>;
export type VendorCatalogItem = InferSelectModel<typeof vendorCatalog>;
export type PurchaseRequest = InferSelectModel<typeof purchaseRequests>;
export type PurchaseOrder = InferSelectModel<typeof purchaseOrders>;
export type StudentProgressNote = InferSelectModel<typeof studentProgressNotes>;
export type EngagementLog = InferSelectModel<typeof engagementLogs>;
export type Newsletter = InferSelectModel<typeof newsletters>;
export type AiCoachConversation = InferSelectModel<typeof aiCoachConversations>;
export type ContactLog = InferSelectModel<typeof contactLogs>;

// ─── Base Insert Types ────────────────────────────────────────────────────────

export type NewSchool = InferInsertModel<typeof schools>;
export type NewUser = InferInsertModel<typeof users>;
export type NewStudent = InferInsertModel<typeof students>;
export type NewStudentParent = InferInsertModel<typeof studentParents>;
export type NewStudentBudget = InferInsertModel<typeof studentBudgets>;
export type NewVendorCategory = InferInsertModel<typeof vendorCategories>;
export type NewVendorCatalogItem = InferInsertModel<typeof vendorCatalog>;
export type NewPurchaseRequest = InferInsertModel<typeof purchaseRequests>;
export type NewPurchaseOrder = InferInsertModel<typeof purchaseOrders>;
export type NewStudentProgressNote = InferInsertModel<
  typeof studentProgressNotes
>;
export type NewEngagementLog = InferInsertModel<typeof engagementLogs>;
export type NewNewsletter = InferInsertModel<typeof newsletters>;
export type NewAiCoachConversation = InferInsertModel<
  typeof aiCoachConversations
>;
export type NewContactLog = InferInsertModel<typeof contactLogs>;

// ─── Enum Types ───────────────────────────────────────────────────────────────

export type UserRole = "parent" | "teacher" | "admin";
export type PurchaseStatus =
  | "pending"
  | "approved"
  | "denied"
  | "ordered"
  | "received";
export type NewsletterStatus = "draft" | "sent";
export type RecipientType = "all" | "individual";
export type ContactType = "email" | "phone" | "in-person" | "newsletter";

// ─── Composite / Joined Types ─────────────────────────────────────────────────

export type StudentWithBudget = Student & {
  budget: StudentBudget | null;
};

export type StudentWithParents = Student & {
  parents: User[];
};

export type StudentWithTeacher = Student & {
  teacher: User;
};

export type StudentFull = Student & {
  teacher: User;
  parents: User[];
  budget: StudentBudget | null;
  school: School;
};

export type PurchaseRequestWithDetails = PurchaseRequest & {
  student: Student;
  catalogItem: VendorCatalogItem & {
    category: VendorCategory;
  };
  requestedByUser: User;
};

export type VendorCatalogItemWithCategory = VendorCatalogItem & {
  category: VendorCategory;
};

export type ProgressNoteWithStudent = StudentProgressNote & {
  student: Student;
  teacher: User;
};

export type EngagementLogWithStudent = EngagementLog & {
  student: Student;
};

export type NewsletterWithTeacher = Newsletter & {
  teacher: User;
  school: School;
};

export type ContactLogWithDetails = ContactLog & {
  student: Student;
  teacher: User;
};

// ─── Message types for AI coach ──────────────────────────────────────────────

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type AiCoachConversationWithMessages = Omit<
  AiCoachConversation,
  "messages"
> & {
  messages: AiMessage[];
  student: Student;
};

// ─── Purchase Order Item (for jsonb items field) ──────────────────────────────

export interface PurchaseOrderItem {
  catalogItemId: number;
  itemName: string;
  vendorName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  studentId: number;
  studentName: string;
}

// ─── Newsletter Content JSON ──────────────────────────────────────────────────

export interface NewsletterBlock {
  type: "heading" | "paragraph" | "list" | "divider";
  content?: string;
  items?: string[];
  level?: 1 | 2 | 3;
}

export type NewsletterContent = NewsletterBlock[];

// ─── Dashboard / Summary Types ────────────────────────────────────────────────

export interface SchoolStats {
  totalStudents: number;
  activeStudents: number;
  totalBudgetAllocated: number;
  totalBudgetSpent: number;
  pendingPurchaseRequests: number;
  recentEngagementLogs: number;
}

export interface StudentDashboardData {
  student: Student;
  budget: StudentBudget | null;
  recentProgressNotes: StudentProgressNote[];
  recentEngagementLogs: EngagementLog[];
  pendingPurchaseRequests: PurchaseRequest[];
}
