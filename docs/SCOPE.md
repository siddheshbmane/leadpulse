# SCOPE.md — LeadPulse

> Generated: 2026-03-05 | Phase 0 Documentation

---

## 1. PROJECT OVERVIEW

### Product Name
LeadPulse

### One-Liner
AI-powered lead-intent discovery platform that finds high-intent prospects across LinkedIn, Google Maps, and Reddit before your competitors do.

### Elevator Pitch
LeadPulse automates outbound prospecting by letting sales teams define targeting criteria (Search Filters), then deploys custom scraper agents to discover leads showing buying intent across multiple platforms. Leads are scored, triaged, and exported — all from a single dark-mode dashboard built for speed.

### Problem Statement
Sales teams waste 60%+ of their time manually searching LinkedIn, Google, and forums for prospects. By the time they find a lead, competitors have already reached out. There's no unified tool that discovers high-intent leads across multiple sources, scores them, and presents them in a single pipeline — especially one that doesn't cost $500+/month like Apollo or ZoomInfo.

### Target Audience
- **Primary:** B2B sales teams (5-50 people) doing outbound prospecting
- **Secondary:** Growth agencies managing outbound for multiple clients
- **Tertiary:** Solo founders and freelancers doing their own lead gen

### Success Metrics
| Metric | Target (6 months) |
|--------|-------------------|
| Monthly Active Users | 200+ |
| Leads discovered per month | 50,000+ |
| Avg. leads per user per month | 250+ |
| User retention (30-day) | >60% |
| NPS | >40 |
| MRR | $5,000+ |

---

## 2. USER PERSONAS

### Persona 1: "Sales Sam" — SDR at a B2B SaaS Company
- **Role:** Sales Development Representative
- **Goals:** Find 50+ qualified leads per week, book 10+ meetings/month
- **Frustrations:** Manual LinkedIn searching is slow, Apollo is too expensive, leads go stale fast
- **Tech Savviness:** Medium — comfortable with SaaS tools, not a developer
- **Features Used:** Search Filters, Lead Management, Export, Intelligence

### Persona 2: "Agency Alex" — Growth Agency Owner
- **Role:** Agency owner managing outbound for 5-10 clients
- **Goals:** Deliver consistent lead flow to clients, scale operations without hiring
- **Frustrations:** Each client needs different targeting, managing multiple tools is chaos
- **Tech Savviness:** Medium-High — uses APIs, understands automation
- **Features Used:** Organizations (multi-client), Search Filters, Lead Management, Export, Teams

### Persona 3: "Founder Fiona" — Solo B2B Founder
- **Role:** Technical founder doing her own sales
- **Goals:** Find 20 qualified leads/week without spending hours on LinkedIn
- **Frustrations:** Can't afford enterprise tools, hates manual prospecting, needs something that just works
- **Tech Savviness:** High — developer, wants efficiency
- **Features Used:** Search Filters, Lead Management, Export

---

## 3. FEATURE SPECIFICATION

### F1: Search Filter Builder [P0]
**Description:** Users create and manage targeting rules that define what leads to discover. Each filter specifies sources, keywords, industries, job titles, and scheduling frequency.

**User Stories:**
- As a sales rep, I want to create a search filter targeting "Series A CTOs in India" so that I get a steady stream of relevant leads.
- As a user, I want to schedule filters to run automatically every 24 hours so I don't have to manually trigger searches.
- As a user, I want to pause/resume filters so I can control my credit usage.

**Acceptance Criteria:**
- Given a logged-in user, when they navigate to /search-filters, then they see a list of their org's filters
- Given a user clicks "Create Filter", when they fill the form with name, sources, query parameters, and schedule, then the filter is saved and appears in the list
- Given a filter is active and nextRunAt <= now(), when the scheduler runs, then a job is created for that filter
- Given a user toggles a filter off, when the scheduler runs, then that filter is skipped

**Priority:** P0 | **Complexity:** Medium | **Dependencies:** Database, Seed org

### F2: Multi-Source Lead Discovery [P0]
**Description:** Custom scraper agents execute search filters against LinkedIn (via search engines), Google Maps, and Reddit. Results are normalized and upserted into the leads table.

**User Stories:**
- As a user, I want my filters to search LinkedIn, Google Maps, and Reddit so I get leads from multiple channels.
- As a user, I want to see which source each lead came from so I can prioritize outreach.
- As a user, I want deduplication so I don't see the same lead twice.

**Acceptance Criteria:**
- Given an active filter with source "linkedin", when the scraper runs, then it discovers LinkedIn profiles matching the query
- Given a lead already exists (same org + source + externalId), when the scraper finds it again, then it updates rather than duplicates
- Given a scraper run completes, when results are written, then the filter's lastRunAt and totalLeadsFound are updated

**Priority:** P0 | **Complexity:** High | **Dependencies:** Search Filters, Database

### F3: Lead Management [P0]
**Description:** A data table showing all discovered leads with filtering, sorting, status management, scoring, and tagging. Includes a detail drawer/page for each lead.

**User Stories:**
- As a sales rep, I want to see all my leads in a sortable/filterable table so I can quickly find the best prospects.
- As a user, I want to change a lead's status (New -> Qualified -> Contacted -> Won/Lost) so I can track my pipeline.
- As a user, I want to tag leads so I can organize them by campaign or category.
- As a user, I want to view a lead's full details including raw discovery data so I can personalize outreach.

**Acceptance Criteria:**
- Given a user navigates to /leads, then they see a paginated data table with columns: Name, Company, Source, Status, Score, Discovered date
- Given a user clicks a lead row, then a detail view opens showing all lead fields + raw data
- Given a user changes a lead's status, then a LeadEvent is created for audit trail
- Given a user applies filters (status, source, date range), then the table updates accordingly

**Priority:** P0 | **Complexity:** Medium | **Dependencies:** Lead Discovery, Database

### F4: Lead Export [P0]
**Description:** Export filtered leads as CSV for use in CRM, email tools, or spreadsheets.

**User Stories:**
- As a user, I want to export my leads as CSV so I can import them into my CRM.
- As a user, I want to export only filtered/selected leads so I get exactly what I need.

**Acceptance Criteria:**
- Given a user clicks "Export", when they have leads selected or filtered, then a CSV file is downloaded
- Given the export runs, then it includes: name, company, title, email, phone, source, status, tags, discoveredAt
- Given the export runs, then usage is tracked in UsageRecord table (no credit enforcement in Phase 1)

**Priority:** P0 | **Complexity:** Low | **Dependencies:** Lead Management

### F5: Intelligence Dashboard [P1]
**Description:** AI-powered analytics showing intent signals, trend analysis, lead scoring insights, and recommended actions.

**User Stories:**
- As a user, I want AI to analyze my leads and highlight the highest-intent ones.
- As a user, I want to see trends (e.g., "Manufacturing CTOs are 3x more active this week").

**Acceptance Criteria:**
- Given a user navigates to /intelligence, then they see AI-generated insights based on their lead data
- Given the AI runs analysis, then it produces intent scores, trend summaries, and recommendations

**Priority:** P1 | **Complexity:** High | **Dependencies:** Lead data, AI providers (OpenAI/Gemini/OpenRouter)

### F6: Real-Time Scraper Feed [P1]
**Description:** Live activity feed showing scraper progress, new lead discoveries, and system events.

**User Stories:**
- As a user, I want to see live updates when my scrapers find new leads.

**Acceptance Criteria:**
- Given a scraper is running, when it discovers a lead, then the feed updates in near-real-time
- Given the feed shows events, then each event includes timestamp, source, and summary

**Priority:** P1 | **Complexity:** Medium | **Dependencies:** Job system, WebSocket/SSE

### F7: Team Collaboration [P2]
**Description:** Team workspaces within organizations, lead assignment, shared filters.

**Priority:** P2 | **Complexity:** Medium

### F8: Lead Enrichment [P2]
**Description:** Third-party email/phone lookup to enrich discovered leads.

**Priority:** P2 | **Complexity:** Medium

### F9: Authentication [P3 — Deferred]
**Description:** Magic link passwordless auth (send email, verify token, session management). Deferred because the tool is for internal use initially. Schema tables (User, Session, MagicLink) are created from Day 1; a hardcoded seed user is used instead of login flow.

**Priority:** P3 (deferred) | **Complexity:** Medium

### F10: Multi-Tenancy UI [P3 — Deferred]
**Description:** Organization onboarding, org settings, member management, role-based access control UI. Schema is multi-tenant from Day 1 (organizationId on all tables); UI is deferred. A single seed organization is used internally.

**Priority:** P3 (deferred) | **Complexity:** Medium

### F11: Billing & Payments [P3 — Deferred]
**Description:** Razorpay integration, credit purchasing, usage-based limits enforcement. UsageRecord table tracks usage from Day 1; credit limits and payment flow are deferred.

**Priority:** P3 (deferred) | **Complexity:** High

---

## 4. INFORMATION ARCHITECTURE

### Sitemap
```
Phase 1 (Internal — no auth):
/ (redirects to /dashboard)
├── /dashboard                # Overview — stats, recent leads, activity
├── /leads                    # Lead management table
│   └── /leads/[id]           # Lead detail (drawer or page)
├── /search-filters           # Filter list
│   └── /search-filters/new   # Create filter
│   └── /search-filters/[id]  # Edit filter
├── /intelligence             # AI insights (P1)
├── /jobs                     # Scraper job history
├── /settings                 # Settings hub
│   └── /settings/profile     # User profile (basic)

Deferred (added when going SaaS):
├── /login                    # Magic link login
├── /verify                   # Magic link verification
├── /onboarding               # First-time org setup
├── /settings/organization    # Org settings
├── /settings/team            # Team management
├── /settings/billing         # Usage & payments
├── /settings/api-keys        # API key management
```

### Navigation Structure
- **Sidebar (primary):** Dashboard, Leads, Search Filters, Intelligence, Jobs, Settings
- **Header:** Breadcrumbs, Notifications, User avatar/menu
- **User menu dropdown:** Profile, Org settings, Billing, Sign out

### Key User Flows

**Flow 1: Internal user (Phase 1 — no auth)**
Open app -> Dashboard (seed user auto-loaded) -> Full access to all features

**Flow 2: Create and run a search filter**
Search Filters -> Create Filter -> Define query + sources + schedule -> Save -> Filter runs automatically -> Leads appear in /leads

**Flow 3: Triage leads**
Leads table -> Filter by source/status -> Click lead -> View details -> Update status -> Tag -> Export selection

**Flow 4: First-time SaaS user (deferred — Phase 1b)**
Login (magic link) -> Verify email -> Create organization -> Onboarding (create first filter) -> Dashboard

---

## 5. NON-FUNCTIONAL REQUIREMENTS

| Requirement | Target |
|---|---|
| Page load (LCP) | < 2.5s |
| API response time (p95) | < 500ms |
| Time to Interactive | < 3.5s |
| Uptime SLA | 99.5% |
| Accessibility | WCAG 2.2 AA |
| Browser support | Chrome, Firefox, Safari, Edge (last 2 versions) |
| Mobile support | Responsive (tablet + mobile) |
| Security | OWASP Top 10, rate limiting, input validation |
| Data residency | No specific requirement (Railway regions) |

---

## 6. OUT OF SCOPE (Phase 1)

- Mobile native app (Phase 4)
- CRM integrations (Salesforce, HubSpot) — future
- Chrome extension — future
- Public API for third parties — future
- White-label / reseller mode — future
- Email outreach (sending emails from within the platform) — future
- A/B testing for scraper strategies — future

---

## 7. RISKS & ASSUMPTIONS

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Scraper blocking by LinkedIn/Google | High | High | Use rotating proxies, headless browser stealth, rate limiting per source |
| Razorpay integration complexity | Low | Medium | Use Razorpay's well-documented Node.js SDK |
| Multi-provider AI inconsistency | Medium | Low | Standardize prompts, use OpenRouter as fallback router |

### Business Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Platform ToS violations (scraping) | Medium | High | Respect robots.txt, rate limit, focus on public data only |
| Low initial adoption | Medium | Medium | Focus on a single niche (B2B SaaS) first |

### Assumptions
- Users will primarily use the web dashboard (no mobile app needed for MVP)
- LinkedIn data is discoverable via search engine results (no direct API needed)
- Razorpay supports usage-based/credit billing model
- Railway can handle the scraper workloads within budget
- 50 concurrent users won't require horizontal scaling
