# LeadPulse

LeadPulse is a lead-intent discovery platform: users define **Search Filters** (targeting rules), scraper/agent workers discover leads across sources, and a web dashboard lets users triage, enrich, and export.

This repo is organized as a lightweight monorepo (apps + packages) with Postgres + Prisma as the system of record.

## Tech Stack

### Frontend (Dashboard)
- **Next.js** (App Router)
- **Tailwind CSS** for UI
- **Prisma Client** for data access (Server Components)

### Backend (API + Orchestration)
- **Node.js** (TypeScript recommended)
- **Prisma** for Postgres ORM
- **Auth.js** (or similar) for authentication (replaces Supabase Auth)

### Scraper / Agent Runtime
- **Node.js workers** using:
  - Puppeteer/Playwright for browser automation
  - Cheerio for HTML parsing
  - Zod for runtime validation
- Workers write results to Postgres using **Prisma**.

## Repository Layout

```text
leadpulse/
  apps/
    web/                # Next.js dashboard
    api/                # Node API (optional if not using Next route handlers)

  packages/
    shared/             # Shared types, Zod schemas, utilities
    db/                 # Prisma schema, migrations, and client
    scraper/            # Scraper framework (base classes, queue runner)

  scrapers/             # Standalone scraper scripts (legacy/experiments)
  docs/                 # Architecture notes
  scripts/              # Dev scripts (migrations, seed, etc.)
```

## High-Level Architecture

### Core Components
1. **Web App (apps/web)**
   - Authenticates users.
   - Reads/writes **Search Filters** and **Leads** via Prisma.
   - Supports lead triage states (status/score/tags) and export.

2. **API / Orchestrator (apps/api)**
   - Schedules work (manual triggers + periodic runs).
   - Assigns work items to scrapers (by `searchFilterId`).

3. **Scraper Agents (packages/scraper + scrapers/)**
   - Pull active filters, run per-source collectors, and upsert leads.
   - Persist raw evidence in `leads.raw` and extracted fields into typed columns.

### Data Flow (Typical Run)
1. User creates/edits a **Search Filter** in the dashboard.
2. Orchestrator selects runnable filters (`isActive = true` and `nextRunAt <= now()`).
3. Scraper worker:
   - loads filter definition (`searchFilters.query`)
   - performs searches on chosen platforms
   - normalizes results into lead objects
   - **upserts** into `leads`
4. Dashboard shows new leads immediately.

## Data Model

### Tables
- `User`
  - App-level user profile data.
- `SearchFilter`
  - Saved targeting definitions + scheduling metadata.
- `Lead`
  - Discovered leads with dedupe constraints and lifecycle fields.

See: `packages/db/prisma/schema.prisma`.

### Recommended Write Pattern (Idempotent)
Scrapers should upsert leads to avoid duplicates:
- Prefer upsert keys:
  - `(ownerId, source, externalId)` when `externalId` exists
  - `(ownerId, email)` when email exists

### Minimal Worker Loop (Pseudo)
```ts
// packages/scraper
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runOnce() {
  const filters = await prisma.searchFilter.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: new Date() }
    },
    take: 10
  })

  for (const f of filters) {
    // 1) collect results from sources based on f.query
    // 2) normalize -> leads[]

    // 3) upsert
    for (const l of leads) {
      await prisma.lead.upsert({
        where: {
          ownerId_source_externalId: {
            ownerId: f.ownerId,
            source: l.source,
            externalId: l.externalId
          }
        },
        update: { ...l },
        create: { ...l, ownerId: f.ownerId, searchFilterId: f.id }
      })
    }

    // 4) update run metadata
    await prisma.searchFilter.update({
      where: { id: f.id },
      data: { lastRunAt: new Date(), lastRunStatus: 'success' }
    })
  }
}
```

### Notes
- If you need strong concurrency control (multiple workers), add a `jobs` table and claim jobs with `SELECT ... FOR UPDATE SKIP LOCKED` via an RPC function.
- Keep raw evidence (snippets, SERP position, HTML fragments) in `leads.raw` for traceability.

## Next Steps (Suggested)
- Add a `jobs`/`runs` table for deterministic scheduling and progress tracking.
- Add `lead_events` for audit history (status changes, enrichments).
- Add `organizations` if multi-user teams are needed.

