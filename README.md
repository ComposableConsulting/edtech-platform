# edtech-platform
Charter school AI powered solution
# edtech-platform

## Project Overview
AI-powered independent study charter school management platform.
Codename: edtech-platform (working title, name TBD).
Goal: Replace OPSLR with a modern AI-coach-powered alternative targeting
California independent study charter schools.
Long-term: Acquire or license to a CMO, edtech company, or OPSLR itself.

## The Problem We Solve
Parents at IS charter schools (like Taylion) manage their child's entire
education through a purchasing portal (OPSLR) that is 20+ years old with
zero AI. They have annual student budgets ($1,500-$2,500) to spend on
curriculum, tutoring, classes, and supplies with no guidance on what to buy.
Teachers spend most of their week answering basic parent questions manually.

## Our Solution
- OPSLR replacement: budget management, vendor catalog, purchasing workflow
- AI Coach: parent-facing chat that answers curriculum and budget questions
- Teacher tools: AI-drafted progress notes, compliance reports, agendas
- Newsletter builder: AI-generated weekly updates pulled from live student data
- Compliance layer: ADA documentation, engagement tracking, contact logging

## User Roles
- Parent: views student budget, browses vendor catalog, submits purchase
  requests, chats with AI coach, receives newsletters
- Teacher: reviews/approves orders, manages student progress notes, sends
  newsletters and agendas, views compliance reports
- Admin: school-wide settings, vendor management, reporting, user management

## Tech Stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript throughout, strict mode
- Styling: Tailwind CSS + shadcn/ui components
- Auth: Firebase Auth (email/password + Google sign-in)
- Database: Neon PostgreSQL (serverless, free tier)
- ORM: Drizzle ORM (TypeScript-native, works great with Neon)
- AI: Anthropic Claude API (claude-sonnet-4-6)
- Email: Resend
- File storage: Firebase Storage
- Deployment: Vercel
- Version control: GitHub

## Why This Stack
- Firebase Auth: best-in-class auth, handles sessions, Google SSO built in
- Neon: serverless PostgreSQL, scales to zero, free tier generous,
  perfect for Next.js API routes, no connection pool management needed
- Drizzle ORM: TypeScript-first, migrations built in, excellent Neon support,
  schema defined in code
- Everything else is standard Next.js best practices

## Project Structure
```
is-platform/
  app/
    (auth)/               # Login, signup, forgot password
    (parent)/             # Parent portal
      dashboard/          # Budget overview, recent activity
      catalog/            # Browse vendor catalog
      purchases/          # Purchase requests and history
      coach/              # AI coach chat interface
    (teacher)/            # Teacher portal
      dashboard/          # School overview, pending approvals
      students/           # Student list and profiles
      orders/             # Purchase request approval queue
      progress/           # Progress notes
      newsletters/        # Newsletter and agenda builder
      compliance/         # ADA reports, engagement logs
    (admin)/              # Admin portal
      settings/           # School settings
      vendors/            # Vendor catalog management
      users/              # User management
    api/
      auth/               # Firebase auth webhook handlers
      purchases/          # Purchase request endpoints
      coach/              # AI coach streaming endpoint
      newsletters/        # Newsletter generation endpoint
      compliance/         # Compliance report endpoints
  components/
    ui/                   # shadcn/ui base components
    parent/               # Parent-specific components
    teacher/              # Teacher-specific components
    shared/               # Shared across roles
  lib/
    firebase/             # Firebase client and admin config
    db/                   # Neon + Drizzle setup
      schema.ts           # All table definitions
      index.ts            # DB client
    anthropic/            # Claude API helpers
    email/                # Resend email helpers
    utils/                # Shared utilities
  drizzle/
    migrations/           # Auto-generated migration files
  scripts/
    seed.ts               # Synthetic data seed script
  types/
    index.ts              # Shared TypeScript types
```

## Database Schema (Drizzle/PostgreSQL)

### schools
- id, name, county, charter_number, school_year, created_at

### users
- id (Firebase UID), email, display_name, role (parent/teacher/admin),
  school_id, created_at

### students
- id, first_name, last_name, grade, school_id, teacher_id,
  enrollment_date, is_active, created_at

### student_parents
- student_id, user_id (parent Firebase UID)

### student_budgets
- id, student_id, school_year, total_amount, spent_amount,
  remaining_amount (computed), notes, updated_at

### vendor_categories
- id, name, description, school_id

### vendor_catalog
- id, vendor_name, vendor_url, category_id, item_name, description,
  price, grade_levels (text array), is_active, school_id, created_at

### purchase_requests
- id, student_id, catalog_item_id, quantity, unit_price, total_price,
  status (pending/approved/denied/ordered/received),
  requested_by (parent user_id), teacher_notes, created_at, updated_at

### purchase_orders
- id, school_id, vendor_name, items (jsonb), total_amount,
  po_number, status, created_by, created_at

### student_progress_notes
- id, student_id, teacher_id, note_date, content,
  ai_drafted (boolean), approved_by, created_at

### engagement_logs
- id, student_id, log_date, activity_type, duration_minutes,
  description, logged_by, created_at

### newsletters
- id, school_id, teacher_id, title, subject_line,
  content_json (jsonb), html_content, status (draft/sent),
  recipient_type (all/individual), sent_at, created_at

### ai_coach_conversations
- id, parent_id, student_id, messages (jsonb array), created_at

### contact_logs
- id, student_id, teacher_id, contact_date, contact_type
  (email/phone/in-person/newsletter), notes, created_at

## Key Principles
- Mobile-first: parents primarily use phones
- COPPA/FERPA compliant: never send student names or PII to AI API,
  use student_id references only, anonymize all AI prompts
- AI drafts, human approves: AI generates content, teacher always
  reviews before anything is sent or saved as final
- Every parent-teacher interaction logged: California IS compliance
- Multi-tenant from day one: all DB queries scoped to school_id,
  even though we start with one school
- Row-level security mindset: users only see their own school's data

## Current Build Phase
Phase 1: Synthetic data environment
- No real students yet
- Building and validating all features with seeded fake data
- Target: demo-ready in 10-12 weeks
- One school, one teacher, 25 synthetic students + parents

## Synthetic Data Targets (seed script)
- 1 school: "Coastal Connections Academy" (fictional, San Clemente CA)
- 1 teacher user: teacher@coastalconnections.edu
- 1 admin user: admin@coastalconnections.edu
- 25 students: realistic mix of grades K-12, varied progress levels
- 25 parent accounts: one per student, realistic names and emails
- 10 vendor categories: Math, Language Arts, Science, History,
  Electives, PE & Sports, Art & Music, Tutoring, Online Courses,
  Enrichment Activities
- 50 vendor catalog items spread across categories with realistic
  prices ($15-$500), grade level targeting, and descriptions
- Student budgets: $2,000 each, varied spend ($0 to nearly full)
- 3 months of engagement logs per student (realistic patterns,
  some students more active than others)
- 10 sample progress notes (mix of AI-drafted and manual)
- 2 sample newsletters (one sent, one draft)
- Sample purchase requests in various statuses

## Vendor Examples for Seed Data
- Math: Saxon Math, Teaching Textbooks, Khan Academy Plus, Prodigy
- Language Arts: All About Reading, IEW Writing, Spelling You See
- Science: Apologia, Mystery Science, Generation Genius
- History: Story of the World, Drive Thru History
- Tutoring: Wyzant session, local tutor hourly
- Online Courses: Outschool class, Coursera, CTY Johns Hopkins
- Enrichment: Art class, music lessons, coding camp, sports league

## Environment Variables Required
```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Neon PostgreSQL
DATABASE_URL=

# Anthropic
ANTHROPIC_API_KEY=

# Resend
RESEND_API_KEY=
```

## Naming Conventions
- Database tables: snake_case
- TypeScript: camelCase variables, PascalCase types/interfaces
- Components: PascalCase filenames
- API routes: kebab-case

## NPM Scripts
- npm run dev: start local development server
- npm run build: production build
- npm run seed: run synthetic data seed script
- npm run db:generate: generate Drizzle migrations from schema changes
- npm run db:migrate: run pending migrations
- npm run db:studio: open Drizzle Studio to browse database

## Do Not
- Never use real student names, SSNs, or actual school data
- Never send student names or identifying info to the AI API
- Never skip TypeScript types, strict mode throughout
- Never hardcode API keys, use environment variables always
- Never query without school_id scope in multi-tenant contexts
- Never let AI output go directly to users without teacher review
