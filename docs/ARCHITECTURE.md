# LeadPulse – Technical Architecture

## Goals
- Multi-tenant lead discovery (each user sees only their own leads).
- Idempotent scraping (safe re-runs, dedupe).
- Extensible source connectors.
- Clear separation: UI vs orchestration vs workers.

## Components

### 1) Next.js Dashboard (apps/web)
Responsibilities:
- Authentication
- Manage Search Filters
- View/Triage Leads (status/score/tags)
- Export (CSV/CRM integration later)

Suggested pages:
- /filters (CRUD)
- /leads (table + detail drawer)
- /leads/[id] (lead detail)

### 2) API / Orchestrator (apps/api)
Responsibilities:
- Scheduling: determine which filters should run.
- Execution: dispatch work to scraper workers.
- Guardrails: rate limiting per user/source, budget caps.

Deployment options:
- Standalone Node service (Fastify/Express)
- Next.js route handlers in apps/web

### 3) Scraper Agents (packages/scraper)
Responsibilities:
- Execute platform-specific collectors.
- Normalize + validate output.
- Upsert to Postgres via Prisma.

Recommended worker primitives:
- `Collector`: source-specific logic that returns `NormalizedLead[]`
- `Runner`: pulls runnable filters, executes collectors, writes results

## Storage (Postgres + Prisma)

### Multi-tenancy
All tenant-owned data uses `ownerId` and application logic ensures users only access their own data.

### Dedupe
Leads are deduped by:
- `(ownerId, email)` when email exists
- `(ownerId, source, externalId)` when the source provides a stable id

### Traceability
Store evidence payloads in `leads.raw` (jsonb) and enrichment outputs in `leads.enrichment` (jsonb).

## Operational Considerations

### Concurrency
If multiple workers are expected:
- Use Prisma's `$executeRaw` for `FOR UPDATE SKIP LOCKED` if building a custom queue.
- Track run IDs to attribute leads to runs.

### Observability
- Centralized logs for workers
- Persist `lastRunStatus`/`lastRunError` on `searchFilters`

