# WIREFRAMES.md — LeadPulse UI/UX Specifications

> Generated: 2026-03-05 | Phase 0 Documentation

---

## Design System Foundation

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| --background | #0A0A0A | Page background |
| --surface | #111111 | Card/panel background |
| --surface-hover | #1A1A1A | Hover states |
| --border | #27272A | Borders, dividers |
| --border-subtle | #1F1F23 | Subtle borders |
| --foreground | #FAFAFA | Primary text |
| --muted | #A1A1AA | Secondary text |
| --muted-dim | #52525B | Tertiary text |
| --accent | #F97316 | Primary accent (warm orange) |
| --accent-hover | #EA580C | Accent hover state |
| --accent-muted | rgba(249,115,22,0.1) | Accent background (10% opacity) |
| --success | #22C55E | Success states |
| --warning | #EAB308 | Warning states |
| --error | #EF4444 | Error states |
| --info | #3B82F6 | Info states |

### Typography
- **Heading font:** Inter (variable, weights 500-800)
- **Body font:** Inter (variable, weights 400-500)
- **Mono font:** JetBrains Mono (for data, counts, IDs)
- **Scale:** text-xs (12px) -> text-sm (14px) -> text-base (16px) -> text-lg (18px) -> text-xl (20px) -> text-2xl (24px) -> text-3xl (30px)

### Spacing
- Page padding: p-6 lg:p-8
- Card padding: p-4 lg:p-6
- Section gaps: space-y-6 lg:space-y-8
- Grid gaps: gap-4 lg:gap-6

### Border Radius
- Cards/panels: rounded-xl (12px)
- Buttons: rounded-lg (8px)
- Badges/tags: rounded-md (6px)
- Avatars: rounded-full

### Animations
- Hover transitions: transition-all duration-200
- Page transitions: fade-in (200ms)
- Skeleton loading: animate-pulse with zinc-800/zinc-900

---

## DEFERRED SCREENS (Auth/Onboarding — built when going SaaS)

> Screens 1-3 (Login, Verify, Onboarding) are deferred to Phase 1b.
> In Phase 1, the app uses a hardcoded seed user and seed organization.
> Auth screens will be built when LeadPulse transitions from internal tool to SaaS.
> See the original wireframe specs preserved below for future reference.

### Screen 1: Login — /login [DEFERRED]
- Full-screen centered card, dark background with subtle grid pattern
- Email input + "Send Magic Link" button (orange, full-width)
- States: Default, Loading, Success ("Check your email"), Error, Rate limited

### Screen 2: Verify — /verify [DEFERRED]
- Auto-verifies on magic link click, fallback to manual code entry
- States: Verifying (spinner), Success (redirect), Expired, Invalid

### Screen 3: Onboarding — /onboarding [DEFERRED]
- Step 1: Create organization (name + slug)
- Step 2: Create first search filter (name + sources + keywords)

---

## Screen 4: Dashboard — /dashboard

### Purpose
Overview of lead pipeline, recent activity, key metrics, and credit usage.

### Layout
Sidebar (fixed) + Header (sticky) + Main content area.

```
+------+----------------------------------------------+
|      |  Dashboard / Overview              Bell (*)  |
| LEAD +----------------------------------------------+
| PULSE|                                              |
|      |  +------+ +------+ +------+ +----------+    |
|------|  | 1,560| |  45  | |  5   | |  850     |    |
|      |  |Total | |Today | |Active| |Credits   |    |
| Dash |  |Leads | |New   | |Filtr | |Remaining |    |
| Lead |  +------+ +------+ +------+ +----------+    |
| Filt |                                              |
| Intl |  +----------------------+---------------+    |
| Jobs |  |  Recent Leads        |  Activity Feed|    |
| Sett |  |                      |               |    |
|      |  |  Jane Smith | CTO    |  * 10:02 AM   |    |
|      |  |  TechCorp | linkedin |  32 new leads  |    |
|      |  |  ----------          |  from 'Series' |    |
|      |  |  Raj Kumar | VP Eng  |               |    |
|      |  |  StartupXYZ | reddit |  * 09:45 AM   |    |
|      |  |                      |  Filter run    |    |
|      |  |  ... more leads ...  |  completed     |    |
|------|  +----------------------+---------------+    |
| Sign |                                              |
|  Out |  +--------------------+-------------------+  |
|      |  | Leads by Source    | Leads by Status    |  |
|      |  | ==== LinkedIn 58%  | == New     51%     |  |
|      |  | === G.Maps   26%   | == Qualif  26%     |  |
|      |  | == Reddit    16%   | = Contact  13%     |  |
|      |  +--------------------+-------------------+  |
+------+----------------------------------------------+
```

### Content Inventory
- **Stats row:** 4 metric cards (Total Leads, New Today, Active Filters, Credits Remaining)
- **Recent Leads:** Mini table showing last 10 leads (name, company, source, time)
- **Activity Feed:** Timeline of recent events (scraper runs, new leads, status changes)
- **Charts:** Leads by Source (bar), Leads by Status (bar) — using simple CSS bars, no heavy chart lib

### States
- **Empty:** "No leads yet. Create your first search filter to get started." with CTA button
- **Loading:** Skeleton cards for stats, skeleton rows for table
- **Populated:** Full dashboard as wireframed

### Responsive
- Stats: 2x2 grid on mobile, 4-col on desktop
- Recent Leads + Activity Feed: stacked on mobile, side-by-side on desktop
- Charts: stacked on mobile

---

## Screen 5: Leads — /leads

### Purpose
Full lead management with filtering, sorting, bulk actions, and detail drawer.

### Layout
```
+------+----------------------------------------------+
|      |  Leads                              Bell (*) |
| LEAD +----------------------------------------------+
| PULSE|                                              |
|      |  +----------------------------------------+  |
|------|  | Search leads...     [Filters v]        |  |
|      |  |                     [Export >]          |  |
| Dash |  +----------------------------------------+  |
| Lead |                                              |
| Filt |  +----------------------------------------+  |
| Intl |  | [] | Lead          |Source |Status|Score|  |
| Jobs |  |----+---------------+-------+------+-----|  |
| Sett |  | [] | Jane Smith    |linkd  | NEW  |85.5 |  |
|      |  |    | TechCorp      |       |      |     |  |
|      |  |----+---------------+-------+------+-----|  |
|      |  | [] | Raj Kumar     |reddit |QUAL  |72.0 |  |
|      |  |    | StartupXYZ    |       |      |     |  |
|      |  |----+---------------+-------+------+-----|  |
|      |  | [] | Sarah Chen    |g_maps | NEW  |68.5 |  |
|      |  |    | MapCo         |       |      |     |  |
|      |  +----------------------------------------+  |
|      |                                              |
|------|  < 1 2 3 ... 8 >   Showing 1-20 of 156      |
+------+----------------------------------------------+
```

### Filter Panel (collapsible)
```
+----------------------------------------+
| Filters                          [Clear]|
|                                        |
| Status: [NEW] [QUALIFIED] [CONTACTED]  |
| Source: [LinkedIn] [Google Maps] [Reddit|
| Date:   [From ___] [To ___]           |
| Tags:   [tag1] [tag2] [+ Add]         |
| Score:  [Min ___] [Max ___]           |
|                                        |
| [Apply Filters]                        |
+----------------------------------------+
```

### Lead Detail Drawer (slides in from right on row click)
```
+--------------------------+
|  < Back     Jane Smith   |
|                          |
|  CTO at TechCorp         |
|  Mumbai, India           |
|                          |
|  Status: [QUALIFIED v]   |
|  Score:  85.5            |
|  Tags:   [saas] [+ Add] |
|                          |
|  -- Contact --           |
|  jane@techcorp.com       |
|  +91-9876543210          |
|  linkedin.com/in/jane    |
|  techcorp.com            |
|                          |
|  -- Discovery --         |
|  Source: LinkedIn         |
|  Filter: Series A CTOs   |
|  Found: Mar 5, 2026      |
|  Intent: Series A funding|
|                          |
|  -- Timeline --          |
|  * Mar 5: Status > QUAL  |
|  * Mar 5: Discovered     |
|                          |
|  -- Raw Data --          |
|  { "snippet": "..." }   |
|                          |
+--------------------------+
```

### States
- **Empty:** "No leads found. Create a search filter to start discovering." with illustration
- **Loading:** Skeleton table rows (8 rows)
- **Filtered empty:** "No leads match your filters." with [Clear Filters] button
- **Bulk selected:** Floating action bar at bottom: "3 selected — [Update Status] [Add Tags] [Export]"

### Responsive
- Mobile: Card-based list view (not table), swipe actions
- Tablet: Condensed table, detail opens as full-screen overlay
- Desktop: Table with slide-out drawer

---

## Screen 6: Search Filters — /search-filters

### Purpose
Manage lead discovery targeting rules.

### Layout
```
+------+----------------------------------------------+
|      |  Search Filters                     Bell (*) |
| LEAD +----------------------------------------------+
| PULSE|                                              |
|      |  [+ New Filter]                              |
|      |                                              |
|      |  +----------------------------------------+  |
|      |  | Series A CTOs in India         * Active|  |
|      |  | linkedin . 1,440min . 156 leads        |  |
|      |  | Last run: 2h ago . success              |  |
|      |  |                    [Run Now] [Edit] [:]  |  |
|      |  +----------------------------------------+  |
|      |                                              |
|      |  +----------------------------------------+  |
|      |  | B2B Marketing Leaders          o Paused|  |
|      |  | linkedin, reddit . manual . 43 leads   |  |
|      |  | Last run: 3d ago . success              |  |
|      |  |                    [Run Now] [Edit] [:]  |  |
|      |  +----------------------------------------+  |
|      |                                              |
+------+----------------------------------------------+
```

### Create/Edit Filter — /search-filters/new or /search-filters/[id]
```
+--------------------------------------+
|  Create Search Filter                |
|                                      |
|  Name:                               |
|  +------------------------------+   |
|  | Series A CTOs in India       |   |
|  +------------------------------+   |
|                                      |
|  Description (optional):            |
|  +------------------------------+   |
|  | Find CTO/VP Eng at startups  |   |
|  +------------------------------+   |
|                                      |
|  -- Sources --                       |
|  [x] LinkedIn                        |
|  [ ] Google Maps                     |
|  [ ] Reddit                          |
|                                      |
|  -- Targeting --                     |
|  Keywords:                           |
|  [Series A] [CTO] [+ Add]           |
|                                      |
|  Job Titles:                         |
|  [CTO] [VP Engineering] [+ Add]     |
|                                      |
|  Industries:                         |
|  [Software Development] [+ Add]     |
|                                      |
|  Location:                           |
|  +------------------------------+   |
|  | India                        |   |
|  +------------------------------+   |
|                                      |
|  -- Schedule --                      |
|  Run every: [24 hours v]            |
|  or [Manual only]                    |
|                                      |
|  -- Estimated Credits --             |
|  ~10-50 credits per run              |
|                                      |
|  [Cancel]          [Save Filter >]   |
+--------------------------------------+
```

### States
- **Empty:** "No search filters yet. Create one to start discovering leads." with templates dropdown
- **Loading:** Skeleton cards (3)

---

## Screen 7: Jobs — /jobs

### Purpose
Scraper job history and monitoring.

### Layout
```
+------+----------------------------------------------+
|      |  Scraper Jobs                       Bell (*) |
| LEAD +----------------------------------------------+
| PULSE|                                              |
|      | |Job ID    |Filter     |Status |Found|Time  ||
|      | |----------+-----------+-------+-----+------||
|      | | #a3f2... |Series A   |  Done | 32  |2m30s ||
|      | | #b1c4... |B2B Mkting |  Done | 11  |1m45s ||
|      | | #c9d1... |Series A   | Error |  0  |0m12s ||
|      | | #d2e5... |Real Est.  | Run.. |  8  | --   ||
|      |                                              |
+------+----------------------------------------------+
```

### States
- **Running job:** Orange pulsing dot, "Running..." status, live leadsFound counter
- **Completed:** Green checkmark, duration shown
- **Error:** Red warning icon, expandable error message

---

## Screen 8: Settings — /settings

### Purpose
Basic profile settings (Phase 1). Organization, billing, and team tabs added when going SaaS.

### Layout (Phase 1 — Internal)
```
+------+----------------------------------------------+
|      |  Settings                           Bell (*) |
| LEAD +----------------------------------------------+
| PULSE|                                              |
|      |  Profile                                     |
|      |  +--------------------------------------+    |
|      |  | Full Name: +------------------+      |    |
|      |  |            | John Doe          |      |    |
|      |  |            +------------------+      |    |
|      |  | Email:     john@example.com (readonly)|    |
|      |  |                                      |    |
|      |  | [Save Changes]                       |    |
|      |  +--------------------------------------+    |
|      |                                              |
|      |  Usage Stats (read-only, no billing)         |
|      |  +--------------------------------------+    |
|      |  | Total leads discovered: 1,560        |    |
|      |  | Total scraper runs: 48               |    |
|      |  | Total exports: 12                    |    |
|      |  +--------------------------------------+    |
|      |                                              |
+------+----------------------------------------------+
```

### Deferred Tabs (SaaS phase)
- **Organization:** Name, slug, logo, plan display
- **Billing:** Credits, Razorpay buy flow, usage history
- **Team:** Member list, invite, role management

---

## Shared Components

### Sidebar
- Fixed on desktop (w-64), slide-out on mobile
- Logo + app name at top
- Nav items: Dashboard, Leads, Search Filters, Intelligence, Jobs, Settings
- Active state: orange background (10%) + orange text + left border
- Sign Out at bottom
- Org switcher (future) above nav

### Header
- Sticky, backdrop-blur
- Breadcrumbs on left
- Notifications bell + avatar on right
- Mobile: hamburger menu replaces breadcrumbs

### Data Table (shared component)
- Column sorting (click header)
- Row selection (checkbox)
- Pagination (bottom)
- Bulk actions (floating bar when rows selected)
- Loading: skeleton rows
- Empty: centered illustration + message + CTA

### Toast Notifications
- Position: bottom-right
- Auto-dismiss: 5 seconds
- Types: success (green), error (red), info (blue), warning (yellow)
- Use sonner library

### Confirm Dialog
- Destructive actions (delete filter, remove member) show confirmation dialog
- "Are you sure?" with action description
- [Cancel] [Confirm] buttons (confirm in red for destructive)
