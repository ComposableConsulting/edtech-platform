# edtech-platform

**AI Operating System for Independent Study Charter Schools**

---

## Overview

edtech-platform is a multi-tenant, AI-powered operating system for California independent study (IS) charter schools.

It replaces legacy systems like OPSLR by unifying:

- **Education fund orchestration** — budgets, purchasing, and audit
- **Parent decision intelligence** — AI-guided spend and curriculum recommendations
- **Teacher productivity** — automated compliance, progress notes, and communications
- **Compliance infrastructure** — ADA tracking, engagement logs, audit-ready reporting

**Strategic position:** The control layer between funding, instruction, and compliance.

---

## The Problem

Independent study charter schools operate on outdated infrastructure.

**Parents:**
- Receive $1,500–$2,500 annual student budgets with no guidance
- Must choose curriculum, tutoring, and enrichment independently
- Have no decision support or spend optimization

**Teachers:**
- Spend significant time answering repetitive parent questions
- Manually generate progress reports and compliance documentation

**Schools:**
- Rely on 20+ year-old systems (OPSLR)
- Face increasing compliance pressure with no modern tooling
- Lack visibility into how funds impact student outcomes

---

## Core Product Pillars

### 1. Education Fund Orchestration
System of record for all student spending.

- Student budget tracking ($1,500–$2,500/year typical)
- Vendor catalog with category structure
- Purchase request → approval → PO workflow
- Spend visibility at student, teacher, and school level

### 2. Parent Decision Engine (AI Coach)
AI-powered guidance for how parents allocate funds.

- Curriculum recommendations based on grade and progress
- Budget-aware suggestions from the vendor catalog
- Real-time Q&A via parent-facing chat (Claude API, streaming)
- Reduces teacher dependency on repetitive questions

**Future:**
- "Next best dollar" allocation logic
- Outcome-based recommendations
- Personalized learning pathway funding

### 3. Teacher Productivity Layer
Reduces administrative load so teachers can focus on instruction.

- AI-drafted progress notes (from engagement log data)
- Newsletter and agenda generation
- Purchase approval workflows
- Student performance summaries

### 4. Compliance & Audit Layer
Built for California IS requirements.

- ADA-compliant engagement tracking
- Parent-teacher contact logs
- Audit-ready reporting
- Every interaction logged by design

**This layer becomes the system of record — creating high switching costs.**

### 5. Vendor Marketplace (Emerging)
- Structured vendor catalog with category-based discovery
- Purchase routing through the platform

**Future:**
- Preferred vendor network
- Sponsored placements
- Vendor analytics and demand generation

---

## User Roles

| Role | Capabilities |
|---|---|
| **Parent** | View budget, browse catalog, submit requests, AI Coach, updates |
| **Teacher** | Approve purchases, progress notes, compliance, newsletters, student oversight |
| **Admin** | Vendor/catalog management, school config, reporting, user permissions |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode — no exceptions) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Firebase Auth (email/password + Google SSO) |
| Database | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Email | Resend |
| Storage | Cloudflare R2 |
| Deployment | Cloudflare Pages + Workers |
| Version Control | GitHub |

---

## Cloudflare vs. Vercel

**We are deploying on Cloudflare. Here's why.**

### Cloudflare advantages for this product

1. **Edge-first architecture** — Parents and teachers are mobile-heavy. Cloudflare's global edge delivers lower latency than centralized serverless.
2. **Cost efficiency at scale** — Workers pricing scales better for high-frequency API calls (AI streaming + engagement logging).
3. **Backend control** — Clean separation of frontend and API layer vs. Next.js-only model.
4. **Built-in primitives:**
   - KV — fast reads for session state
   - Durable Objects — real-time chat session management
   - R2 — cheap file storage (work samples, documents)

### Architecture

```
Frontend:  Next.js → Cloudflare Pages
API layer: Cloudflare Workers
Database:  Neon PostgreSQL (via Drizzle ORM)
Storage:   Cloudflare R2
```

### Tradeoffs (known)
- More complex initial setup than Vercel
- Requires stronger backend discipline
- Less "plug-and-play" for Next.js-specific features

---

## Project Structure

```
edtech-platform/
├── app/
│   ├── (auth)/           # Login, signup
│   ├── (parent)/         # Parent portal
│   ├── (teacher)/        # Teacher portal
│   ├── (admin)/          # Admin portal (future)
│   └── api/              # API routes
│       ├── auth/
│       └── coach/
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── shared/           # Sidebar, header
│   └── parent/teacher/   # Role-specific components
├── lib/
│   ├── db/               # Drizzle schema, client
│   ├── firebase/         # Auth (client + admin)
│   ├── ai/               # Claude helpers (future)
│   └── utils.ts
├── scripts/
│   └── seed.ts           # Synthetic data (1 school, 25 students)
├── drizzle/
│   └── migrations/
└── types/
    └── index.ts
```

---

## Database Schema

All tables are scoped by `school_id` for multi-tenant isolation.

| Table | Purpose |
|---|---|
| `schools` | School records |
| `users` | All users (parent, teacher, admin) |
| `students` | Student roster |
| `student_parents` | Parent ↔ student links |
| `student_budgets` | Annual budget per student |
| `vendor_categories` | Catalog categories |
| `vendor_catalog` | Approved vendor items |
| `purchase_requests` | Parent requests (pending → approved → ordered → received) |
| `purchase_orders` | Aggregated POs by vendor |
| `student_progress_notes` | Monthly notes (AI-drafted + teacher-approved) |
| `engagement_logs` | Daily activity tracking |
| `newsletters` | School newsletters |
| `ai_coach_conversations` | Coach session history |
| `contact_logs` | Parent-teacher contact records |

---

## Key Engineering Principles

- **Multi-tenant by default** — every query scoped by `school_id`
- **Strict TypeScript** — no `any`, no exceptions
- **No PII sent to AI** — student data anonymized before Claude API calls
- **AI generates → human approves** — no direct AI-to-parent publishing
- **Every interaction logged** — compliance by design, not afterthought
- **Mobile-first UX** — parent usage is predominantly mobile

---

## Core Workflows

**Purchase Flow**
```
Parent → Request → Teacher Review → Approve/Deny → PO Generation → Vendor
```

**AI Coach Flow**
```
Parent → Question → Claude (with student context) → Streaming Response
```

**Compliance Flow**
```
Daily Activity → Engagement Log → Monthly Aggregation → Audit Report
```

**Progress Note Flow**
```
Engagement Logs → AI Draft (Claude) → Teacher Edit → Save → Record
```

---

## AI Safety & Compliance

- FERPA compliant — no raw student records sent to AI
- COPPA compliant — student data anonymized
- All AI output requires human review before publishing
- Engagement and contact logs maintained for state audits

---

## Current Build Phase

**Phase 1 — Synthetic Demo Environment**

| Item | Status |
|---|---|
| Auth (Firebase) | Complete |
| Parent portal (dashboard, catalog, purchases, AI Coach) | Complete |
| Teacher portal (dashboard, students, orders, progress notes, newsletters, compliance) | Complete |
| Seed data (1 school, 25 students, 45 catalog items, 1,291 engagement logs) | Complete |
| Cloudflare deployment | Pending |
| Admin portal | Pending |
| Google SSO | Pending |
| Email (Resend) | Pending |

---

## Monetization Model

| Stream | Detail |
|---|---|
| Per-student SaaS | $8–$15/student/month |
| Transaction take rate | 2–5% on vendor purchases routed through platform |
| Vendor marketplace | Featured listings, analytics, demand generation |

---

## Environment Variables

```bash
# Database
DATABASE_URL=

# Firebase (client — public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server — secret)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# AI
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

---

## Do Not

- Use real student data in any environment
- Send PII to AI APIs
- Break multi-tenant isolation (`school_id` scoping)
- Skip TypeScript strict mode
- Allow unreviewed AI output to reach end users
- Hardcode credentials or API keys

---

## Strategic Positioning

This platform is **not**:
- An LMS
- A chatbot
- A reporting tool

This platform **is**:

> The operating system for independent study charter schools — controlling how funds are spent, how decisions are made, and how compliance is maintained.

**Moat:** Switching costs compound over time. The more engagement logs, purchase history, and compliance records live in this system, the harder it is to leave.

**Exit:** Acquisition or licensing to a CMO, SIS provider, or OPSLR successor.
