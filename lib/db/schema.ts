import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "parent",
  "teacher",
  "admin",
]);

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "pending",
  "approved",
  "denied",
  "ordered",
  "received",
]);

export const newsletterStatusEnum = pgEnum("newsletter_status", [
  "draft",
  "sent",
]);

export const recipientTypeEnum = pgEnum("recipient_type", [
  "all",
  "individual",
]);

export const contactTypeEnum = pgEnum("contact_type", [
  "email",
  "phone",
  "in-person",
  "newsletter",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  county: text("county").notNull(),
  charterNumber: text("charter_number").notNull(),
  schoolYear: text("school_year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Firebase UID
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: userRoleEnum("role").notNull(),
  schoolId: integer("school_id").references(() => schools.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  grade: integer("grade").notNull(), // 0 = Kindergarten, 1-12
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => users.id),
  enrollmentDate: date("enrollment_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentParents = pgTable(
  "student_parents",
  {
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.studentId, table.userId] }),
  })
);

export const studentBudgets = pgTable("student_budgets", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  schoolYear: text("school_year").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  spentAmount: numeric("spent_amount", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vendorCategories = pgTable("vendor_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
});

export const vendorCatalog = pgTable("vendor_catalog", {
  id: serial("id").primaryKey(),
  vendorName: text("vendor_name").notNull(),
  vendorUrl: text("vendor_url"),
  categoryId: integer("category_id")
    .notNull()
    .references(() => vendorCategories.id),
  itemName: text("item_name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  gradeLevels: text("grade_levels").array(),
  isActive: boolean("is_active").default(true).notNull(),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseRequests = pgTable("purchase_requests", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  catalogItemId: integer("catalog_item_id")
    .notNull()
    .references(() => vendorCatalog.id),
  quantity: integer("quantity").default(1).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  status: purchaseStatusEnum("status").default("pending").notNull(),
  requestedBy: text("requested_by")
    .notNull()
    .references(() => users.id),
  teacherNotes: text("teacher_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  vendorName: text("vendor_name").notNull(),
  items: jsonb("items").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  poNumber: text("po_number"),
  status: text("status").notNull().default("draft"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentProgressNotes = pgTable("student_progress_notes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => users.id),
  noteDate: date("note_date").notNull(),
  content: text("content").notNull(),
  aiDrafted: boolean("ai_drafted").default(false).notNull(),
  approvedBy: text("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const engagementLogs = pgTable("engagement_logs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  logDate: date("log_date").notNull(),
  activityType: text("activity_type").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  description: text("description"),
  loggedBy: text("logged_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  subjectLine: text("subject_line").notNull(),
  contentJson: jsonb("content_json"),
  htmlContent: text("html_content"),
  status: newsletterStatusEnum("status").default("draft").notNull(),
  recipientType: recipientTypeEnum("recipient_type").default("all").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiCoachConversations = pgTable("ai_coach_conversations", {
  id: serial("id").primaryKey(),
  parentId: text("parent_id")
    .notNull()
    .references(() => users.id),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  messages: jsonb("messages").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contactLogs = pgTable("contact_logs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => users.id),
  contactDate: date("contact_date").notNull(),
  contactType: contactTypeEnum("contact_type").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
