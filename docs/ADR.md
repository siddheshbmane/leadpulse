# ADR.md — LeadPulse Architecture Decision Records

> Generated: 2026-03-05 | Phase 0 Documentation

---

## ADR-001: Next.js 15+ (App Router) as the Web Framework

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
LeadPulse needs a React-based web framework that supports server-side rendering, API routes, and a modern development experience. The codebase already uses Next.js 16.

**Decision:**
Use Next.js with App Router as the primary web framework.

**Alternatives Considered:**
- **Remix:** Good DX and nested routing, but smaller ecosystem, less hosting flexibility on Railway. Rejected because Next.js has broader adoption and better Railway support.
- **SvelteKit:** Excellent performance and DX, but team expertise is in React/TypeScript. Would require learning a new framework. Rejected.
- **Astro:** Great for content sites but not ideal for highly interactive dashboard apps. Rejected.

**Consequences:**
- Positive: Huge ecosystem, excellent TypeScript support, file-based routing, built-in API routes, SSR/SSG flexibility, React Server Components for performance.
- Negative: App Router still has some rough edges, mental model shift from Pages Router, bundle size can be large if not careful.
- Risk: Next.js version churn (15->16) requires keeping up with breaking changes.

---

## ADR-002: PostgreSQL as the Primary Database

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
LeadPulse needs a relational database for structured lead data with strong querying, JSONB for flexible payloads, and job queue support.

**Decision:**
Use PostgreSQL as the sole database.

**Alternatives Considered:**
- **MongoDB:** Flexible schema, but relational queries (joins across leads/filters/orgs) are painful. No strong unique constraints for dedupe. Rejected.
- **MySQL:** Viable but PostgreSQL has better JSONB support, array columns, and `FOR UPDATE SKIP LOCKED` for job queues. Rejected.
- **SQLite (Turso):** Great for edge, but multi-tenant SaaS with concurrent scrapers writing needs a proper client-server database. Rejected.

**Consequences:**
- Positive: Excellent for relational data + JSONB hybrid, strong indexing, battle-tested at scale, Railway has managed Postgres.
- Negative: Requires a running server (not serverless-native like Turso), connection pooling needed for serverless functions.
- Risk: Connection limits on Railway's free/starter tier — mitigate with PgBouncer or Prisma connection pooling.

---

## ADR-003: Prisma as the ORM

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
Need a type-safe ORM that works well with TypeScript and PostgreSQL.

**Decision:**
Use Prisma ORM with Prisma Migrate for schema management.

**Alternatives Considered:**
- **Drizzle ORM:** Lighter weight, SQL-first, better raw query support. However, migration tooling is less mature, and Prisma's auto-generated types + relation handling is more productive for this project. Rejected for now — may revisit in Phase 2 if Prisma becomes a bottleneck.
- **TypeORM:** Decorator-based, less TypeScript-native, slower development. Rejected.
- **Kysely:** Type-safe query builder but requires more manual work than Prisma. Rejected.
- **Raw SQL (pg):** Maximum control but no type safety, no migration management. Rejected.

**Consequences:**
- Positive: Excellent DX with auto-completion, type-safe queries, declarative schema, built-in migrations, framework-agnostic.
- Negative: Generated client adds bundle size, some complex queries require `$queryRaw`, N+1 queries possible if relations not loaded explicitly.
- Risk: Prisma connection pooling (Accelerate) may be needed for serverless — adds cost.

---

## ADR-004: Magic Link Authentication (Custom Implementation)

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
LeadPulse needs passwordless authentication. The user chose Magic Link only.

**Decision:**
Build custom magic link authentication using Nodemailer for email delivery and session tokens stored in the database.

**Alternatives Considered:**
- **NextAuth.js (Auth.js):** Feature-rich but adds complexity for a single auth method (magic link). Would pull in unnecessary OAuth provider infrastructure. Rejected for simplicity.
- **Better Auth:** Newer, lighter, but less battle-tested. Rejected for maturity concerns.
- **Clerk/Auth0:** Managed auth services. Excellent DX but adds external dependency and cost. Rejected — we want to own the auth layer.
- **Supabase Auth:** Good magic link support but ties us to Supabase ecosystem. Rejected — we chose Railway + Postgres.

**Consequences:**
- Positive: Full control over auth flow, no external dependencies, simple mental model (email -> token -> session), easy to customize.
- Negative: Must handle security ourselves (token expiry, rate limiting, session management), no OAuth support without additional work.
- Risk: Email deliverability issues with Nodemailer — must configure SMTP properly (SPF, DKIM, DMARC).

---

## ADR-005: Modular Monolith Architecture (Phase 1)

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
Need to choose between monolith, modular monolith, and microservices for initial architecture.

**Decision:**
Start as a modular monolith (single Next.js app with domain modules) in Phase 1, then extract to a monorepo with shared packages in Phase 2.

**Alternatives Considered:**
- **Microservices from Day 1:** Massive over-engineering for a 50-user product. Adds deployment complexity, network latency, distributed tracing overhead. Rejected.
- **Plain monolith (no modules):** Faster to start but becomes spaghetti quickly. Hard to extract later. Rejected.
- **Monorepo from Day 1:** Adds Turborepo/pnpm workspace complexity before it's needed. We can extract when the codebase grows. Rejected for Phase 1.

**Consequences:**
- Positive: Fast iteration, single deployment, clear module boundaries enable future extraction, services are framework-agnostic (reusable in API server and mobile).
- Negative: Must be disciplined about module boundaries — easy to create cross-module dependencies.
- Risk: If not extracted in time, module boundaries erode.

---

## ADR-006: Razorpay for Payments

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
Need a payment gateway for usage-based credit purchases. Target market includes India.

**Decision:**
Use Razorpay for payment processing.

**Alternatives Considered:**
- **Stripe:** Industry standard, excellent API. However, user specifically chose Razorpay for INR support and Indian market focus. Rejected per user preference.
- **LemonSqueezy:** Good for SaaS subscriptions but less flexible for usage-based/credit models. Rejected.
- **PayU:** Indian payment gateway but worse developer experience than Razorpay. Rejected.

**Consequences:**
- Positive: Excellent INR support, UPI payments, good Node.js SDK, well-documented webhooks, supports one-time payments (credit packs).
- Negative: Less international coverage than Stripe, may need Stripe later for global expansion.
- Risk: Razorpay webhook reliability — must implement idempotent handlers and verify signatures.

---

## ADR-007: REST API (Next.js Route Handlers)

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
Need to choose API style for the web application.

**Decision:**
Use REST API via Next.js App Router route handlers in Phase 1. Consider extracting to a standalone Hono/Fastify API server in Phase 2.

**Alternatives Considered:**
- **tRPC:** Excellent type safety for TypeScript monorepos, but adds build complexity and is harder to consume from non-TypeScript clients (mobile, third-party). Rejected for Phase 1 — may adopt in Phase 2 for internal APIs.
- **GraphQL:** Overkill for this data model. LeadPulse doesn't have deeply nested relational queries that benefit from GraphQL's flexibility. Rejected.
- **Server Actions only:** Good for form submissions but not suitable for complex queries, pagination, or programmatic API access. Used alongside REST for mutations only.

**Consequences:**
- Positive: Simple, well-understood, easy to test with curl/Postman, works with any client, cacheable.
- Negative: No automatic type sharing between client and server (must maintain shared types manually).
- Risk: API routes in Next.js have cold start issues in serverless — Railway's always-on deployment mitigates this.

---

## ADR-008: Zustand for Client State Management

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
Need client-side state management for UI state (filters, selections, preferences).

**Decision:**
Use Zustand for client state + TanStack Query (React Query) for server state.

**Alternatives Considered:**
- **Redux Toolkit:** Banned by project bible (heart.md). Too much boilerplate for this scale. Rejected.
- **Jotai:** Atomic state model, good for simple state but Zustand's store pattern is better for our domain state (lead filters, selections). Rejected.
- **React Context only:** Fine for small apps but doesn't scale for complex filter states and lead selections without performance issues. Rejected as sole solution.

**Consequences:**
- Positive: Minimal boilerplate, no providers needed, works outside React components (useful for scrapers/services), tiny bundle size, DevTools available.
- Negative: Less opinionated than Redux — team must establish patterns.
- Risk: Minimal — Zustand is stable and widely adopted.

---

## ADR-009: Tailwind CSS + shadcn/ui (Heavily Customized)

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
Need a styling solution and component library.

**Decision:**
Use Tailwind CSS for styling with shadcn/ui + Radix primitives as the component foundation, heavily customized to match the Dark & Technical aesthetic with warm orange accent.

**Alternatives Considered:**
- **CSS Modules:** More isolated but slower to iterate. Tailwind's utility-first approach is faster for dashboard UIs. Rejected.
- **styled-components/emotion:** Runtime CSS-in-JS is banned by project bible. Rejected.
- **Material UI:** Opinionated design system that's hard to customize to match our aesthetic. Rejected.
- **Chakra UI:** Good DX but harder to deeply customize theming. Rejected.

**Consequences:**
- Positive: Fast iteration, consistent spacing/color through design tokens, shadcn/ui gives accessible primitives (Radix) with full control over styling, no vendor lock-in (components are in your codebase).
- Negative: Must customize extensively — default shadcn themes are banned. Initial setup effort for custom design system.
- Risk: Tailwind v4 migration (already in codebase) — some v3 patterns may not work.

---

## ADR-010: Custom Scrapers (Puppeteer/Playwright)

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
Need web scraping capability for lead discovery across LinkedIn, Google Maps, and Reddit.

**Decision:**
Build custom scraper agents using Puppeteer and/or Playwright, with a pluggable adapter pattern for different sources.

**Alternatives Considered:**
- **ScrapingBee/Bright Data:** Managed scraping APIs. Simpler but expensive at scale, less control over scraping logic. The existing codebase had a ScrapingBee adapter but user chose to build custom. Rejected per user preference.
- **Crawlee (Apify):** Good scraping framework but adds dependency. Our needs are focused enough that custom code is manageable. Rejected.
- **Cheerio only:** HTML parsing without browser automation. Won't work for JavaScript-rendered pages (LinkedIn). Rejected as sole solution — used alongside Puppeteer for HTML parsing.

**Consequences:**
- Positive: Full control over scraping behavior, no per-request costs, can implement stealth techniques (stealth plugin), can target specific data points.
- Negative: Must handle anti-bot measures (CAPTCHAs, rate limits, IP blocks), requires proxy infrastructure, browser automation is resource-intensive.
- Risk: Platform ToS violations — must scrape responsibly (rate limits, public data only, respect robots.txt). Puppeteer requires headless Chrome which increases Railway memory usage.

---

## ADR-011: Multi-Provider AI (OpenAI + Gemini + OpenRouter)

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
Intelligence features need LLM capabilities for lead scoring, intent analysis, and insights.

**Decision:**
Support multiple AI providers (OpenAI, Google Gemini, OpenRouter) with an abstraction layer that allows provider switching.

**Alternatives Considered:**
- **OpenAI only:** Simplest but creates single-provider lock-in. Rejected for flexibility.
- **Vercel AI SDK:** Good abstraction layer, but adds dependency on Vercel ecosystem. May adopt later. Rejected for Phase 1.
- **LangChain:** Over-engineered for our use case (simple prompt -> response). Rejected.

**Consequences:**
- Positive: Provider flexibility (cost optimization, fallback on outages), can use cheapest model per task, OpenRouter provides access to many models through one API.
- Negative: Must build and maintain provider abstraction layer, prompt behavior may differ across models.
- Risk: API cost management — must track and limit AI usage per organization (credits system).

---

## ADR-012: Nodemailer for Email

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
Need email delivery for magic links, notifications, and export delivery.

**Decision:**
Use Nodemailer with SMTP for transactional email.

**Alternatives Considered:**
- **Resend:** Modern email API, great DX, React Email support. Rejected per user preference for Nodemailer.
- **SendGrid:** Enterprise-grade but overkill and pricier for early stage. Rejected.
- **AWS SES:** Cost-effective but requires AWS account and more configuration. Rejected for simplicity.

**Consequences:**
- Positive: No external service dependency (just SMTP), zero cost if using own mail server, full control over email sending.
- Negative: Must configure SMTP server (or use Gmail/Outlook SMTP), deliverability depends on SMTP provider configuration (SPF, DKIM, DMARC), no built-in analytics.
- Risk: Emails landing in spam if SMTP not properly configured. Consider switching to Resend/SES if deliverability becomes an issue.

---

## ADR-013: Railway for Deployment

**Status:** Accepted
**Date:** 2026-03-05

**Context:**
Need a deployment platform for the Next.js app, PostgreSQL database, and scraper workers.

**Decision:**
Deploy everything on Railway.

**Alternatives Considered:**
- **Vercel:** Excellent for Next.js but serverless model is problematic for long-running scraper workers and WebSocket connections. Would need a separate platform for workers anyway. Rejected as sole platform.
- **AWS (ECS/Lambda):** Most flexible but highest operational complexity. Overkill for current scale. Rejected.
- **Docker + VPS (Hetzner):** Cheapest at scale but requires DevOps expertise for maintenance. Rejected for now.

**Consequences:**
- Positive: Simple deployment (git push), managed Postgres, support for long-running processes (scrapers), built-in monitoring, reasonable pricing, good DX.
- Negative: Less edge/CDN optimization than Vercel, pricing can increase with usage.
- Risk: Railway pricing at scale — monitor costs as user base grows. May need to migrate workers to cheaper infrastructure later.
