# API Catalogue: As-Is Inventory & Target Architecture Catalogue

**Document Reference:** NEX-API-CAT-v1.0  
**Project:** Nexucon Company Website & Marketing CMS Platform  
**Target Release:** Production Launch  
**Standard Response Contract:** Enforced  

---

## 1. Architectural Standards & Response Envelopes

All custom Next.js Route Handlers, Careers APIs, and integration adapters must strictly adhere to the unified standard JSON response format.

### Standard Success Response Schema (`application/json`)
```json
{
  "success": true,
  "correlationId": "req_01HXYZ7890ABCDEF12345678",
  "message": "Operation completed successfully.",
  "data": {},
  "errors": []
}
```

### Standard Error Response Schema (`application/json`)
```json
{
  "success": false,
  "correlationId": "req_01HXYZ7890ABCDEF12345678",
  "message": "Validation failed on the submitted payload.",
  "data": null,
  "errors": [
    {
      "field": "email",
      "code": "INVALID_EMAIL_FORMAT",
      "message": "The provided email address is not RFC 5322 compliant."
    }
  ]
}
```

---

## 2. As-Is API Inventory (Verified from Repository Codebase)

The following APIs were inspected and verified in the current repository (`app/api/*`, `app/admin/*`, and Server Actions).

| Endpoint & Method | Verified File Path | Authentication & Session | As-Is Behavior & Data Source | Current Limitations | Target Architecture Disposition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST `/api/auth/login`** | `app/api/auth/login/route.ts` | Public (Verifies email + bcrypt hash) | Queries `UserModel` (or memory fallback); signs a 7-day HS256 JWT using `jose` and sets HTTP-only `session` cookie. | No rate limiting; default admin credentials hardcoded in UI; no MFA; fixed 7-day expiration without revocation list. | **REPLACE:** Retire completely in favor of Strapi Admin native auth and Microsoft Entra ID (Azure AD SSO) for internal users. |
| **POST `/api/auth/logout`** | `app/api/auth/logout/route.ts` | Public (Clears cookie) | Sets `session` cookie with `maxAge: 0`. | Client-side cookie clear only; does not invalidate JWT token server-side. | **REPLACE:** Migrate to standard NextAuth / Entra ID logout and Strapi session termination. |
| **GET `/api/content`** | `app/api/content/route.ts` | Public (Query param `?slug=...`) | Calls `getPageBySlug(slug)` against `ContentPageModel` or `memoryStore.pages`. | No cache headers; dynamic query on every request; no pagination; unindexed lookup. | **REPLACE:** Replace with Strapi 5 Content API (`/api/pages?filters[slug][$eq]=...`) utilizing Next.js Tag-based ISR caching. |
| **POST `/api/content`** | `app/api/content/route.ts` | Requires `session` cookie (`requireUserSession`) | Parses payload; validates JSON schema if present; creates or updates page in `ContentPageModel`. | No field-level permissions; any logged-in user can overwrite any page; no draft/publish state; no audit log. | **REPLACE:** Replace with Strapi 5 Content Manager (REST/GraphQL) with Draft & Publish workflow. |
| **POST `/api/enquiries`** | `app/api/enquiries/route.ts` | Public | Validates `name`, `email`, `message`; creates document in `EnquiryModel`. | No bot protection (Turnstile/reCAPTCHA); no rate limiting; no CRM forwarding; no email notification; no UTM parameter capture. | **REPLACE:** Replace with `/api/leads` incorporating Cloudflare Turnstile, UTM enrichment, and CRM Outbox dispatch. |
| **POST `/api/upload`** | `app/api/upload/route.ts` | Requires `session` cookie (`requireUserSession`) | Accepts multipart file (max 8MB, MIME allowlist); writes to local disk `public/uploads/<uuid>.<ext>`; saves metadata to `MediaAssetModel`. | Ephemeral local disk storage breaks in Azure App Service; SVG allowed without sanitization (XSS risk); no binary magic-byte verification. | **REPLACE:** Replace with Strapi 5 Media Library backed by Azure Blob Storage. Careers resumes route through dedicated private upload endpoint. |
| **POST `/api/analytics`** | `app/api/analytics/route.ts` | Public (Client tracker beacon) | Records `{ event, path, referrer, userAgent, metadata }` to `AnalyticsEventModel`. | High database write volume; no bot filtering; lacks GDPR cookie consent check; hardcoded 100 SEO score on dashboard. | **REPLACE:** Deprecate custom endpoint in favor of Google Analytics 4 (GA4) via GTM and Azure Application Insights for server telemetry. |
| **POST `/admin/create-user`** | `app/admin/create-user/route.ts` | Requires `session` cookie (`requireUserSession`) | Hashes password with bcrypt (10 rounds); creates record in `UserModel` with role 'admin'\|'editor'\|'marketing'. | No password complexity validation; no role enforcement (all roles have identical access); no user deletion or password reset. | **REPLACE:** Decommission. Strapi handles marketing users; Microsoft Entra ID handles internal employees. |
| **POST `/admin/save-settings`** | `app/admin/save-settings/route.ts` | Requires `session` cookie (`requireUserSession`) | Accepts form data; overwrites `SiteSettingsModel` including legacy `headerCode` (`<!-- header.php -->`). | Legacy PHP code stored in database; single global settings record; no rollback history. | **REPLACE:** Replace with Strapi 5 Single Type for Global Site Settings. |
| **Server Actions in `actions.ts`** | `app/admin/actions.ts` | Server Action handlers | `saveSiteSettingsAction`, `createUserAction`, `submitLeadAction`. | Duplicates route logic; lacks transactional boundaries; tightly coupled to prototype UI. | **REPLACE:** Remove entirely upon Strapi 5 and Careers API cutover. |

---

## 3. Target API Catalogue (To-Be Architecture)

The target API ecosystem is divided into three distinct operational domains:
1. **Public Web & Edge APIs (Next.js Backend-for-Frontend - BFF)**
2. **Careers & Recruitment APIs (Decoupled Next.js Engine)**
3. **Integration Gateways (ATS & CRM Connectors)**
4. **Marketing Headless CMS APIs (Strapi 5 Managed)**

```
                                  +-----------------------+
                                  |    Cloudflare Edge    |
                                  +-----------+-----------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
       +----------------------------+                    +----------------------------+
       |   Next.js BFF & Edge APIs  |                    |      Strapi 5 CMS APIs     |
       |  - /api/leads              |                    |  - /api/pages              |
       |  - /api/careers/*          |                    |  - /api/services           |
       |  - /api/revalidate         |                    |  - /api/blogs              |
       |  - /api/draft              |                    |  - /api/upload             |
       +--------------+-------------+                    +--------------+-------------+
                      |                                                 |
         +------------+------------+                                    |
         |                         |                                    |
         v                         v                                    v
+------------------+     +-------------------+                 +-------------------+
|  Corporate CRM   |     |   Corporate ATS   |                 | PostgreSQL Flex & |
|   REST Gateway   |     |   REST Gateway    |                 | Public Media Blob |
+------------------+     +-------------------+                 +-------------------+
```

---

### Domain A: Public Web & Edge APIs (Next.js BFF)

#### API-WEB-01: Inbound Lead & Contact Submission
* **Route & Method:** `POST /api/leads`
* **Purpose:** Ingests contact enquiries, advisory requests, and campaign landing page submissions. Enriches data with UTM parameters and dispatches to corporate CRM.
* **Consumer:** Public Website Visitors (`/contact`, landing pages).
* **Authentication:** None (Public). Protected by Cloudflare Turnstile token verification.
* **Authorization Role:** Anonymous / Public.
* **Request Schema (`application/json`):**
  ```json
  {
    "turnstileToken": "0.X.ABCDEF...",
    "fullName": "Jane Doe",
    "email": "jane.doe@enterprise.com",
    "company": "Acme Global",
    "phone": "+44 20 7946 0958",
    "serviceInterest": "SAP Modernization",
    "message": "Requesting consultation regarding S/4HANA migration timeline.",
    "attribution": {
      "utmSource": "linkedin",
      "utmMedium": "paid-social",
      "utmCampaign": "sap-q4-accelerator",
      "utmTerm": "enterprise-sap",
      "utmContent": "banner-ad-3",
      "landingPage": "https://nexucon.com/services/sap",
      "referrer": "https://linkedin.com/"
    }
  }
  ```
* **Response Schema (`201 Created`):**
  ```json
  {
    "success": true,
    "correlationId": "lead_01HZY98A7B6C",
    "message": "Enquiry received. An enterprise architect will respond within 24 hours.",
    "data": { "leadId": "lead_01HZY98A7B6C", "status": "RECEIVED" },
    "errors": []
  }
  ```
* **Validation Rules:** Zod schema validation: `turnstileToken` mandatory; `fullName` min 2 chars; `email` valid format; `message` min 10 chars, max 2000 chars.
* **Rate Limiting:** 5 requests per IP per 10-minute window via Edge middleware.
* **Idempotency:** Unique composite key `hash(email + message + date)` cached for 5 minutes to prevent double submission.
* **Audit Requirement:** Log event to Application Insights: `LeadSubmissionReceived` (PII masked: email logged as `j***e@enterprise.com`).
* **Target Release:** Release 2 (Integrated Beta).

---

#### API-WEB-02: On-Demand Cache Revalidation Webhook
* **Route & Method:** `POST /api/revalidate`
* **Purpose:** Invoked by Strapi 5 webhooks upon content publication, update, or deletion to invalidate Next.js ISR tag caches.
* **Consumer:** Strapi 5 CMS Webhook Engine.
* **Authentication:** Bearer Secret Token in `Authorization: Bearer <REVALIDATION_SECRET>`.
* **Authorization Role:** Service Identity (Strapi Webhook).
* **Request Schema (`application/json`):**
  ```json
  {
    "event": "entry.publish",
    "model": "service",
    "entry": {
      "id": 14,
      "slug": "sap-modernization",
      "tags": ["sap", "services"]
    }
  }
  ```
* **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "correlationId": "rev_89AB12CD",
    "message": "Cache successfully purged for tags: ['services', 'service-sap-modernization']",
    "data": { "revalidated": true, "timestamp": "2026-09-22T14:30:00Z" },
    "errors": []
  }
  ```
* **Validation Rules:** Header `Authorization` must match Azure Key Vault secret `NEXT_REVALIDATION_SECRET`.
* **Rate Limiting:** Max 100 requests per minute from Strapi IP range.
* **Idempotency:** Safe to replay (idempotent cache purge).
* **Audit Requirement:** Log model, slug, and revalidated tags to Application Insights.
* **Target Release:** Release 1 (CMS-Connected Alpha).

---

#### API-WEB-03: Next.js Draft Mode Preview Toggle
* **Route & Method:** `GET /api/draft?secret=<PREVIEW_SECRET>&slug=<SLUG>&type=<MODEL>`
* **Purpose:** Enables Next.js Draft Mode (`draftMode().enable()`) and sets secure preview cookie, allowing editors to view unpublished Strapi drafts on live layouts.
* **Consumer:** Strapi Content Preview Button.
* **Authentication:** Secret query token validated against Key Vault.
* **Authorization Role:** Marketing Content Author / Editor.
* **Response:** Redirect (`307 Temporary Redirect`) to requested content slug with preview cookie enabled.
* **Target Release:** Release 1.

---

### Domain B: Careers & Recruitment APIs (Decoupled Engine)

#### API-CAR-01: Public Job Requisition Feed
* **Route & Method:** `GET /api/careers/jobs`
* **Purpose:** Returns active, published job openings with filtering (practice area, location, remote status) and pagination.
* **Consumer:** Public Careers Portal (`/careers`).
* **Authentication:** None (Public).
* **Cache Strategy:** Edge cached with 15-minute ISR tag (`careers-list`).
* **Query Parameters:** `?department=SAP&location=London&type=FullTime&page=1&limit=10`
* **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "correlationId": "car_01A89F",
    "message": "Active jobs retrieved.",
    "data": {
      "total": 12,
      "page": 1,
      "pageSize": 10,
      "jobs": [
        {
          "id": "req_01HPX7",
          "title": "Principal SAP S/4HANA Solution Architect",
          "slug": "principal-sap-s4hana-architect",
          "practiceArea": "SAP Modernization",
          "location": "London, UK",
          "remotePolicy": "Hybrid",
          "employmentType": "Full-Time",
          "publishedAt": "2026-09-20T09:00:00Z",
          "closingDate": "2026-10-31T23:59:59Z"
        }
      ]
    },
    "errors": []
  }
  ```
* **Target Release:** Release 2.

---

#### API-CAR-02: Public Job Requisition Detail
* **Route & Method:** `GET /api/careers/jobs/[slug]`
* **Purpose:** Returns detailed job description, responsibilities, requirements, and metadata for a single requisition.
* **Consumer:** Job Detail Page (`/careers/[slug]`).
* **Authentication:** None (Public).
* **Response:** Detailed JSON job object including structured `JobPosting` schema markup.
* **Target Release:** Release 2.

---

#### API-CAR-03: Candidate Application & Resume Submission
* **Route & Method:** `POST /api/careers/apply`
* **Purpose:** Receives candidate application data and resume file. Validates file binary signatures, stores resume in private Azure Blob Storage, creates application record, and queues ATS synchronization.
* **Consumer:** Candidate Application Form on Job Detail page.
* **Authentication:** None (Public). Enforced by Cloudflare Turnstile.
* **Request Content-Type:** `multipart/form-data`
  * `jobId` (string, required)
  * `candidateName` (string, required)
  * `candidateEmail` (string, required, valid RFC email)
  * `candidatePhone` (string, required)
  * `linkedinUrl` (string, optional)
  * `consentDataProcessing` (boolean, required: `true`)
  * `turnstileToken` (string, required)
  * `resume` (Binary File: PDF or DOCX, max 5MB)
* **Response Schema (`201 Created`):**
  ```json
  {
    "success": true,
    "correlationId": "app_01HZP876",
    "message": "Your application has been received successfully.",
    "data": {
      "applicationId": "app_01HZP876",
      "status": "SUBMITTED",
      "timestamp": "2026-09-22T14:35:00Z"
    },
    "errors": []
  }
  ```
* **Security & File Rules:**
  1. Inspect binary magic bytes in memory: reject if magic bytes do not match `PDF` (`%PDF-`) or `DOCX` (`PK\x03\x04`).
  2. Reject files exceeding 5,242,880 bytes (5MB).
  3. Write file to private Azure Blob container (`resumes-private`) with random UUID key: `resumes-private/2026/09/<uuid>.pdf`.
  4. Candidate data is strictly excluded from Strapi and saved to the dedicated Careers PostgreSQL database.
* **Target Release:** Release 2.

---

#### API-CAR-04: Authorized Resume Download SAS Generator
* **Route & Method:** `GET /api/careers/admin/applications/[id]/resume-url`
* **Purpose:** Generates a temporary, 15-minute Azure Shared Access Signature (SAS) download URL for authorized recruitment staff.
* **Consumer:** Internal Careers Administration Portal.
* **Authentication:** Microsoft Entra ID Bearer Token / Authorized Session.
* **Authorization Role:** `Recruiter`, `Recruitment_Admin`.
* **Response Schema (`200 OK`):**
  ```json
  {
    "success": true,
    "correlationId": "sas_0912BC",
    "message": "Temporary resume download URL generated.",
    "data": {
      "downloadUrl": "https://stnexuconresumes.blob.core.windows.net/resumes-private/2026/09/uuid.pdf?sp=r&st=...&se=...&spr=https&sig=...",
      "expiresAt": "2026-09-22T14:50:00Z"
    },
    "errors": []
  }
  ```
* **Audit Requirement:** Log audit event `CandidateResumeDownloaded` with `RecruiterId`, `CandidateId`, and `Timestamp`.
* **Target Release:** Release 2.

---

### Domain C: Integration Gateways (ATS & CRM Connectors)

#### API-INT-01: ATS Inbound Job Requisition Webhook
* **Route & Method:** `POST /api/integrations/ats/jobs`
* **Purpose:** Receives job lifecycle updates (create, update, close) from Nexucon's existing ATS.
* **Consumer:** ATS Webhook Dispatcher.
* **Authentication:** HMAC SHA-256 Signature in header `X-Nexucon-ATS-Signature`.
* **Request Schema (`application/json`):**
  ```json
  {
    "event": "JOB_REQUISITION_UPDATED",
    "externalRequisitionId": "ATS-REQ-2026-881",
    "title": "Senior AI Platforms Engineer",
    "status": "OPEN",
    "practiceArea": "AI & Data Analytics",
    "location": "London / Remote",
    "jobDescriptionHtml": "<p>Nexucon is expanding its AI practice...</p>",
    "requirements": ["Python", "PyTorch", "Kubernetes", "Azure AI"],
    "closingDate": "2026-11-15T23:59:59Z"
  }
  ```
* **Processing:** Upserts record in Careers database; triggers Next.js cache revalidation for tag `careers-list` and `career-senior-ai-platforms-engineer`.
* **Target Release:** Release 2.

---

#### API-INT-02: Outbound CRM Dispatch Adapter
* **Target System:** Nexucon Corporate Lead Management Portal (`https://crm-api.nexucon.internal/v1/leads`).
* **Direction:** Outbound HTTPS REST call from Next.js server-side worker.
* **Authentication:** API Key passed in `X-Nexucon-CRM-Key` (retrieved from Azure Key Vault).
* **Payload Contract:**
  ```json
  {
    "sourceSystem": "nexucon-public-website",
    "leadExternalId": "lead_01HZY98A7B6C",
    "leadType": "CONSULTATION_REQUEST",
    "contact": {
      "fullName": "Jane Doe",
      "email": "jane.doe@enterprise.com",
      "phone": "+44 20 7946 0958",
      "company": "Acme Global"
    },
    "requirements": {
      "practiceDomain": "SAP Modernization",
      "notes": "Requesting consultation regarding S/4HANA migration timeline."
    },
    "telemetry": {
      "utmSource": "linkedin",
      "utmCampaign": "sap-q4-accelerator",
      "landingPage": "https://nexucon.com/services/sap",
      "ipAddress": "198.51.100.45",
      "submittedAt": "2026-09-22T14:30:15Z"
    }
  }
  ```
* **Retry Policy:** Exponential backoff (1s, 5s, 30s, 5m, 30m). Failed leads remain in `FAILED_DISPATCH` state in PostgreSQL outbox table, triggering an Application Insights severity-2 alert.
* **Target Release:** Release 2.

---

### Domain D: Marketing Headless CMS APIs (Strapi 5 Managed)

All content APIs are provided directly by Strapi 5 running on Azure App Service and consumed server-side by Next.js React Server Components.

| Endpoint & Method | Purpose | Consumer | Auth & Headers | Caching in Next.js |
| :--- | :--- | :--- | :--- | :--- |
| **GET `/api/global-setting`** | Fetches site title, navigation menus, social links, footer data, and default SEO schemas. | Next.js Root Layout (`layout.tsx`) | Strapi API Read Token (`Authorization: Bearer <STRAPI_READ_TOKEN>`) | ISR: Tag `global-settings` (Revalidated on demand via webhook). |
| **GET `/api/pages`** | Fetches marketing landing pages by slug with populated dynamic sections. | Next.js Page Router (`app/[...slug]/page.tsx`) | Strapi API Read Token | ISR: Tag `page-[slug]` (Revalidated on demand via webhook). |
| **GET `/api/services`** | Fetches practice area services (SAP, AI, Cloud, Enterprise Modernization, Staff Augmentation). | Next.js Service Templates (`app/services/*`) | Strapi API Read Token | ISR: Tag `services`, `service-[slug]`. |
| **GET `/api/blogs`** | Fetches published thought leadership articles with author relations and tags. | Next.js Blog Templates (`app/insights/*`) | Strapi API Read Token | ISR: Tag `blogs`, `blog-[slug]`. |
| **GET `/api/case-studies`** | Fetches enterprise transformation case studies with client impact metrics. | Next.js Case Study Templates (`app/work/*`) | Strapi API Read Token | ISR: Tag `case-studies`. |
| **GET `/api/redirects`** | Fetches vanity redirect rules configured by digital marketing. | Next.js Middleware / Route cache | Strapi API Read Token | In-memory edge cache with 1-hour fallback. |
| **POST `/api/upload`** | Uploads public marketing media assets to Azure Blob Storage container (`media-public`). | Strapi Admin Content Editors | Strapi Session / Admin JWT | Direct Azure Blob Storage commit via `@strapi/provider-upload-azure-storage`. |

---

## 4. Legacy API Retirement Schedule

| Legacy Route | Current Implementation | Action Plan | Deprecation Phase | Complete Decommissioning Date |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | Custom bcrypt + `jose` JWT | Replace with Strapi Admin & Microsoft Entra ID | Release 1 | Release 3 Cutover |
| `POST /api/auth/logout` | Session cookie clear | Replace with NextAuth / Entra ID | Release 1 | Release 3 Cutover |
| `GET /api/content` | Mongoose page lookup | Replace with Strapi 5 Content API | Release 1 | Release 3 Cutover |
| `POST /api/content` | Mongoose page create/update | Replace with Strapi Content Manager | Release 1 | Release 3 Cutover |
| `POST /api/enquiries` | Unprotected enquiry creation | Replace with `/api/leads` + CRM gateway | Release 2 | Release 3 Cutover |
| `POST /api/upload` | Ephemeral local disk upload | Replace with Strapi Azure Blob Provider | Release 1 | Release 3 Cutover |
| `POST /api/analytics` | Database event logging | Replace with GA4 / GTM / App Insights | Release 2 | Release 3 Cutover |
| `POST /admin/create-user` | Custom user creation | Replace with Strapi User RBAC & Entra ID | Release 1 | Release 3 Cutover |
| `POST /admin/save-settings` | Custom settings override | Replace with Strapi Global Settings | Release 1 | Release 3 Cutover |
