# API.md — LeadPulse API Contract

> Generated: 2026-03-05 | Phase 0 Documentation

---

## 1. API OVERVIEW

### Base URL
- **Development:** `http://localhost:3000/api`
- **Production:** `https://app.leadpulse.io/api`

### Versioning
URL path versioning: `/api/v1/`

### Authentication
- **Phase 1 (internal):** No auth — seed user auto-injected via middleware. All requests treated as the seed user/org.
- **Phase 1b (SaaS):** Session-based (httpOnly cookie). Magic link email -> verify token -> set session cookie. `Authorization: Bearer <session-token>` for API clients.

### Rate Limiting
| Endpoint Category | Limit |
|---|---|
| Auth (magic link send) | 5 requests / 15 minutes per email |
| Read endpoints | 100 requests / minute per org |
| Write endpoints | 30 requests / minute per org |
| Export | 10 requests / hour per org |
| Scraper triggers | 5 requests / minute per org |

### Standard Response Format
```json
{
  "success": true,
  "data": { },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Duplicate resource |
| RATE_LIMITED | 429 | Too many requests |
| INSUFFICIENT_CREDITS | 402 | Not enough credits |
| INTERNAL_ERROR | 500 | Server error |

---

## 2. AUTHENTICATION ENDPOINTS [DEFERRED — Phase 1b]

> Auth endpoints are deferred. In Phase 1, a seed user/org is auto-injected.
> These endpoints will be implemented when transitioning to SaaS.

### POST /api/v1/auth/magic-link
Send a magic link to the user's email.

**Request:**
```json
{ "email": "user@example.com" }
```

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Magic link sent to user@example.com" }
}
```

**Errors:** VALIDATION_ERROR (invalid email), RATE_LIMITED

---

### POST /api/v1/auth/verify
Verify a magic link token and create a session.

**Request:**
```json
{ "token": "abc123-magic-link-token" }
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "fullName": "John Doe"
    },
    "organization": {
      "id": "clx...",
      "name": "Acme Corp",
      "slug": "acme-corp"
    }
  }
}
```
**Side Effect:** Sets httpOnly session cookie.

**Errors:** VALIDATION_ERROR (invalid/expired token), NOT_FOUND

---

### GET /api/v1/auth/me
Get the current authenticated user and their active organization.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "fullName": "John Doe",
      "avatarUrl": null
    },
    "organization": {
      "id": "clx...",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "plan": "STARTER",
      "credits": 850,
      "role": "OWNER"
    }
  }
}
```

**Errors:** UNAUTHORIZED

---

### POST /api/v1/auth/logout
Destroy the current session.

**Response (200):**
```json
{ "success": true, "data": { "message": "Logged out" } }
```
**Side Effect:** Clears session cookie, deletes session from DB.

---

## 3. ORGANIZATION ENDPOINTS [DEFERRED — Phase 1b]

> Organization management endpoints are deferred. In Phase 1, a single seed org is used.

### GET /api/v1/organizations/current
Get the current organization details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "logoUrl": null,
    "plan": "STARTER",
    "credits": 850,
    "memberCount": 3,
    "createdAt": "2026-01-15T00:00:00Z"
  }
}
```

**Required Role:** MEMBER+

---

### PATCH /api/v1/organizations/current
Update organization settings.

**Request:**
```json
{ "name": "Acme Corp Updated", "logoUrl": "https://..." }
```

**Required Role:** ADMIN+

---

### GET /api/v1/organizations/current/members
List organization members.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "userId": "clx...",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "OWNER",
      "joinedAt": "2026-01-15T00:00:00Z"
    }
  ]
}
```

**Required Role:** MEMBER+

---

### POST /api/v1/organizations/current/members/invite
Invite a user to the organization.

**Request:**
```json
{ "email": "newuser@example.com", "role": "MEMBER" }
```

**Required Role:** ADMIN+

---

### PATCH /api/v1/organizations/current/members/:memberId
Update a member's role.

**Request:**
```json
{ "role": "ADMIN" }
```

**Required Role:** OWNER

---

### DELETE /api/v1/organizations/current/members/:memberId
Remove a member from the organization.

**Required Role:** ADMIN+ (cannot remove OWNER)

---

## 4. SEARCH FILTER ENDPOINTS

### GET /api/v1/search-filters
List all search filters for the current organization.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page |
| isActive | boolean | - | Filter by active status |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "Series A CTOs in India",
      "description": "Find CTOs at recently funded startups",
      "sources": ["linkedin"],
      "isActive": true,
      "runEveryMinutes": 1440,
      "lastRunAt": "2026-03-05T10:00:00Z",
      "lastRunStatus": "success",
      "totalRuns": 12,
      "totalLeadsFound": 156,
      "createdAt": "2026-02-01T00:00:00Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 5, "totalPages": 1 }
}
```

**Required Role:** MEMBER+

---

### POST /api/v1/search-filters
Create a new search filter.

**Request:**
```json
{
  "name": "Series A CTOs in India",
  "description": "Find CTOs at recently funded startups",
  "sources": ["linkedin", "google_maps"],
  "query": {
    "keywords": ["Series A", "CTO"],
    "jobTitles": ["CTO", "VP Engineering"],
    "industries": ["Software Development"],
    "location": "India"
  },
  "runEveryMinutes": 1440,
  "isActive": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { "id": "clx...", "name": "Series A CTOs in India" }
}
```

**Required Role:** MEMBER+
**Credits:** None (creating a filter is free; running it costs credits)

---

### GET /api/v1/search-filters/:id
Get a single search filter with details.

**Required Role:** MEMBER+

---

### PATCH /api/v1/search-filters/:id
Update a search filter.

**Request:** Partial body (any field from POST)

**Required Role:** MEMBER+

---

### DELETE /api/v1/search-filters/:id
Delete a search filter.

**Required Role:** ADMIN+

---

### POST /api/v1/search-filters/:id/run
Manually trigger a scraper run for this filter.

**Response (202):**
```json
{
  "success": true,
  "data": {
    "jobId": "clx...",
    "message": "Scraper job queued",
    "estimatedCredits": 10
  }
}
```

**Required Role:** MEMBER+
**Credits:** Deducted per lead discovered

---

## 5. LEAD ENDPOINTS

### GET /api/v1/leads
List leads for the current organization.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page (max 100) |
| status | string | - | Filter by status (comma-separated) |
| source | string | - | Filter by source |
| searchFilterId | string | - | Filter by search filter |
| search | string | - | Search by name, company, email |
| sortBy | string | discoveredAt | Sort field |
| sortOrder | string | desc | asc or desc |
| tags | string | - | Filter by tags (comma-separated) |
| dateFrom | string | - | ISO date |
| dateTo | string | - | ISO date |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "personName": "Jane Smith",
      "companyName": "TechCorp",
      "title": "CTO",
      "email": "jane@techcorp.com",
      "source": "linkedin",
      "sourceUrl": "https://linkedin.com/in/janesmith",
      "status": "NEW",
      "score": 85.50,
      "intentSignal": "Series A funding",
      "tags": ["high-priority", "saas"],
      "city": "Mumbai",
      "country": "India",
      "discoveredAt": "2026-03-05T08:30:00Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 156, "totalPages": 8 }
}
```

**Required Role:** MEMBER+

---

### GET /api/v1/leads/:id
Get a single lead with full details (including raw data and events).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "personName": "Jane Smith",
    "companyName": "TechCorp",
    "title": "CTO",
    "email": "jane@techcorp.com",
    "phone": "+91-9876543210",
    "website": "https://techcorp.com",
    "linkedinUrl": "https://linkedin.com/in/janesmith",
    "source": "linkedin",
    "sourceUrl": "https://linkedin.com/in/janesmith",
    "status": "QUALIFIED",
    "score": 85.50,
    "intentSignal": "Series A funding",
    "tags": ["high-priority", "saas"],
    "city": "Mumbai",
    "region": "Maharashtra",
    "country": "India",
    "raw": { "snippet": "...", "searchPosition": 3 },
    "enrichment": {},
    "discoveredAt": "2026-03-05T08:30:00Z",
    "searchFilter": { "id": "clx...", "name": "Series A CTOs" },
    "events": [
      {
        "id": "clx...",
        "type": "status_change",
        "data": { "from": "NEW", "to": "QUALIFIED" },
        "createdBy": "clx...",
        "createdAt": "2026-03-05T10:00:00Z"
      }
    ]
  }
}
```

**Required Role:** MEMBER+

---

### PATCH /api/v1/leads/:id
Update a lead (status, score, tags, notes).

**Request:**
```json
{
  "status": "QUALIFIED",
  "score": 85.50,
  "tags": ["high-priority", "saas"]
}
```

**Side Effect:** Creates a LeadEvent for audit trail.

**Required Role:** MEMBER+

---

### PATCH /api/v1/leads/bulk
Bulk update leads.

**Request:**
```json
{
  "leadIds": ["clx1", "clx2", "clx3"],
  "update": { "status": "CONTACTED", "tags": ["outreach-wave-1"] }
}
```

**Required Role:** MEMBER+

---

### POST /api/v1/leads/export
Export leads as CSV.

**Request:**
```json
{
  "filters": {
    "status": ["NEW", "QUALIFIED"],
    "source": "linkedin",
    "dateFrom": "2026-03-01"
  },
  "leadIds": [],
  "columns": ["personName", "companyName", "title", "email", "phone", "source", "status"]
}
```

**Response (200):** CSV file download (Content-Type: text/csv)

**Required Role:** MEMBER+
**Credits:** 1 credit per 100 leads exported

---

## 6. JOB ENDPOINTS

### GET /api/v1/jobs
List scraper jobs for the current organization.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page |
| status | string | - | Filter by status |
| searchFilterId | string | - | Filter by search filter |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "searchFilterId": "clx...",
      "searchFilterName": "Series A CTOs",
      "status": "SUCCESS",
      "source": "linkedin",
      "leadsFound": 45,
      "leadsNew": 32,
      "creditsUsed": 32,
      "startedAt": "2026-03-05T10:00:00Z",
      "completedAt": "2026-03-05T10:02:30Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 50, "totalPages": 3 }
}
```

**Required Role:** MEMBER+

---

### GET /api/v1/jobs/:id
Get job details.

**Required Role:** MEMBER+

---

## 7. BILLING ENDPOINTS [DEFERRED — Phase 1b]

> Billing/payment endpoints are deferred. UsageRecords are written but no credit limits enforced.

### GET /api/v1/billing/usage
Get credit usage summary.

**Query Parameters:** dateFrom, dateTo

**Response (200):**
```json
{
  "success": true,
  "data": {
    "credits": {
      "total": 1000,
      "used": 150,
      "remaining": 850
    },
    "usage": [
      { "date": "2026-03-05", "type": "lead_discovered", "credits": 32 },
      { "date": "2026-03-04", "type": "scraper_run", "credits": 5 }
    ]
  }
}
```

**Required Role:** MEMBER+

---

### POST /api/v1/billing/create-order
Create a Razorpay order for purchasing credits.

**Request:**
```json
{ "credits": 1000 }
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz",
    "amount": 99900,
    "currency": "INR",
    "credits": 1000
  }
}
```

**Required Role:** ADMIN+

---

### POST /api/v1/billing/verify-payment
Verify Razorpay payment and credit the organization.

**Request:**
```json
{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_xyz",
  "razorpay_signature": "sig_xyz"
}
```

**Required Role:** ADMIN+
**Side Effect:** Credits added to organization, UsageRecord created

---

### POST /api/v1/webhooks/razorpay
Razorpay webhook for payment events.

**Headers:** `X-Razorpay-Signature` for verification
**No Auth Required** (verified via webhook signature)

---

## 8. DASHBOARD / STATS ENDPOINTS

### GET /api/v1/dashboard/stats
Get dashboard overview statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalLeads": 1560,
    "newLeadsToday": 45,
    "activeFilters": 5,
    "creditsRemaining": 850,
    "leadsByStatus": {
      "NEW": 800,
      "QUALIFIED": 400,
      "CONTACTED": 200,
      "WON": 100,
      "LOST": 60
    },
    "leadsBySource": {
      "linkedin": 900,
      "google_maps": 400,
      "reddit": 260
    },
    "recentActivity": [
      {
        "type": "scraper_complete",
        "message": "Found 32 new leads from 'Series A CTOs'",
        "timestamp": "2026-03-05T10:02:30Z"
      }
    ]
  }
}
```

**Required Role:** MEMBER+

---

## 9. HEALTH CHECK

### GET /api/health
**No Auth Required**

**Response (200):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-03-05T12:00:00Z"
}
```
