import { relations } from "drizzle-orm";
import {
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
} from "./schema";

export const schoolsRelations = relations(schools, ({ many }) => ({
  users: many(users),
  students: many(students),
  vendorCategories: many(vendorCategories),
  vendorCatalog: many(vendorCatalog),
  purchaseOrders: many(purchaseOrders),
  newsletters: many(newsletters),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
  taughtStudents: many(students, { relationName: "teacherStudents" }),
  studentParents: many(studentParents),
  requestedPurchases: many(purchaseRequests, {
    relationName: "purchaseRequester",
  }),
  createdPurchaseOrders: many(purchaseOrders, {
    relationName: "purchaseOrderCreator",
  }),
  progressNotes: many(studentProgressNotes, {
    relationName: "teacherProgressNotes",
  }),
  approvedProgressNotes: many(studentProgressNotes, {
    relationName: "progressNoteApprover",
  }),
  engagementLogs: many(engagementLogs),
  newsletters: many(newsletters),
  aiCoachConversations: many(aiCoachConversations),
  contactLogs: many(contactLogs),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  teacher: one(users, {
    fields: [students.teacherId],
    references: [users.id],
    relationName: "teacherStudents",
  }),
  studentParents: many(studentParents),
  budgets: many(studentBudgets),
  purchaseRequests: many(purchaseRequests),
  progressNotes: many(studentProgressNotes),
  engagementLogs: many(engagementLogs),
  aiCoachConversations: many(aiCoachConversations),
  contactLogs: many(contactLogs),
}));

export const studentParentsRelations = relations(studentParents, ({ one }) => ({
  student: one(students, {
    fields: [studentParents.studentId],
    references: [students.id],
  }),
  user: one(users, {
    fields: [studentParents.userId],
    references: [users.id],
  }),
}));

export const studentBudgetsRelations = relations(
  studentBudgets,
  ({ one }) => ({
    student: one(students, {
      fields: [studentBudgets.studentId],
      references: [students.id],
    }),
  })
);

export const vendorCategoriesRelations = relations(
  vendorCategories,
  ({ one, many }) => ({
    school: one(schools, {
      fields: [vendorCategories.schoolId],
      references: [schools.id],
    }),
    vendorItems: many(vendorCatalog),
  })
);

export const vendorCatalogRelations = relations(
  vendorCatalog,
  ({ one, many }) => ({
    category: one(vendorCategories, {
      fields: [vendorCatalog.categoryId],
      references: [vendorCategories.id],
    }),
    school: one(schools, {
      fields: [vendorCatalog.schoolId],
      references: [schools.id],
    }),
    purchaseRequests: many(purchaseRequests),
  })
);

export const purchaseRequestsRelations = relations(
  purchaseRequests,
  ({ one }) => ({
    student: one(students, {
      fields: [purchaseRequests.studentId],
      references: [students.id],
    }),
    catalogItem: one(vendorCatalog, {
      fields: [purchaseRequests.catalogItemId],
      references: [vendorCatalog.id],
    }),
    requestedBy: one(users, {
      fields: [purchaseRequests.requestedBy],
      references: [users.id],
      relationName: "purchaseRequester",
    }),
  })
);

export const purchaseOrdersRelations = relations(
  purchaseOrders,
  ({ one }) => ({
    school: one(schools, {
      fields: [purchaseOrders.schoolId],
      references: [schools.id],
    }),
    createdBy: one(users, {
      fields: [purchaseOrders.createdBy],
      references: [users.id],
      relationName: "purchaseOrderCreator",
    }),
  })
);

export const studentProgressNotesRelations = relations(
  studentProgressNotes,
  ({ one }) => ({
    student: one(students, {
      fields: [studentProgressNotes.studentId],
      references: [students.id],
    }),
    teacher: one(users, {
      fields: [studentProgressNotes.teacherId],
      references: [users.id],
      relationName: "teacherProgressNotes",
    }),
    approvedBy: one(users, {
      fields: [studentProgressNotes.approvedBy],
      references: [users.id],
      relationName: "progressNoteApprover",
    }),
  })
);

export const engagementLogsRelations = relations(
  engagementLogs,
  ({ one }) => ({
    student: one(students, {
      fields: [engagementLogs.studentId],
      references: [students.id],
    }),
    loggedBy: one(users, {
      fields: [engagementLogs.loggedBy],
      references: [users.id],
    }),
  })
);

export const newslettersRelations = relations(newsletters, ({ one }) => ({
  school: one(schools, {
    fields: [newsletters.schoolId],
    references: [schools.id],
  }),
  teacher: one(users, {
    fields: [newsletters.teacherId],
    references: [users.id],
  }),
}));

export const aiCoachConversationsRelations = relations(
  aiCoachConversations,
  ({ one }) => ({
    parent: one(users, {
      fields: [aiCoachConversations.parentId],
      references: [users.id],
    }),
    student: one(students, {
      fields: [aiCoachConversations.studentId],
      references: [students.id],
    }),
  })
);

export const contactLogsRelations = relations(contactLogs, ({ one }) => ({
  student: one(students, {
    fields: [contactLogs.studentId],
    references: [students.id],
  }),
  teacher: one(users, {
    fields: [contactLogs.teacherId],
    references: [users.id],
  }),
}));
