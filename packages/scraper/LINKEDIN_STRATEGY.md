# LinkedIn Scraping Strategy - LeadPulse

## 1. Stealth Infrastructure Research (2026 Comparison)

LinkedIn has aggressive anti-bot measures including TLS fingerprinting, behavioral analysis, and network reputation checks.

### Comparison Table

| Provider | Stealth Rating | Best For | Pros | Cons |
| :--- | :--- | :--- | :--- | :--- |
| **ScrapingBee** | ⭐⭐⭐⭐ | High-volume API calls | Excellent JS rendering, automatic proxy rotation, handles CAPTCHAs well. | Can get expensive for very high volumes; occasional blocks on LinkedIn. |
| **Bright Data** | ⭐⭐⭐⭐⭐ | Most resilient (Residential) | World-class proxy network (72M+ IPs), dedicated LinkedIn Scraper API, browser automation support. | High complexity, premium pricing, strict KYC for residential proxies. |
| **Apify** | ⭐⭐⭐⭐ | Managed Cloud Actors | Pre-built LinkedIn scrapers, easy scaling, integrated storage. | Reliant on community/official scraper updates when LinkedIn changes DOM. |

### Recommendation: **Bright Data (Scraper API + Residential Proxies)**
For LeadPulse, we will use an **Adapter Pattern** that defaults to **Bright Data**'s Scraper API or ScrapingBee as a secondary, as they provide the most robust "stealth" layer (header management, TLS spoofing, and IP rotation) without managing a custom browser farm.

---

## 2. Scraping Flow & Intent Signals

We don't just "scrape profiles"; we hunt for **intent signals** that indicate a company is in a buying or hiring phase.

### Intent Signals Identification
1.  **"Hiring" Banners/Status:** Founders or HR heads with the `#Hiring` frame.
2.  **Recent Job Postings:** Scraping the "Jobs" section of a company page to identify expansion (e.g., hiring for Sales indicates they need lead gen tools).
3.  **Specific Keywords in Posts:** Monitoring posts for phrases like *"Looking for recommendations for..."*, *"Scaling our team..."*, or *"Just raised..."*.
4.  **Profile Promotions:** Target leads who recently started a new role (highest receptivity to new tools).

### The Flow
1.  **Search Phase:** Triggered by `SearchFilter`. Input: Job Title + Industry + Location.
2.  **Extraction Phase:** Use the Stealth Adapter to fetch search result pages.
3.  **Signal Analysis:** Parse profile metadata for "Hiring" flags or recent activity.
4.  **Persistence:** Pipe to `leads` table with deduplication on `(ownerId, source, externalId)`.

---

## 4. Industry-Specific Intent Signals (Phase 1 Research)

For the initial targeting phase, we focus on the following niches and their specific signals:

| Niche | Primary Intent Signals | Target Personas |
| :--- | :--- | :--- |
| **Series A Companies** | Recent funding announcements, hiring for "Head of Growth", "Sales Development", or "Founding AE" roles. Keywords: "Scaling", "Series A", "Expansion". | Founders, VPs of Sales, Head of People |
| **B2B Companies** | Promoting webinars, case studies, or whitepapers. Hiring for "Customer Success" or "Partnership Managers". Posts about "Go-to-Market" strategies. | Marketing Directors, Sales Ops, CEOs |
| **Manufacturing** | Mentions of "Industry 4.0", "Digitization", "Supply Chain Optimization", or "AI Integration". Hiring for "Continuous Improvement" or "Digital Transformation" roles. | Operations Managers, CTOs, Plant Managers |
| **Real Estate** | Hiring "Head of Sales", "Leasing Directors", or "Property Acquisitions". Mentions of "Market Expansion", "PropTech", or "Development Projects". | Managing Directors, Sales Directors, Brokers |
| **Finance** | Announcements regarding "Compliance Tech", "FinTech Innovation", or "Asset Management Expansion". Hiring for "Risk Management", "Product Managers (FinTech)". | CFOs, Head of Product, Compliance Officers |

---

## 5. Technical Design

### Adapter Pattern
We define a `LinkedInAdapter` interface. This allows us to swap between `BrightData`, `ScrapingBee`, or even a `PuppeteerStealth` (local) implementation without changing the worker logic.

### Deduplication Logic
The worker uses the Prisma `uq_leads_owner_source_external` constraint.
- **Source:** `linkedin`
- **ExternalID:** The LinkedIn Profile URN or Public ID.
- **Strategy:** `upsert` or `createMany` with `skipDuplicates`.

### Rate Limiting
Even with proxies, we must mimic human behavior:
- Random delays between profile fetches.
- Maximum 50-100 profiles per "seed" search to avoid account flagging (if using session cookies).
- Priority on "logged-out" public profile scraping where possible.
