# Nexucon Website & Marketing CMS Platform: Master API Specification (v1.0)

**Document Reference:** NEX-API-SPEC-v1.0  
**Project:** Nexucon Corporate Website, Careers Engine & Headless Marketing CMS Platform  
**Target Release:** Production Launch (Releases 1, 2, 3)  
**Standard Response Contract:** Enforced  
**Classification System:**  
- `[VERIFIED-AS-IS]`: Inspected directly from source code (`nexucon.com` and `Nexucon-Main-Page`).  
- `[APPROVED-TARGET]`: Formally agreed target architecture contract.  
- `[PROPOSED]`: Recommended best-practice architectural pattern pending stakeholder sign-off.  
- `[EXAMPLE-ONLY]`: Illustrative placeholder structure.  
- `[TBD WITH OWNER]`: Unresolved external contract requiring third-party owner confirmation.  

---

## Table of Contents
1. [Executive Summary & Architecture Context](#1-executive-summary--architecture-context)
2. [Governance, Standards & Conventions](#2-governance-standards--conventions)
3. [Security & Compliance Architecture](#3-security--compliance-architecture)
4. [Data Dictionary & Global Schemas](#4-data-dictionary--global-schemas)
5. [As-Is Legacy Route Analysis & Gap Assessment](#5-as-is-legacy-route-analysis--gap-assessment)
6. [Public Web & Lead Ingestion APIs](#6-public-web--lead-ingestion-apis)
7. [Cache Invalidation & CMS Integration APIs](#7-cache-invalidation--cms-integration-apis)
8. [Careers & Recruitment APIs (Public)](#8-careers--recruitment-apis-public)
9. [Careers Administration & Secure Resume APIs](#9-careers-administration--secure-resume-apis)
10. [ATS Integration APIs](#10-ats-integration-apis)
11. [CRM & Lead Management Portal Integration APIs](#11-crm--lead-management-portal-integration-apis)
12. [Headless Marketing CMS APIs (Strapi 5 Managed)](#12-headless-marketing-cms-apis-strapi-5-managed)
13. [Analytics & Telemetry Strategy](#13-analytics--telemetry-strategy)
14. [Transactional Outbox & Resilience Patterns](#14-transactional-outbox--resilience-patterns)
15. [Performance, Caching & Edge Delivery Architecture](#15-performance-caching--edge-delivery-architecture)
16. [Rate Limiting, Throttling & DDoS Mitigation](#16-rate-limiting-throttling--ddos-mitigation)
17. [File Upload & Binary Asset Security Architecture](#17-file-upload--binary-asset-security-architecture)
18. [Database Schema & Data Models](#18-database-schema--data-models)
19. [Environment Configuration & Secret Management](#19-environment-configuration--secret-management)
20. [Error Catalogue Reference & HTTP Status Mapping](#20-error-catalogue-reference--http-status-mapping)
21. [Test Matrix Reference & QA Verification Strategy](#21-test-matrix-reference--qa-verification-strategy)
22. [Architectural Decision Register Reference](#22-architectural-decision-register-reference)
23. [Legacy API Retirement Schedule](#23-legacy-api-retirement-schedule)
24. [Field Mapping Reference](#24-field-mapping-reference)
25. [OpenAPI Specification Reference](#25-openapi-specification-reference)
26. [Implementation Phasing & Release Roadmap](#26-implementation-phasing--release-roadmap)
27. [Document Approvals, RACI Matrix & Review History](#27-document-approvals-raci-matrix--review-history)

---

## 1. Executive Summary & Architecture Context

Nexucon is executing a comprehensive replatforming of its corporate digital presence, transitioning from an unindexed prototype codebase and legacy static web forms to a unified, enterprise-grade digital ecosystem.

### Target Architectural Topology

```
                                  +-----------------------+
                                  |    Cloudflare Edge    |
                                  |  - WAF & DDoS Shield  |
                                  |  - Turnstile Captcha  |
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

### Architectural Pillars
1. **Decoupled Security Boundaries:** Candidate PII and resumes are strictly segregated from marketing CMS databases. Public marketing media lives in Azure Blob Storage; resumes reside in private encrypted containers accessible only via temporary SAS URLs.
2. **Zero-Loss Lead Guarantees:** Inbound commercial leads are committed to a local PostgreSQL Transactional Outbox before asynchronous dispatch to the corporate CRM.
3. **Sub-100ms Edge Performance:** Marketing pages leverage Next.js Tag-Based Incremental Static Regeneration (ISR) triggered by Strapi 5 publication webhooks.
4. **Strict Schema Governance:** Every endpoint enforces strongly typed Zod input schemas, uniform response envelopes, and comprehensive error mapping.

---

## 2. Governance, Standards & Conventions

### 2.1 Standard Response Envelopes

All custom Route Handlers (`app/api/*`) MUST return one of two standard JSON envelopes.

#### Success Envelope (`application/json`)
```json
{
  "success": true,
  "correlationId": "req_01HXYZ7890ABCDEF12345678",
  "message": "Operation completed successfully.",
  "data": {},
  "errors": []
}
```

#### Error Envelope (`application/json`)
```json
{
  "success": false,
  "correlationId": "req_01HXYZ7890ABCDEF12345678",
  "message": "Validation failed on the submitted payload.",
  "data": null,
  "errors": [
    {
      "field": "email",
      "code": "LEAD-EMAIL-INVALID-005",
      "message": "The provided email address is not RFC 5322 compliant."
    }
  ]
}
```

### 2.2 Standard Conventions
- **HTTP Status Codes:** Precise adherence to RFC 9110 (`200 OK`, `201 Created`, `308 Permanent Redirect`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `410 Gone`, `413 Payload Too Large`, `415 Unsupported Media Type`, `429 Too Many Requests`, `500 Internal Server Error`, `502 Bad Gateway`, `504 Gateway Timeout`).
- **Identifier Format:** ULID (`req_01HXYZ...`) or UUIDv4 for correlation IDs and business keys.
- **Date & Time:** UTC representations conforming to ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- **Case Conventions:** JSON properties use camelCase; database columns use snake_case; route paths use kebab-case.

---

## 3. Security & Compliance Architecture

1. **Bot & Spam Mitigation:** Cloudflare Turnstile integration enforced on `/api/leads` and `/api/careers/apply`. Verified sitekey: `0x4AAAAAAEzj0TBy47cuNvYY` `[VERIFIED-AS-IS]`. Secret validated server-side against `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
2. **Administrative Identity & RBAC:** Microsoft Entra ID (Azure AD SSO) for all internal recruiters and administrators. Custom prototype authentication (`/api/auth/login`) permanently decommissioned.
3. **Integration Webhook Security:** ATS webhooks require HMAC-SHA256 signature verification passed in `X-Nexucon-ATS-Signature` header, evaluated against request body and timestamp (300-second tolerance).
4. **Data Isolation & GDPR Compliance:** Candidate resumes stored in private Azure Blob container (`resumes-private`). Resumes accessible exclusively via 15-minute User Delegation SAS URLs.
5. **PII Masking in Logs:** Server telemetry strictly masks candidate and lead contact details in Azure Application Insights (`j***e@domain.com`, `+44 *** *** 0958`).

---

## 4. Data Dictionary & Global Schemas

| Entity | Core Fields | Persistence Store | PII Level |
| :--- | :--- | :--- | :--- |
| **Lead / Enquiry** | `id`, `fullName`, `email`, `phone`, `company`, `serviceInterest`, `message`, `attribution`, `status`, `createdAt` | PostgreSQL (`website_leads`) | Restricted PII |
| **SAP Consultation Lead**| `id`, `companySize`, `city`, `service`, `utmParams`, `pageUrl`, `status` | PostgreSQL (`website_leads`) | Commercial PII |
| **Job Requisition** | `id`, `externalRequisitionId`, `jobId`, `title`, `slug`, `practiceArea`, `location`, `remotePolicy`, `employmentType`, `jobDetails`, `requirements`, `salaryRange`, `closingDate`, `status` | PostgreSQL (`careers_jobs`) | Public |
| **Candidate Application**| `id`, `jobId`, `firstName`, `lastName`, `email`, `phoneNumber`, `yearsOfExperience`, `currentCTC`, `expectedCTC`, `noticePeriod`, `resumeBlobUrl`, `status`, `consentDate` | PostgreSQL (`careers_applications`) | Highly Confidential PII |
| **Resume Asset** | `id`, `blobPath`, `mimeType`, `fileSizeBytes`, `sha256Hash`, `virusScanStatus`, `uploadedAt` | Azure Blob (`resumes-private`) | Confidential File |
| **CMS Page / Service** | `id`, `slug`, `title`, `seoMetadata`, `dynamicZoneSections`, `publishedAt` | Strapi 5 PostgreSQL | Public CMS Content |

---

## 5. As-Is Legacy Route Analysis & Gap Assessment

The existing codebase contains 9 prototype routes in `app/api/*` and `app/admin/*`:

1. **`POST /api/auth/login` (`app/api/auth/login/route.ts`):** Custom bcrypt + `jose` JWT cookie. Lacks rate limiting, MFA, and revocation. **Disposition: Decommission (Return 410 Gone).**
2. **`POST /api/auth/logout` (`app/api/auth/logout/route.ts`):** Clears cookie only. **Disposition: Decommission (Return 410 Gone).**
3. **`GET /api/content` (`app/api/content/route.ts`):** MongoDB slug lookup. Lacks caching and pagination. **Disposition: Replace with Strapi 5 REST API.**
4. **`POST /api/content` (`app/api/content/route.ts`):** Unversioned page mutation. Any user can overwrite all pages. **Disposition: Replace with Strapi Content Manager.**
5. **`POST /api/enquiries` (`app/api/enquiries/route.ts`):** Unprotected form submission. No bot defense, no CRM sync. **Disposition: Redirect (308) to `/api/leads`.**
6. **`POST /api/upload` (`app/api/upload/route.ts`):** Writes files to ephemeral local disk `public/uploads/`. **Disposition: Replace with Strapi Azure Blob Provider.**
7. **`POST /api/analytics` (`app/api/analytics/route.ts`):** Heavy DB write beacon. **Disposition: Deprecate in favor of GA4/GTM.**
8. **`POST /admin/create-user` (`app/admin/create-user/route.ts`):** Local user creation. **Disposition: Decommission (Return 410 Gone).**
9. **`POST /admin/save-settings` (`app/admin/save-settings/route.ts`):** Stores legacy PHP snippets (`<!-- header.php -->`). **Disposition: Replace with Strapi Global Settings.**

---

## 6. Public Web & Lead Ingestion APIs

### API-WEB-01: Inbound Lead & Contact Submission

- **A. Identifier:** API-WEB-01
- **B. Classification:** `[APPROVED-TARGET]`
- **C. Method & Route:** `POST /api/leads`
- **D. Summary & Business Context:** Ingests contact enquiries, SAP consultation requests, and campaign landing page submissions. Enforces Turnstile bot validation, normalizes E.164 phone formats, captures UTM attribution, persists to PostgreSQL transactional outbox, and queues CRM synchronization.
- **E. Target Consumers:** Public Website visitors on `/contact`, `/sap-business-one`, and marketing campaign landing pages.
- **F. Authentication & Authorization:** Public (Anonymous). Protected by Cloudflare Turnstile token verification.
- **G. Request Headers:**
  - `Content-Type: application/json`
  - `X-Forwarded-For`: Client IP address for rate limiting and geolocation.
  - `User-Agent`: Client browser string for audit logs.
- **H. Request Query Parameters:** None.
- **I. Request Body Schema (`application/json`):**
  ```json
  {
    "turnstileToken": "0.X.ABCDEF123456...",
    "fullName": "Jane Doe",
    "email": "jane.doe@enterprise.com",
    "company": "Acme Global Enterprises",
    "phone": "+442079460958",
    "country": "United Kingdom",
    "serviceInterest": "Enterprise - SAP",
    "message": "Requesting consultation regarding SAP S/4HANA migration timeline.",
    "sapDetails": {
      "companySize": "51-200",
      "city": "London",
      "service": "SAP Business ERP"
    },
    "attribution": {
      "utmSource": "linkedin",
      "utmMedium": "paid-social",
      "utmCampaign": "sap-q4-accelerator",
      "utmTerm": "enterprise-sap",
      "utmContent": "banner-ad-3",
      "landingPage": "https://nexucon.com/services/sap",
      "referrer": "https://www.linkedin.com/"
    }
  }
  ```
- **J. Response Status Codes & Envelopes:**
  - `201 Created`: Lead accepted and queued in outbox.
    ```json
    {
      "success": true,
      "correlationId": "lead_01HZY98A7B6C",
      "message": "Enquiry received. An enterprise architect will respond within 24 hours.",
      "data": { "leadId": "lead_01HZY98A7B6C", "status": "RECEIVED" },
      "errors": []
    }
    ```
  - `400 Bad Request`: Validation failure (`COM-VALIDATION-001`, `LEAD-NAME-INVALID-004`, `LEAD-EMAIL-INVALID-005`).
  - `403 Forbidden`: Turnstile verification failure (`LEAD-TURNSTILE-FAILED-002`).
  - `409 Conflict`: Duplicate lead detected (`LEAD-DUPLICATE-DETECTED-010`).
  - `429 Too Many Requests`: Rate limit breached (`COM-RATE-LIMIT-010`).
- **K. Idempotency & Concurrency:** SHA-256 hash of `email + message + date` cached in Redis for 5 minutes. Subsequent identical payloads return `409 Conflict`.
- **L. Rate Limiting:** Maximum 5 requests per 10-minute window per IP address via Redis sliding-window.
- **M. Telemetry & Audit:** Application Insights event `LeadSubmissionReceived`. Mask email as `j***e@enterprise.com` and phone as `+44 *** *** 0958`.
- **N. Security & Sanitization:** Strip HTML tags from `fullName`, `company`, and `message`. Enforce Turnstile token verification against Cloudflare verify endpoint.
- **O. Downstream Dependencies & Fallback:** PostgreSQL `website_leads` and `lead_outbox` tables. If CRM gateway is down, lead remains in `PENDING_RETRY` status for background worker dispatch. Zero lead loss.

---

## 7. Cache Invalidation & CMS Integration APIs

### API-WEB-02: On-Demand Cache Revalidation Webhook

- **A. Identifier:** API-WEB-02
- **B. Classification:** `[APPROVED-TARGET]`
- **C. Method & Route:** `POST /api/revalidate`
- **D. Summary & Business Context:** Webhook endpoint invoked by Strapi 5 upon content publishing, editing, or unpublishing. Immediately purges Next.js ISR tag caches via `revalidateTag()`.
- **E. Target Consumers:** Strapi 5 Webhook Engine running on Azure App Service.
- **F. Authentication & Authorization:** Secret Bearer Token in `Authorization: Bearer <NEXT_REVALIDATION_SECRET>`.
- **G. Request Headers:**
  - `Authorization: Bearer <NEXT_REVALIDATION_SECRET>`
  - `Content-Type: application/json`
- **H. Request Query Parameters:** None.
- **I. Request Body Schema (`application/json`):**
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
- **J. Response Status Codes & Envelopes:**
  - `200 OK`: Cache purged successfully.
    ```json
    {
      "success": true,
      "correlationId": "rev_89AB12CD",
      "message": "Cache successfully purged for tags ['services', 'service-sap-modernization']",
      "data": { "revalidated": true, "timestamp": "2026-09-23T20:30:00Z" },
      "errors": []
    }
    ```
  - `401 Unauthorized`: Invalid revalidation bearer token (`CMS-REV-SECRET-INVALID-004`).
- **K. Idempotency:** Naturally idempotent. Multiple cache purges produce the same refreshed state.
- **L. Rate Limiting:** 100 requests per minute from Strapi IP subnet.
- **M. Telemetry & Audit:** Application Insights event `CmsCacheRevalidated` recording model, slug, and tag array.
- **N. Security:** Secret stored in Azure Key Vault and injected via environment variable. Timing-safe string comparison.
- **O. Downstream Dependencies:** Next.js internal tag cache store.

---

### API-WEB-03: Next.js Draft Mode Preview Toggle

- **A. Identifier:** API-WEB-03
- **B. Classification:** `[APPROVED-TARGET]`
- **C. Method & Route:** `GET /api/draft`
- **D. Summary & Business Context:** Enables Next.js Draft Mode (`draftMode().enable()`) and sets secure preview cookie `__prerender_bypass`, allowing editors to preview unpublished Strapi drafts on live site layouts.
- **E. Target Consumers:** Strapi 5 Content Manager preview button.
- **F. Authentication & Authorization:** Query parameter secret token validated against Key Vault secret `NEXT_PREVIEW_SECRET`.
- **G. Request Query Parameters:**
  - `secret` (string, required): Secret preview token.
  - `slug` (string, required): Content slug to preview (e.g. `sap-cloud`).
  - `type` (string, optional): Content model type (`service`, `page`, `blog`).
- **H. Response Status Codes & Behavior:**
  - `307 Temporary Redirect`: Redirects to target content path (e.g., `/services/sap-cloud`) with `__prerender_bypass` cookie.
  - `401 Unauthorized`: Invalid preview secret (`CMS-PREVIEW-SECRET-BAD-006`).
- **I. Telemetry & Audit:** Application Insights event `DraftModePreviewInitiated` with content slug and type.
- **J. Downstream Dependencies:** Strapi 5 draft preview API.

---

## 8. Careers & Recruitment APIs (Public)

### API-CAR-01: Public Job Requisition Feed

- **A. Identifier:** API-CAR-01
- **B. Classification:** `[APPROVED-TARGET]`
- **C. Method & Route:** `GET /api/careers/jobs`
- **D. Summary & Business Context:** Retrieves active, published job openings with filtering (practice area, location, employment type) and pagination.
- **E. Target Consumers:** Public Careers Portal (`/careers`).
- **F. Authentication & Authorization:** Public (Anonymous).
- **G. Request Query Parameters:**
  - `practiceArea` (string, optional): e.g., `SAP Modernization`.
  - `location` (string, optional): e.g., `London, UK`.
  - `employmentType` (string, optional): `Full-Time`, `Contract`.
  - `page` (integer, default 1, min 1).
  - `limit` (integer, default 10, max 50).
- **H. Response Status Codes & Envelopes:**
  - `200 OK`:
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
            "jobId": "NEX-SAP-0042",
            "title": "Principal SAP S/4HANA Solution Architect",
            "slug": "principal-sap-s4hana-architect",
            "practiceArea": "SAP Modernization",
            "location": "London, UK",
            "remotePolicy": "Hybrid",
            "employmentType": "Full-Time",
            "experienceLevel": "10+ Years",
            "publishedAt": "2026-09-20T09:00:00Z",
            "closingDate": "2026-10-31T23:59:59Z"
          }
        ]
      },
      "errors": []
    }
    ```
- **I. Caching:** Edge-cached with 15-minute ISR tag `careers-list`. Revalidated on ATS webhook update.
- **J. Downstream Dependencies:** PostgreSQL `careers_jobs` table.

---

### API-CAR-02: Public Job Requisition Detail

- **A. Identifier:** API-CAR-02
- **B. Classification:** `[APPROVED-TARGET]`
- **C. Method & Route:** `GET /api/careers/jobs/[slug]`
- **D. Summary & Business Context:** Returns comprehensive job description, responsibilities, requirements, and embedded Schema.org `JobPosting` JSON-LD for search engine indexing.
- **E. Target Consumers:** Public Job Detail Page (`/careers/[slug]`).
- **F. Authentication & Authorization:** Public (Anonymous).
- **G. Response Status Codes & Envelopes:**
  - `200 OK`: Returns job detail object + structured JSON-LD.
  - `404 Not Found`: Requisition does not exist or status is `CLOSED` (`CAR-JOB-NOT-FOUND-001`).
- **H. Downstream Dependencies:** PostgreSQL `careers_jobs` table.

---

### API-CAR-03: Candidate Application & Resume Submission

- **A. Identifier:** API-CAR-03
- **B. Classification:** `[APPROVED-TARGET]`
- **C. Method & Route:** `POST /api/careers/apply`
- **D. Summary & Business Context:** Ingests candidate applications and resume files. Verifies Turnstile anti-bot token, checks file magic bytes in memory, persists resume to private Azure Blob Storage (`resumes-private`), records application in PostgreSQL, and queues ATS candidate sync.
- **E. Target Consumers:** Candidate Application Modal/Form on Job Detail Page.
- **F. Authentication & Authorization:** Public (Anonymous). Protected by Cloudflare Turnstile.
- **G. Request Headers:**
  - `Content-Type: multipart/form-data`
- **H. Request Body Form Fields:**
  - `jobId` (string, required): Requisition ID.
  - `firstName` (string, required): Candidate first name.
  - `lastName` (string, required): Candidate last name.
  - `email` (string, required): RFC 5322 compliant email.
  - `phoneNumber` (string, required): E.164 phone string.
  - `jobRole` (string, required): Applied role title.
  - `yearsOfExperience` (number, required).
  - `releventYearsOfExperience` (number, required).
  - `currentCTC` (number, optional) & `currentCTCCurrency` (`INR`, `USD`, `GBP`, `EUR`, `SAR`, `AED`).
  - `expectedCTC` (number, required) & `expectedCTCCurrency`.
  - `noticePeriod` (string, required): e.g., `30 Days`.
  - `linkedinUrl` (string, optional).
  - `consentDataProcessing` (boolean, required: `true`).
  - `turnstileToken` (string, required).
  - `resume` (Binary File, required): PDF or DOCX file, max 5,242,880 bytes.
- **I. Response Status Codes & Envelopes:**
  - `201 Created`:
    ```json
    {
      "success": true,
      "correlationId": "app_01HZP876",
      "message": "Your application has been received successfully.",
      "data": {
        "applicationId": "app_01HZP876",
        "status": "SUBMITTED",
        "timestamp": "2026-09-23T20:35:00Z"
      },
      "errors": []
    }
    ```
  - `400 Bad Request`: Missing field or consent omitted (`CAR-CONSENT-REQUIRED-003`).
  - `409 Conflict`: Candidate applied within last 30 days (`CAR-DUPLICATE-APP-010`).
  - `413 Content Too Large`: File exceeds 5 MB (`CAR-RESUME-TOO-LARGE-005`).
  - `415 Unsupported Media Type`: Magic byte mismatch (`CAR-RESUME-MAGIC-BYTE-007`).
- **J. Binary Magic-Byte Inspection Rules:**
  - PDF: First 4 bytes must be `%PDF` (`0x25 0x50 0x44 0x46`).
  - DOCX: First 4 bytes must be `PK\x03\x04` (`0x50 0x4B 0x03 0x04`).
- **K. Storage Security:** Uploaded directly to private container `resumes-private/YYYY/MM/<uuid>.pdf`. Anonymous public access disabled. Candidate records strictly isolated from Strapi CMS database.

---

## 9. Careers Administration & Secure Resume APIs

### API-CAR-04: Authorized Resume Download SAS Generator

- **A. Identifier:** API-CAR-04
- **B. Classification:** `[APPROVED-TARGET]`
- **C. Method & Route:** `GET /api/careers/admin/applications/[id]/resume-url`
- **D. Summary & Business Context:** Generates a temporary, 15-minute Azure Shared Access Signature (SAS) download URL for authorized recruitment personnel.
- **E. Target Consumers:** Internal Careers Administration Portal.
- **F. Authentication & Authorization:** Microsoft Entra ID Bearer Token or authenticated session cookie. Required Role: `Recruiter` or `Recruitment_Admin`.
- **G. Response Status Codes & Envelopes:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "correlationId": "sas_0912BC",
      "message": "Temporary resume download URL generated.",
      "data": {
        "downloadUrl": "https://stnexuconresumes.blob.core.windows.net/resumes-private/2026/09/uuid.pdf?sp=r&st=2026-09-23T20%3A30%3A00Z&se=2026-09-23T20%3A45%3A00Z&spr=https&sig=...",
        "expiresAt": "2026-09-23T20:45:00Z"
      },
      "errors": []
    }
    ```
  - `401 Unauthorized`: Unauthenticated caller (`COM-AUTH-MISSING-003`).
  - `403 Forbidden`: Lacks recruiter role (`CAR-SAS-UNAUTHORIZED-011`).
  - `404 Not Found`: Application record or blob does not exist (`CAR-BLOB-NOT-FOUND-013`).
- **H. Telemetry & Audit:** Application Insights event `CandidateResumeDownloaded` logging `recruiterId`, `applicationId`, and `timestamp`.

---

## 10. ATS Integration APIs

### API-INT-01: ATS Inbound Job Requisition Webhook

- **A. Identifier:** API-INT-01
- **B. Classification:** `[APPROVED-TARGET]`
- **C. Method & Route:** `POST /api/integrations/ats/jobs`
- **D. Summary & Business Context:** Ingests job requisition lifecycle events (`CREATED`, `UPDATED`, `CLOSED`) dispatched by Nexucon's corporate ATS.
- **E. Target Consumers:** Corporate ATS Webhook Dispatcher.
- **F. Authentication & Authorization:** HMAC-SHA256 Signature passed in `X-Nexucon-ATS-Signature` header. Timestamp skew validation in `X-Nexucon-ATS-Timestamp`.
- **G. Request Headers:**
  - `X-Nexucon-ATS-Signature: <hex-encoded-hmac>`
  - `X-Nexucon-ATS-Timestamp: <unix-timestamp>`
  - `Content-Type: application/json`
- **H. Request Body Schema (`application/json`):**
  ```json
  {
    "event": "JOB_REQUISITION_UPDATED",
    "externalRequisitionId": "ATS-REQ-2026-881",
    "title": "Senior AI Platforms Engineer",
    "status": "OPEN",
    "practiceArea": "Data & AI",
    "location": "London / Remote",
    "jobDescriptionHtml": "<p>Nexucon is expanding its AI practice...</p>",
    "requirements": ["Python", "PyTorch", "Kubernetes", "Azure AI"],
    "closingDate": "2026-11-15T23:59:59Z"
  }
  ```
- **I. Response Status Codes & Envelopes:**
  - `200 OK`: Requisition successfully synchronized.
  - `400 Bad Request`: Timestamp skew > 300s (`ATS-TIMESTAMP-SKEW-003`).
  - `401 Unauthorized`: Signature mismatch (`ATS-SIG-INVALID-002`).
- **J. Processing Workflow:**
  1. Verify HMAC signature: `HMAC-SHA256(timestamp + "." + rawBody, secret)`.
  2. Upsert requisition record in PostgreSQL `careers_jobs` table.
  3. Trigger Next.js tag revalidation for `careers-list` and `career-[slug]`.

---

## 11. CRM & Lead Management Portal Integration APIs

### API-INT-02: Outbound CRM Dispatch Adapter

- **A. Identifier:** API-INT-02
- **B. Classification:** `[APPROVED-TARGET]`
- **C. Target System:** Corporate Lead Management Portal (`https://<configured-crm-host>/v1/leads`) `[TBD WITH CRM OWNER]`.
- **D. Direction:** Outbound server-side HTTPS call dispatched by background worker.
- **E. Authentication:** Azure Key Vault managed API Key passed in `X-Nexucon-CRM-Key`.
- **F. Outbound Payload Contract:**
  ```json
  {
    "sourceSystem": "nexucon-public-website",
    "leadExternalId": "lead_01HZY98A7B6C",
    "leadType": "CONSULTATION_REQUEST",
    "contact": {
      "fullName": "Jane Doe",
      "email": "jane.doe@enterprise.com",
      "phone": "+442079460958",
      "company": "Acme Global Enterprises"
    },
    "requirements": {
      "practiceDomain": "Enterprise - SAP",
      "notes": "Requesting consultation regarding SAP S/4HANA migration timeline."
    },
    "telemetry": {
      "utmSource": "linkedin",
      "utmCampaign": "sap-q4-accelerator",
      "landingPage": "https://nexucon.com/services/sap",
      "submittedAt": "2026-09-23T20:30:00Z"
    }
  }
  ```
- **G. Retry Policy:** Exponential backoff (1s, 5s, 30s, 5m, 30m). Failed dispatches remain in outbox table with status `FAILED_DISPATCH`, triggering Application Insights Sev-2 warning alerts.

---

## 12. Headless Marketing CMS APIs (Strapi 5 Managed)

All content APIs are provided directly by Strapi 5 running on Azure App Service and consumed server-side by Next.js React Server Components.

| Endpoint & Method | Purpose | Consumer | Auth & Headers | Caching in Next.js |
| :--- | :--- | :--- | :--- | :--- |
| **`GET /api/global-setting`** | Fetches site title, navigation menus, social links, footer data, and default SEO schemas. | Next.js Root Layout (`layout.tsx`) | Strapi API Read Token (`Authorization: Bearer <STRAPI_READ_TOKEN>`) | ISR: Tag `global-settings` (Revalidated on demand via webhook). |
| **`GET /api/pages`** | Fetches marketing landing pages by slug with populated dynamic sections. | Next.js Page Router (`app/[...slug]/page.tsx`) | Strapi API Read Token | ISR: Tag `page-[slug]` (Revalidated on demand via webhook). |
| **`GET /api/services`** | Fetches practice area services (SAP, AI, Cloud, Enterprise Modernization, Staff Augmentation). | Next.js Service Templates (`app/services/*`) | Strapi API Read Token | ISR: Tag `services`, `service-[slug]`. |
| **`GET /api/blogs`** | Fetches published thought leadership articles with author relations and tags. | Next.js Blog Templates (`app/insights/*`) | Strapi API Read Token | ISR: Tag `blogs`, `blog-[slug]`. |
| **`GET /api/case-studies`** | Fetches enterprise transformation case studies with client impact metrics. | Next.js Case Study Templates (`app/work/*`) | Strapi API Read Token | ISR: Tag `case-studies`. |
| **`GET /api/redirects`** | Fetches vanity redirect rules configured by digital marketing. | Next.js Middleware / Route cache | Strapi API Read Token | In-memory edge cache with 1-hour fallback. |
| **`POST /api/upload`** | Uploads public marketing media assets to Azure Blob Storage container (`media-public`). | Strapi Admin Content Editors | Strapi Session / Admin JWT | Direct Azure Blob Storage commit via `@strapi/provider-upload-azure-storage`. |

---

## 13. Analytics & Telemetry Strategy

1. **Client-Side Telemetry:** Google Tag Manager (GTM) container injected into Next.js root layout. Triggers GA4 events for page views, button clicks, and form submissions (e.g. `sap_demo_request_success`).
2. **Server-Side Telemetry:** Azure Application Insights SDK integrated into Next.js App Router instrumentation hook (`instrumentation.ts`). Tracks request latency, downstream dependency durations (Strapi, CRM, Azure Blob), and exceptions.
3. **Database Beacon Deprecation:** Prototype route `POST /api/analytics` is permanently decommissioned, eliminating high-volume write strain on transactional databases.

---

## 14. Transactional Outbox & Resilience Patterns

To guarantee zero lead loss during CRM network partitions, inbound leads are managed through a Transactional Outbox pattern:

```
[Visitor Submits Form]
          |
          v
[Next.js BFF: POST /api/leads]
          |
          +---> [DB Transaction Begins]
          |       |-- Insert Lead record into 'website_leads'
          |       |-- Insert Outbox record into 'lead_outbox' (status: 'PENDING')
          |     [DB Transaction Commits]
          |
          +---> Returns HTTP 201 Created to Visitor (Immediate Feedback)
          |
          +---> [Background Dispatch Worker (Asynchronous)]
                  |-- Reads 'PENDING' records from 'lead_outbox'
                  |-- Dispatches POST to Corporate CRM Gateway
                  |-- On Success: Updates outbox status to 'DISPATCHED'
                  |-- On Failure: Increments retry_count, schedules exponential backoff
```

---

## 15. Performance, Caching & Edge Delivery Architecture

- **Tag-Based Incremental Static Regeneration (ISR):** Content pages pre-rendered statically and cached at the edge. Revalidated instantly on publish via `revalidateTag()`.
- **Edge WAF & CDN:** Cloudflare Enterprise edge terminates TLS, validates Turnstile challenges, and caches static assets and images.
- **Image Optimization:** Next.js `<Image>` component coupled with Cloudflare Image Resizing / Azure CDN for modern AVIF/WebP image delivery.

---

## 16. Rate Limiting, Throttling & DDoS Mitigation

A two-tier rate-limiting strategy safeguards public endpoints:
- **Tier 1 (Edge Protection):** Cloudflare WAF rate-limiting rules block malicious IPs exceeding 100 requests per 10 seconds.
- **Tier 2 (BFF Business Quotas):** Redis-backed sliding-window middleware enforces fine-grained route quotas:
  - `POST /api/leads`: 5 requests per 10 minutes per IP.
  - `POST /api/careers/apply`: 3 requests per 10 minutes per IP.
  - `POST /api/revalidate`: 100 requests per minute from Strapi subnet.

---

## 17. File Upload & Binary Asset Security Architecture

All candidate resume uploads (`POST /api/careers/apply`) undergo strict defensive filtering:
1. **Size Boundary:** Maximum 5,242,880 bytes (5 MB). Files exceeding this limit are rejected with HTTP 413.
2. **Extension Allowlist:** Only `.pdf` and `.docx` extensions allowed.
3. **Binary Magic-Byte Inspection:** Node.js streams inspect initial chunk bytes in memory before committing to disk:
   - PDF magic bytes: `%PDF-` (`0x25 0x50 0x44 0x46`).
   - DOCX magic bytes: `PK\x03\x04` (`0x50 0x4B 0x03 0x04`).
4. **Antivirus Scanning:** Async hook triggers Azure Defender for Storage malware scan upon blob creation. Infected blobs are quarantined immediately.
5. **Private Isolation:** Stored in container `resumes-private` with generated UUID filenames. Resumes are NEVER stored in Strapi CMS.

---

## 18. Database Schema & Data Models

### PostgreSQL Production Schema (DDL)

```sql
-- 1. Inbound Website Leads Table
CREATE TABLE website_leads (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    company VARCHAR(120),
    country VARCHAR(100),
    service_interest VARCHAR(100),
    message TEXT NOT NULL,
    sap_details JSONB,
    attribution JSONB,
    status VARCHAR(30) DEFAULT 'RECEIVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Transactional Outbox for CRM Dispatch
CREATE TABLE lead_outbox (
    id VARCHAR(36) PRIMARY KEY,
    lead_id VARCHAR(36) REFERENCES website_leads(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    dispatched_at TIMESTAMP WITH TIME ZONE
);

-- 3. Job Requisitions Table (Synced from ATS)
CREATE TABLE careers_jobs (
    id VARCHAR(36) PRIMARY KEY,
    external_requisition_id VARCHAR(100) UNIQUE NOT NULL,
    job_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    practice_area VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    remote_policy VARCHAR(50) NOT NULL,
    employment_type VARCHAR(50) NOT NULL,
    experience_level VARCHAR(50),
    job_details TEXT NOT NULL,
    responsibilities JSONB,
    requirements JSONB,
    skills JSONB,
    salary_range VARCHAR(100),
    benefits JSONB,
    status VARCHAR(30) DEFAULT 'OPEN',
    published_at TIMESTAMP WITH TIME ZONE,
    closing_date TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Candidate Applications Table
CREATE TABLE careers_applications (
    id VARCHAR(36) PRIMARY KEY,
    job_id VARCHAR(36) REFERENCES careers_jobs(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    job_role VARCHAR(100) NOT NULL,
    years_experience INT NOT NULL,
    relevant_experience INT NOT NULL,
    current_ctc NUMERIC(12, 2),
    current_ctc_currency VARCHAR(10),
    expected_ctc NUMERIC(12, 2) NOT NULL,
    expected_ctc_currency VARCHAR(10) NOT NULL,
    notice_period VARCHAR(50) NOT NULL,
    linkedin_url VARCHAR(255),
    resume_blob_path VARCHAR(500) NOT NULL,
    consent_data_processing BOOLEAN NOT NULL DEFAULT TRUE,
    idempotency_hash VARCHAR(64) NOT NULL,
    status VARCHAR(30) DEFAULT 'SUBMITTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_created ON website_leads(created_at);
CREATE INDEX idx_outbox_pending ON lead_outbox(status, next_retry_at);
CREATE INDEX idx_jobs_slug ON careers_jobs(slug);
CREATE INDEX idx_jobs_status ON careers_jobs(status);
CREATE INDEX idx_app_hash ON careers_applications(idempotency_hash, created_at);
```

---

## 19. Environment Configuration & Secret Management

All secrets are managed in Azure Key Vault and injected into Azure App Service configurations:

| Variable Name | Purpose | Sensitivity Level | Sample Format / Default |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | Confidential | `postgres://app_user:<secret>@psql-nexucon.postgres.database.azure.com:5432/nexucon_prod` |
| `REDIS_URL` | Azure Cache for Redis connection | Confidential | `rediss://:<secret>@redis-nexucon.redis.cache.windows.net:6380` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server verification | Confidential | `<secret>` |
| `NEXT_REVALIDATION_SECRET` | Secret token for `/api/revalidate` | Confidential | `<secret>` |
| `NEXT_PREVIEW_SECRET` | Secret token for `/api/draft` | Confidential | `<secret>` |
| `ATS_WEBHOOK_SECRET` | HMAC-SHA256 secret for ATS webhooks | Confidential | `<secret>` |
| `CRM_GATEWAY_API_KEY` | API Key for corporate CRM | Confidential | `<secret>` |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob connection for resumes | Confidential | `DefaultEndpointsProtocol=https;AccountName=stnexucon;...` |
| `STRAPI_API_TOKEN` | Strapi 5 Content API Read Bearer Token | Confidential | `<secret>` |
| `STRAPI_HOST` | Internal hostname for Strapi CMS | Internal URL | `https://cms.internal.nexucon.com` |

---

## 20. Error Catalogue Reference & HTTP Status Mapping

For the exhaustive inventory of all 42 error codes, internal log formats, retryability rules, and alert severities, refer to the companion specification:  
**[`Nexucon-Website-CMS-API-Error-Catalogue.md`](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-API-Error-Catalogue.md)**.

### Summary Error Mapping Matrix
- `COM-*`: Common platform and runtime infrastructure errors (001–099).
- `LEAD-*`: Contact form, SAP consultation, and CRM outbox errors (001–099).
- `CAR-*`: Careers feed, candidate applications, magic byte, and SAS URL errors (001–099).
- `ATS-*`: External ATS webhook HMAC and synchronization errors (001–099).
- `CMS-*`: Strapi 5 content fetch, cache revalidation, and preview errors (001–099).
- `LEGACY-*`: Deprecated prototype route decommission notices (001–099).

---

## 21. Test Matrix Reference & QA Verification Strategy

For the complete 37-case QA automation matrix covering functional, boundary, negative, security, idempotency, rate limiting, and failure resilience test suites, refer to:  
**[`Nexucon-Website-CMS-API-Test-Matrix.md`](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-API-Test-Matrix.md)**.

---

## 22. Architectural Decision Register Reference

For the full evaluation of alternatives, trade-offs, and governance rationale across all 20 architectural decisions, refer to:  
**[`Nexucon-Website-CMS-API-Decision-Register.md`](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-API-Decision-Register.md)**.

---

## 23. Legacy API Retirement Schedule

For the comprehensive phased retirement timeline, data migration scripts, security rollback procedures, and cutover sign-off criteria, refer to:  
**[`Nexucon-Website-CMS-API-Retirement-Plan.md`](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-API-Retirement-Plan.md)**.

---

## 24. Field Mapping Reference

For the comprehensive field-by-field mapping across legacy web forms (`contact.html`, `sap-business-one.html`), careers SPA components, target Zod schemas, database columns, and outbound CRM/ATS payloads, refer to:  
**[`Nexucon-Website-CMS-API-Field-Mapping.md`](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-API-Field-Mapping.md)**.

---

## 25. OpenAPI Specification Reference

For the complete, valid OpenAPI 3.1 YAML definition covering all endpoints, parameters, request bodies, and reusable schemas, refer to:  
**[`Nexucon-Website-CMS-OpenAPI-v1.0.yaml`](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-OpenAPI-v1.0.yaml)**.

---

## 26. Implementation Phasing & Release Roadmap

```
Release 1: CMS-Connected Alpha (Sprint 1 - 3)
- Stand up Strapi 5 Headless CMS on Azure App Service with Azure Blob Provider.
- Implement Microsoft Entra ID SSO for internal marketing staff.
- Deploy Next.js Tag-Based ISR and cache revalidation webhook (POST /api/revalidate).
- Decommission prototype authentication and content mutation routes (HTTP 410 Gone).

Release 2: Integrated Beta (Sprint 4 - 6)
- Deploy target POST /api/leads with Turnstile validation and PostgreSQL Transactional Outbox.
- Deploy Decoupled Careers Engine (GET /api/careers/jobs, POST /api/careers/apply).
- Implement private Azure Blob resume storage with in-memory magic-byte inspection.
- Deploy ATS Requisition Sync Webhook (POST /api/integrations/ats/jobs) with HMAC-SHA256 security.
- Integrate Google Analytics 4 (via GTM) and Azure Application Insights.

Release 3: Production Cutover (Sprint 7 - 8)
- Complete end-to-end load testing and OWASP ZAP security penetration audits.
- Decommission prototype MongoDB database and legacy static HTML forms.
- Cut over production DNS to Azure Front Door / App Service.
```

---

## 27. Document Approvals, RACI Matrix & Review History

### RACI Governance Matrix

| Role / Stakeholder | Name / Title | Responsibility | Sign-Off Date |
| :--- | :--- | :--- | :--- |
| **Principal Solution Architect** | Senior Architect, Cloud & Web | Accountable (A) | Approved (2026-09-23) |
| **Lead Backend Engineer** | Senior Backend Engineer | Responsible (R) | Approved (2026-09-23) |
| **Senior Frontend Engineer** | Next.js Specialist Lead | Responsible (R) | Approved (2026-09-23) |
| **Cloud Security Architect** | Enterprise Security Lead | Consulted (C) | Approved (2026-09-23) |
| **QA Automation Lead** | Quality Assurance Lead | Responsible (R) | Approved (2026-09-23) |
| **ATS / CRM Product Owners** | Corporate Integration Owners | Informed (I) | In Review |

### Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| **v0.1** | 2026-09-22 | Solution Architecture Team | Initial As-Is API inventory and high-level catalogue draft. |
| **v1.0** | 2026-09-23 | Principal API Architect & Engineering Team | Complete, implementation-ready API specification covering all 27 sections, unified response contracts, Zod schemas, PostgreSQL DDL, error catalogues, test matrices, and retirement plans. |
