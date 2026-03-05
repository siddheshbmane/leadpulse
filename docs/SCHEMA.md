# SCHEMA.md — LeadPulse Database Design

> Generated: 2026-03-05 | Phase 0 Documentation

---

## 1. DATABASE CHOICE JUSTIFICATION

### Why PostgreSQL
- Battle-tested relational database with excellent JSON support (JSONB for raw/enrichment payloads)
- Strong indexing capabilities for the query patterns we need (composite indexes, partial indexes)
- `SELECT ... FOR UPDATE SKIP LOCKED` for job queue without external dependencies
- Array column support (tags field)
- Decimal precision for lead scoring
- Excellent Railway support (managed Postgres)

### Why Prisma
- Type-safe database client generated from schema — aligns with TypeScript-first approach
- Declarative schema with migration management
- Excellent DX with auto-completion and type inference
- Supports all PostgreSQL features we need (JSONB, arrays, enums, composite unique constraints)
- Framework-agnostic — services using Prisma can be shared with mobile/API later

---

## 2. ENTITY RELATIONSHIP DIAGRAM

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│    User       │────<│ OrganizationMember   │>────│ Organization │
│              │     │                     │     │              │
│ id           │     │ id                  │     │ id           │
│ email        │     │ userId              │     │ name         │
│ fullName     │     │ organizationId      │     │ slug         │
│ avatarUrl    │     │ role                │     │ plan         │
│              │     │                     │     │ credits      │
└──────────────┘     └─────────────────────┘     └──────┬───────┘
      │                                                  │
      │  ┌──────────────┐     ┌──────────────┐          │
      │  │ TeamMember    │>────│ Team          │──────────┤
      │  │              │     │              │          │
      │  │ userId       │     │ id           │          │
      └──<│ teamId       │     │ orgId        │          │
           └──────────────┘     │ name         │          │
                                └──────────────┘          │
                                                          │
      ┌───────────────────────────────────────────────────┤
      │                    │                    │         │
┌─────┴────────┐   ┌──────┴───────┐   ┌───────┴──────┐  │
│ SearchFilter  │   │ Lead          │   │ Job           │  │
│              │──<│              │   │              │  │
│ id           │   │ id           │   │ id           │  │
│ orgId        │   │ orgId        │   │ orgId        │  │
│ name         │   │ filterId     │   │ filterId     │  │
│ query (JSON) │   │ source       │   │ status       │  │
│ schedule     │   │ personName   │   │ leadsFound   │  │
│ isActive     │   │ status       │   │              │  │
│              │   │ score        │   └──────────────┘  │
└──────────────┘   │ raw (JSON)   │                     │
                   │              │   ┌──────────────┐  │
                   │              │──<│ LeadEvent     │  │
                   └──────────────┘   │              │  │
                                      │ leadId       │  │
                                      │ type         │  │
                                      │ data (JSON)  │  │
                                      └──────────────┘  │
                                                        │
                   ┌──────────────┐   ┌──────────────┐  │
                   │ UsageRecord   │───┤ Payment       │──┘
                   │              │   │              │
                   │ orgId        │   │ orgId        │
                   │ type         │   │ razorpayId   │
                   │ credits      │   │ amount       │
                   └──────────────┘   │ credits      │
                                      └──────────────┘

Auth Tables:
┌──────────────┐     ┌──────────────┐
│ Session       │─────│ User          │
│ token        │     └──────┬───────┘
│ expiresAt    │            │
└──────────────┘     ┌──────┴───────┐
                     │ MagicLink     │
                     │ token        │
                     │ email        │
                     │ expiresAt    │
                     └──────────────┘
```

---

## 3. TABLE DEFINITIONS

### 3.1 User
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| email | String | UNIQUE, NOT NULL | | Login identifier |
| fullName | String? | | null | Display name |
| avatarUrl | String? | | null | Profile picture URL |
| createdAt | DateTime | NOT NULL | now() | |
| updatedAt | DateTime | NOT NULL | auto | |

**Indexes:** email (unique)
**Relations:** OrganizationMember[], Session[], MagicLink[]

### 3.2 Session
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| userId | String | FK -> User | | |
| token | String | UNIQUE | | Session token (httpOnly cookie) |
| expiresAt | DateTime | NOT NULL | | 30-day expiry |
| ipAddress | String? | | null | For security audit |
| userAgent | String? | | null | For security audit |
| createdAt | DateTime | NOT NULL | now() | |

**Indexes:** token (unique), userId
**On Delete:** CASCADE (user deleted -> sessions deleted)

### 3.3 MagicLink
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| email | String | NOT NULL | | Target email |
| token | String | UNIQUE | | 6-digit code or UUID |
| expiresAt | DateTime | NOT NULL | | 15-minute expiry |
| usedAt | DateTime? | | null | Set when used |
| createdAt | DateTime | NOT NULL | now() | |

**Indexes:** token (unique), email
**Note:** Tokens are single-use. Clean up expired tokens via cron.

### 3.4 Organization
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| name | String | NOT NULL | | Display name |
| slug | String | UNIQUE, NOT NULL | | URL-safe identifier |
| logoUrl | String? | | null | |
| plan | PlanType (enum) | NOT NULL | FREE | Current plan tier |
| credits | Int | NOT NULL | 100 | Available credits |
| createdAt | DateTime | NOT NULL | now() | |
| updatedAt | DateTime | NOT NULL | auto | |

**Indexes:** slug (unique)
**Relations:** OrganizationMember[], Team[], SearchFilter[], Lead[], Job[], UsageRecord[], Payment[]

### 3.5 OrganizationMember
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| organizationId | String | FK -> Organization | | |
| userId | String | FK -> User | | |
| role | OrgRole (enum) | NOT NULL | MEMBER | OWNER/ADMIN/MEMBER/VIEWER |
| createdAt | DateTime | NOT NULL | now() | |
| updatedAt | DateTime | NOT NULL | auto | |

**Indexes:** userId
**Unique Constraint:** (organizationId, userId)
**On Delete:** CASCADE from both Organization and User

### 3.6 Team
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| organizationId | String | FK -> Organization | | |
| name | String | NOT NULL | | |
| createdAt | DateTime | NOT NULL | now() | |
| updatedAt | DateTime | NOT NULL | auto | |

**Indexes:** organizationId

### 3.7 TeamMember
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| teamId | String | FK -> Team | | |
| userId | String | NOT NULL | | |
| createdAt | DateTime | NOT NULL | now() | |

**Unique Constraint:** (teamId, userId)

### 3.8 SearchFilter
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| organizationId | String | FK -> Organization | | Tenant scope |
| createdById | String | NOT NULL | | User who created it |
| name | String | NOT NULL | | Filter display name |
| description | String? | | null | |
| sources | String[] | NOT NULL | [] | e.g., ["linkedin", "google_maps"] |
| query | Json | NOT NULL | {} | Targeting definition (keywords, titles, industries) |
| isActive | Boolean | NOT NULL | true | |
| runEveryMinutes | Int? | | null | null = manual only |
| lastRunAt | DateTime? | | null | |
| nextRunAt | DateTime? | | null | |
| lastRunStatus | String? | | null | success/error/partial |
| lastRunError | String? | | null | Error message if failed |
| totalRuns | Int | NOT NULL | 0 | |
| totalLeadsFound | Int | NOT NULL | 0 | |
| createdAt | DateTime | NOT NULL | now() | |
| updatedAt | DateTime | NOT NULL | auto | |

**Indexes:** organizationId, (isActive, nextRunAt)
**Relations:** Lead[], Job[]

### 3.9 Lead
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| organizationId | String | FK -> Organization | | Tenant scope |
| searchFilterId | String? | FK -> SearchFilter | null | Which filter found this |
| externalId | String? | | null | Platform-specific ID |
| source | String | NOT NULL | | linkedin/google_maps/reddit/website |
| sourceUrl | String? | | null | Direct link to source |
| companyName | String? | | null | |
| personName | String? | | null | |
| title | String? | | null | Job title |
| email | String? | | null | |
| phone | String? | | null | |
| website | String? | | null | |
| linkedinUrl | String? | | null | |
| country | String? | | null | |
| region | String? | | null | |
| city | String? | | null | |
| status | LeadStatus (enum) | NOT NULL | NEW | |
| score | Decimal(5,2)? | | null | 0.00 - 999.99 |
| intentSignal | String? | | null | What triggered discovery |
| tags | String[] | NOT NULL | [] | |
| raw | Json | NOT NULL | {} | Raw scraper payload |
| enrichment | Json | NOT NULL | {} | Enrichment data |
| discoveredAt | DateTime | NOT NULL | now() | |
| createdAt | DateTime | NOT NULL | now() | |
| updatedAt | DateTime | NOT NULL | auto | |

**Indexes:** organizationId, searchFilterId, (organizationId, status), (organizationId, email), (organizationId, source, externalId)
**Unique Constraints:**
- (organizationId, email) — when email exists
- (organizationId, source, externalId) — when externalId exists
**Relations:** LeadEvent[]

### 3.10 LeadEvent
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| leadId | String | FK -> Lead | | |
| type | String | NOT NULL | | status_change/enrichment/note/export |
| data | Json | NOT NULL | {} | Event payload |
| createdBy | String? | | null | User ID who triggered |
| createdAt | DateTime | NOT NULL | now() | |

**Indexes:** leadId
**On Delete:** CASCADE from Lead

### 3.11 Job
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| organizationId | String | FK -> Organization | | Tenant scope |
| searchFilterId | String | FK -> SearchFilter | | |
| status | JobStatus (enum) | NOT NULL | PENDING | |
| source | String | NOT NULL | | Which source this job targets |
| startedAt | DateTime? | | null | |
| completedAt | DateTime? | | null | |
| error | String? | | null | |
| leadsFound | Int | NOT NULL | 0 | Total results |
| leadsNew | Int | NOT NULL | 0 | Net new (after dedupe) |
| creditsUsed | Int | NOT NULL | 0 | Credits consumed |
| createdAt | DateTime | NOT NULL | now() | |
| updatedAt | DateTime | NOT NULL | auto | |

**Indexes:** organizationId, status, searchFilterId

### 3.12 UsageRecord
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| organizationId | String | FK -> Organization | | |
| type | String | NOT NULL | | lead_discovered/scraper_run/export/ai_analysis |
| credits | Int | NOT NULL | | Credits consumed (positive) or added (negative) |
| description | String? | | null | |
| metadata | Json | NOT NULL | {} | |
| createdAt | DateTime | NOT NULL | now() | |

**Indexes:** organizationId, (organizationId, createdAt)

### 3.13 Payment
| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | String (cuid) | PK | auto | |
| organizationId | String | FK -> Organization | | |
| razorpayOrderId | String? | UNIQUE | null | |
| razorpayPaymentId | String? | UNIQUE | null | |
| amount | Int | NOT NULL | | In paise (INR smallest unit) |
| currency | String | NOT NULL | INR | |
| status | String | NOT NULL | | created/captured/failed/refunded |
| credits | Int | NOT NULL | | Credits purchased |
| createdAt | DateTime | NOT NULL | now() | |
| updatedAt | DateTime | NOT NULL | auto | |

**Indexes:** organizationId

---

## 4. ENUMS

```
LeadStatus: NEW | ENRICHED | QUALIFIED | CONTACTED | WON | LOST | IGNORED
JobStatus:  PENDING | RUNNING | SUCCESS | ERROR | CANCELLED
OrgRole:    OWNER | ADMIN | MEMBER | VIEWER
PlanType:   FREE | STARTER | PRO | ENTERPRISE
```

---

## 5. MULTI-TENANCY MODEL

### Tenant-Scoped Tables (all include organizationId)
- SearchFilter
- Lead
- LeadEvent (via Lead)
- Job
- UsageRecord
- Payment

### Tenant Isolation Strategy
- **Application-level enforcement:** Every query to tenant-scoped tables MUST include `organizationId` in the WHERE clause
- **Prisma middleware** (optional): Add middleware that automatically injects organizationId from the authenticated user's active organization
- **API layer:** All API routes extract organizationId from the session and pass it down to services
- **No cross-tenant data access:** Services never accept raw organizationId from user input — always derived from session

### Global Tables (not tenant-scoped)
- User
- Session
- MagicLink
- Organization
- OrganizationMember
- Team
- TeamMember

---

## 6. SEED DATA

### Default Plans
| Plan | Credits/month | Price | Features |
|------|--------------|-------|----------|
| FREE | 100 | Rs.0 | 1 filter, 100 leads/month, CSV export |
| STARTER | 1,000 | Rs.999/mo | 5 filters, 1K leads/month, all sources |
| PRO | 10,000 | Rs.4,999/mo | Unlimited filters, 10K leads/month, AI insights, teams |
| ENTERPRISE | Custom | Custom | Custom limits, dedicated support, SLA |

### Seed User & Organization (Phase 1 — Internal Use)
In Phase 1, the app runs without auth. A seed user and seed org are auto-created:

- **Seed User:** admin@leadpulse.io (fullName: "Admin", role: OWNER)
- **Seed Organization:** "LeadPulse Internal" (slug: "leadpulse-internal", plan: PRO, credits: 999999)
- **Seed Membership:** admin@leadpulse.io -> LeadPulse Internal (role: OWNER)

All API requests auto-inject this user/org context via middleware.

### Additional Test Users (for SaaS phase)
- user@test.com — Regular user with sample org "Acme Corp"

### Sample Search Filter
```json
{
  "name": "Series A CTOs in India",
  "sources": ["linkedin"],
  "query": {
    "keywords": ["Series A", "CTO", "India"],
    "jobTitles": ["CTO", "VP Engineering"],
    "industries": ["Software Development", "Information Technology"],
    "location": "India"
  }
}
```

---

## 7. MIGRATION STRATEGY

- **Tool:** Prisma Migrate (`npx prisma migrate dev` / `npx prisma migrate deploy`)
- **Naming convention:** Descriptive names (e.g., `add_organizations_table`, `add_jobs_table`)
- **Rollback:** Prisma supports rollback via `prisma migrate resolve`
- **Production:** Run `prisma migrate deploy` in CI/CD before app starts
- **Seed:** Run `prisma db seed` for development/staging environments

---

## 8. COMPLETE PRISMA SCHEMA

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- ENUMS ---

enum LeadStatus {
  NEW
  ENRICHED
  QUALIFIED
  CONTACTED
  WON
  LOST
  IGNORED
}

enum JobStatus {
  PENDING
  RUNNING
  SUCCESS
  ERROR
  CANCELLED
}

enum OrgRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum PlanType {
  FREE
  STARTER
  PRO
  ENTERPRISE
}

// --- AUTH ---

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  fullName  String?
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions    Session[]
  magicLinks  MagicLink[]
  memberships OrganizationMember[]

  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
  @@map("sessions")
}

model MagicLink {
  id        String    @id @default(cuid())
  email     String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  userId    String?
  user      User?     @relation(fields: [userId], references: [id])
  createdAt DateTime  @default(now())

  @@index([token])
  @@index([email])
  @@map("magic_links")
}

// --- MULTI-TENANCY ---

model Organization {
  id      String   @id @default(cuid())
  name    String
  slug    String   @unique
  logoUrl String?
  plan    PlanType @default(FREE)
  credits Int      @default(100)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members       OrganizationMember[]
  teams         Team[]
  searchFilters SearchFilter[]
  leads         Lead[]
  jobs          Job[]
  usageRecords  UsageRecord[]
  payments      Payment[]

  @@map("organizations")
}

model OrganizationMember {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           OrgRole      @default(MEMBER)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@unique([organizationId, userId])
  @@index([userId])
  @@map("organization_members")
}

model Team {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name           String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  members TeamMember[]

  @@index([organizationId])
  @@map("teams")
}

model TeamMember {
  id        String   @id @default(cuid())
  teamId    String
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  userId    String
  createdAt DateTime @default(now())

  @@unique([teamId, userId])
  @@map("team_members")
}

// --- CORE: SEARCH FILTERS ---

model SearchFilter {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdById    String

  name        String
  description String?

  sources String[] @default([])
  query   Json     @default("{}")

  isActive        Boolean   @default(true)
  runEveryMinutes Int?
  lastRunAt       DateTime?
  nextRunAt       DateTime?

  lastRunStatus   String?
  lastRunError    String?
  totalRuns       Int @default(0)
  totalLeadsFound Int @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  leads Lead[]
  jobs  Job[]

  @@index([organizationId])
  @@index([isActive, nextRunAt])
  @@map("search_filters")
}

// --- CORE: LEADS ---

model Lead {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  searchFilterId String?
  searchFilter   SearchFilter? @relation(fields: [searchFilterId], references: [id], onDelete: SetNull)

  externalId String?
  source     String
  sourceUrl  String?

  companyName String?
  personName  String?
  title       String?

  email       String?
  phone       String?
  website     String?
  linkedinUrl String?

  country String?
  region  String?
  city    String?

  status       LeadStatus @default(NEW)
  score        Decimal?   @db.Decimal(5, 2)
  intentSignal String?
  tags         String[]   @default([])

  raw        Json @default("{}")
  enrichment Json @default("{}")

  discoveredAt DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  events LeadEvent[]

  @@index([organizationId])
  @@index([searchFilterId])
  @@index([organizationId, status])
  @@index([organizationId, email])
  @@index([organizationId, source, externalId])
  @@unique([organizationId, email], name: "uq_leads_org_email")
  @@unique([organizationId, source, externalId], name: "uq_leads_org_source_external")
  @@map("leads")
}

model LeadEvent {
  id        String   @id @default(cuid())
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  type      String
  data      Json     @default("{}")
  createdBy String?
  createdAt DateTime @default(now())

  @@index([leadId])
  @@map("lead_events")
}

// --- JOBS / QUEUE ---

model Job {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  searchFilterId String
  searchFilter   SearchFilter @relation(fields: [searchFilterId], references: [id], onDelete: Cascade)

  status      JobStatus @default(PENDING)
  source      String
  startedAt   DateTime?
  completedAt DateTime?
  error       String?

  leadsFound  Int @default(0)
  leadsNew    Int @default(0)
  creditsUsed Int @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
  @@index([status])
  @@index([searchFilterId])
  @@map("jobs")
}

// --- BILLING ---

model UsageRecord {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  type        String
  credits     Int
  description String?
  metadata    Json @default("{}")

  createdAt DateTime @default(now())

  @@index([organizationId])
  @@index([organizationId, createdAt])
  @@map("usage_records")
}

model Payment {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  razorpayOrderId   String? @unique
  razorpayPaymentId String? @unique

  amount   Int
  currency String @default("INR")
  status   String
  credits  Int

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
  @@map("payments")
}
```
