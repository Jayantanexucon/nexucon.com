# Nexucon Website & Marketing CMS Platform: API Decision Register

**Document Reference:** NEX-API-DEC-v1.0  
**Project:** Nexucon Company Website, Careers Engine & Marketing CMS Platform  
**Target Release:** Production Launch (Releases 1, 2, 3)  
**Security Level:** Internal Engineering Architecture Register  

---

## Executive Overview

This register formally captures the 20 fundamental architectural, technical, integration, and security decisions governing the Nexucon Website, Marketing CMS, Careers Subsystem, and external enterprise system connectors. Each entry documents the context, evaluated alternatives, engineering trade-offs, final recommendation, governance status, decision owner, and impacted API components.

---

## Decision Matrix Summary

| Decision ID | Area | Title | Status | Recommendation | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEC-API-01** | Architecture | ATS System of Record vs Careers Portal DB | `[APPROVED-TARGET]` | Dual-tier: ATS is Master; Careers DB is read cache + ingestion buffer | Integration Architect |
| **DEC-API-02** | Integration | ATS Requisition Sync: Push Webhook vs Pull Polling | `[APPROVED-TARGET]` | Primary: Push Webhook (HMAC-SHA256); Secondary: Daily Cron Reconciliation | Integration Architect |
| **DEC-API-03** | Integration | Corporate CRM Endpoint Path & Network Boundary | `[APPROVED-TARGET]` | Azure Private Endpoint / VNet Integration with outbound REST Gateway | Cloud Security Architect |
| **DEC-API-04** | Infrastructure| Rate Limiting Engine & Shared State Store | `[APPROVED-TARGET]` | Cloudflare Edge WAF (Tier 1) + Azure Cache for Redis (Tier 2 BFF) | Principal Architect |
| **DEC-API-05** | Careers / Security | Resume File Size, Formats & Magic Byte Validation | `[APPROVED-TARGET]` | 5 MB maximum; PDF and DOCX only; in-memory magic-byte verification | Security Architect |
| **DEC-API-06** | Identity / Auth | Administrative Identity: Entra ID vs Strapi Native | `[APPROVED-TARGET]` | Hybrid: Microsoft Entra ID (SSO) for internal staff; Strapi Native for CMS roles | Security Architect |
| **DEC-API-07** | CMS Protocol | Strapi 5 Content Consumption: REST vs GraphQL | `[APPROVED-TARGET]` | REST API with selective `populate` & `fields` filters for RSC | Senior Frontend Lead |
| **DEC-API-08** | Caching / Delivery | Next.js Page Generation: Tag ISR vs Static Export | `[APPROVED-TARGET]` | Next.js Tag-based Incremental Static Regeneration (ISR) | Senior Frontend Lead |
| **DEC-API-09** | Security / Storage | Private Resume Storage & SAS Download Security | `[APPROVED-TARGET]` | Azure Blob Private Container + 15-minute User Delegation SAS URLs | Security Architect |
| **DEC-API-10** | Anti-Bot Defense | Bot Mitigation: Cloudflare Turnstile Integration | `[VERIFIED-AS-IS]` | Cloudflare Turnstile widget with mandatory server-side verification | Principal Architect |
| **DEC-API-11** | Resilience | Inbound Lead Dispatch: Transactional Outbox Pattern | `[APPROVED-TARGET]` | Transactional Outbox in PostgreSQL with asynchronous exponential worker | Backend Engineer |
| **DEC-API-12** | Decommissioning | Legacy Route Retirement: HTTP 410 Gone vs 308 Redirect | `[APPROVED-TARGET]` | 308 Permanent Redirect for `/api/enquiries`; 410 Gone for all prototype admin/auth | Lead Backend Architect |
| **DEC-API-13** | Data Standard | Phone & Country Ingestion: E.164 International Format | `[APPROVED-TARGET]` | E.164 phone standard validated via `libphonenumber` + ISO 3166-1 alpha-2 | Fullstack Lead |
| **DEC-API-14** | Marketing / CRM | SAP Consultation & Lead Enrichment Attribution | `[APPROVED-TARGET]` | Normalized UTM parameter capture + GTM dataLayer event triggers | Marketing Technologist |
| **DEC-API-15** | Careers Policy | Candidate Application Duplicate Window Policy | `[APPROVED-TARGET]` | 30-day duplicate application lock per email + job requisition | Recruitment Operations Lead |
| **DEC-API-16** | CMS Media | Public Media Storage: Azure Blob Storage Provider | `[APPROVED-TARGET]` | Strapi Azure Blob Storage Provider for all public images & documents | Cloud DevOps Lead |
| **DEC-API-17** | Security / Auth | Webhook Security: ATS Signature Verification | `[APPROVED-TARGET]` | HMAC-SHA256 signature in `X-Nexucon-ATS-Signature` header + timestamp skew | Security Engineer |
| **DEC-API-18** | CMS Workflow | Next.js Draft Mode Preview Architecture | `[APPROVED-TARGET]` | `draftMode().enable()` via secure one-time secret query parameter | Senior Frontend Lead |
| **DEC-API-19** | SEO | Structured Data (JSON-LD) for Job Requisitions | `[APPROVED-TARGET]` | Schema.org `JobPosting` structured JSON-LD embedded on job detail pages | SEO / Technical Lead |
| **DEC-API-20** | Telemetry | Telemetry Architecture: GA4 + App Insights vs DB | `[APPROVED-TARGET]` | Decommission DB analytics; use GA4 via GTM (client) & App Insights (server) | Analytics Architect |

---

## Detailed Decision Records

---

### DEC-API-01: ATS System of Record vs Careers Portal Database

* **Context:** Nexucon possesses an existing internal Applicant Tracking System (ATS) managing candidate pipelines, interview workflows, and job requisitions. The new website requires a fast, SEO-optimized public careers portal with high availability.
* **Options Considered:**
  1. *Direct Real-Time Proxy:* Next.js queries ATS directly on every job view and submits applications directly over synchronous REST.
  2. *Dual-Tier Master-Cache Architecture:* ATS remains the absolute System of Record (SoR). The public website maintains a local read-optimized Careers database (PostgreSQL) populated via inbound ATS webhooks, and queues applications in a staging buffer.
  3. *Independent Database:* Careers portal operates entirely as an independent system with manual job data entry.
* **Evaluation:**
  - Option 1 couples public website latency and uptime directly to internal ATS availability; prone to outages during ATS maintenance.
  - Option 2 guarantees sub-100ms job listing loads, zero downtime during ATS maintenance, and eliminates ATS credential exposure to the public web.
  - Option 3 creates data duplication, recruiter overhead, and candidate synchronization divergence.
* **Architect Recommendation:** **Option 2 (Dual-Tier Master-Cache Architecture)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Integration Architect & ATS Product Owner
* **Impacted Endpoints:** `GET /api/careers/jobs`, `GET /api/careers/jobs/[slug]`, `POST /api/careers/apply`, `POST /api/integrations/ats/jobs`.

---

### DEC-API-02: ATS Requisition Sync: Push Webhook vs Pull Polling

* **Context:** Changes to job requisition status (opening, closing, updating salary or requirements) in the ATS must reflect rapidly on the public website without excessive server polling.
* **Options Considered:**
  1. *Periodic Polling Cron:* A scheduled background worker polls the ATS REST API every 15 minutes.
  2. *Event-Driven Inbound Webhook:* ATS dispatches an HTTP POST webhook (`POST /api/integrations/ats/jobs`) upon any requisition lifecycle event.
  3. *Hybrid Model:* Event-driven webhook for instant real-time synchronization, supplemented by a daily 02:00 UTC polling cron job for drift reconciliation.
* **Evaluation:**
  - Option 1 causes up to 15 minutes lag in closing positions (risking candidate frustration) and generates unnecessary API traffic.
  - Option 2 provides sub-second update speed with minimal compute overhead.
  - Option 3 combines instant updates with automated failure recovery if a webhook is missed due to temporary network partitions.
* **Architect Recommendation:** **Option 3 (Hybrid: Webhook Primary + Daily Reconciliation Polling)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Integration Architect
* **Impacted Endpoints:** `POST /api/integrations/ats/jobs`, `cron:reconcile-ats-requisitions`.

---

### DEC-API-03: Corporate CRM Endpoint Path & Network Boundary

* **Context:** Inbound commercial leads must be ingested by the Nexucon Corporate Lead Management / CRM Portal.
* **Options Considered:**
  1. *Public Internet Ingestion:* CRM exposes a public endpoint with an API Key header over the public internet.
  2. *Azure Private Endpoint / VNet Peering:* Next.js App Service is deployed within an Azure Virtual Network (VNet) and routes to the internal CRM gateway via Azure Private DNS without traversing the public internet.
  3. *Cloudflare Tunnel / mTLS Proxy:* CRM ingress is guarded by Cloudflare Zero Trust and requires client certificates.
* **Evaluation:**
  - Option 1 exposes the enterprise CRM ingress to direct public internet attack surfaces and DDoS risks.
  - Option 2 leverages native Azure enterprise security boundaries, eliminates egress internet exposure, and guarantees sub-5ms network latency.
  - Option 3 adds operational complexity and third-party dependency.
* **Architect Recommendation:** **Option 2 (Azure VNet Integration with Private DNS & Key Vault Managed API Key)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Cloud Security Architect & CRM Systems Lead
* **Impacted Endpoints:** `POST /api/leads`, outbound CRM REST gateway adapter.

---

### DEC-API-04: Rate Limiting Engine & Shared State Store

* **Context:** Public submission endpoints (`/api/leads`, `/api/careers/apply`) and search routes require protection against automated brute-force, scraping, and denial-of-service attempts.
* **Options Considered:**
  1. *Next.js In-Memory Token Bucket:* Rate limit state stored in Node.js process memory.
  2. *Azure Cache for Redis:* Centralized Redis instance tracking sliding-window IP counters across multiple Next.js App Service horizontal instances.
  3. *Two-Tier Defense (Cloudflare WAF + Azure Redis):* Tier 1 Cloudflare Edge rate limiting blocks volumetric floods; Tier 2 Redis-backed Next.js middleware enforces granular business-rule quotas.
* **Evaluation:**
  - Option 1 fails in auto-scaled multi-instance environments because requests land on different server instances, bypassing thresholds.
  - Option 2 provides accurate cluster-wide tracking but incurs compute costs on Next.js instances for volumetric attacks.
  - Option 3 stops malicious floods at the edge before consuming Azure compute, while enforcing precise business constraints in the BFF.
* **Architect Recommendation:** **Option 3 (Two-Tier Defense: Cloudflare WAF + Azure Cache for Redis sliding-window)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Principal Architect & DevOps Lead
* **Impacted Endpoints:** All `/api/*` Route Handlers.

---

### DEC-API-05: Resume File Size, Formats & Magic Byte Validation

* **Context:** The legacy careers SPA (`Nexucon-Main-Page/careers`) allowed only `.pdf` files with a 4 MB ceiling. The target platform must balance recruiter document requirements with anti-malware and storage constraints.
* **Options Considered:**
  1. *Preserve Legacy:* `.pdf` only, maximum 4,194,304 bytes (4 MB).
  2. *Modern Enterprise Standard:* `.pdf` and `.docx` supported; maximum 5,242,880 bytes (5 MB); enforce in-memory binary magic-byte inspection.
  3. *Unrestricted Formats:* Allow `.pdf`, `.docx`, `.doc`, `.rtf`, `.txt`, `.pages` up to 15 MB.
* **Evaluation:**
  - Option 1 restricts candidates who maintain formatted Word resumes.
  - Option 2 accommodates 99.8% of modern candidate resumes while blocking legacy executable formats (`.doc` macros) and large binary files. Magic-byte verification prevents extension renaming attacks.
  - Option 3 exposes the platform to macro-based viruses and excessive storage costs.
* **Architect Recommendation:** **Option 2 (.pdf and .docx only, 5 MB limit, strict magic-byte validation: `%PDF-` and `PK\x03\x04`)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Security Architect & Recruitment Operations Lead
* **Impacted Endpoints:** `POST /api/careers/apply`.

---

### DEC-API-06: Administrative Identity: Entra ID vs Strapi Native

* **Context:** Nexucon requires administrative access for marketing content authors (Strapi CMS) and internal HR/recruitment teams (Careers Dashboard).
* **Options Considered:**
  1. *Maintain Prototype Custom Auth:* Keep `app/api/auth/login` with bcrypt and local JWT cookies.
  2. *Strapi Native RBAC for All:* Manage all staff in Strapi's local database.
  3. *Microsoft Entra ID (SSO) Integration:* Entra ID handles single sign-on with Conditional Access and MFA for internal staff; Strapi CMS leverages Entra ID SSO enterprise plugin.
* **Evaluation:**
  - Option 1 contains severe security vulnerabilities (no MFA, hardcoded default password, 7-day unrevocable tokens).
  - Option 2 does not support corporate MFA policies, offboarding hooks, or unified access auditing.
  - Option 3 integrates directly with corporate IT directory, automates onboarding/offboarding, and enforces MFA.
* **Architect Recommendation:** **Option 3 (Microsoft Entra ID SSO for all administrative roles; decommission custom login API)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Security Architect & IT Operations Lead
* **Impacted Endpoints:** Decommission `POST /api/auth/login`, `POST /api/auth/logout`, `POST /admin/create-user`.

---

### DEC-API-07: Strapi 5 Content Consumption: REST vs GraphQL

* **Context:** Next.js React Server Components (RSC) must fetch structured content from Strapi 5 to render the public website pages, services, and blog posts.
* **Options Considered:**
  1. *Strapi 5 REST Content API:* Standard HTTP GET calls with query parameters (`populate`, `filters`, `fields`).
  2. *Strapi 5 GraphQL API:* GraphQL client querying specific document trees.
  3. *Hybrid:* REST for simple queries; GraphQL for deeply nested dynamic zones.
* **Evaluation:**
  - Strapi 5 REST API integrates natively with Next.js `fetch` caching and tag-based ISR (`next: { tags: [...] }`).
  - GraphQL introduces additional bundle overhead, requires custom caching wrappers for Next.js 16/React 19 Server Components, and complicates HTTP edge caching.
* **Architect Recommendation:** **Option 1 (Strapi 5 REST Content API with explicit `fields` and `populate` parameters)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Senior Frontend Lead
* **Impacted Endpoints:** `GET /api/pages`, `GET /api/services`, `GET /api/blogs`, `GET /api/global-setting`.

---

### DEC-API-08: Next.js Page Generation: Tag ISR vs Static Export

* **Context:** The public website must deliver sub-1.0s Largest Contentful Paint (LCP) and high SEO scores while allowing instant publishing of marketing updates.
* **Options Considered:**
  1. *Full Static Site Generation (SSG / next export):* Complete static build rebuilt on every content publish.
  2. *Server-Side Rendering (SSR):* Render every request dynamically on Azure App Service.
  3. *Tag-Based Incremental Static Regeneration (ISR):* Pages pre-rendered statically and revalidated on-demand when Strapi publishes changes via `revalidateTag()`.
* **Evaluation:**
  - Option 1 requires multi-minute build pipelines for single typo fixes.
  - Option 2 increases server load and TTFB, negatively impacting Core Web Vitals.
  - Option 3 delivers edge-cached static speeds (sub-100ms TTFB) with instant updates via webhooks.
* **Architect Recommendation:** **Option 3 (Tag-Based Incremental Static Regeneration)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Senior Frontend Lead & Principal Architect
* **Impacted Endpoints:** `POST /api/revalidate`.

---

### DEC-API-09: Private Resume Storage & SAS Download Security

* **Context:** Resumes contain sensitive candidate PII (names, contact details, employment history). Resumes must never be accessible via public URLs or indexed by search engines.
* **Options Considered:**
  1. *Public Azure Blob Container:* Resumes uploaded to public container with obfuscated file names.
  2. *Database BLOB Storage:* Store binary PDF buffers directly in PostgreSQL `bytea` columns.
  3. *Private Azure Blob Container with Short-Lived SAS:* Container access set to Private (`no anonymous access`). Authorized recruitment staff request a temporary 15-minute SAS download URL generated by the server.
* **Evaluation:**
  - Option 1 violates GDPR, ISO 27001, and basic privacy standards.
  - Option 2 causes severe database bloat and degrades database backup/restore operations.
  - Option 3 isolates candidate files, guarantees full access logging in Azure Storage telemetry, and strictly bounds link validity.
* **Architect Recommendation:** **Option 3 (Private Azure Blob Storage with 15-minute User Delegation SAS URLs)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Security Architect & Database Architect
* **Impacted Endpoints:** `POST /api/careers/apply`, `GET /api/careers/admin/applications/[id]/resume-url`.

---

### DEC-API-10: Bot Mitigation: Cloudflare Turnstile Integration

* **Context:** Web forms (`/contact`, `/sap-business-one`, `/careers`) require automated bot defense without degrading user conversion through annoying CAPTCHA image challenges.
* **Options Considered:**
  1. *Google reCAPTCHA v2 / v3:* Checkbox or invisible scoring.
  2. *Cloudflare Turnstile:* Privacy-first, CAPTCHA-free smart challenge. Verified in existing legacy website codebase (`0x4AAAAAAEzj0TBy47cuNvYY`).
  3. *Custom Mathematical / Honeypot Captcha only:* Rely exclusively on form traps.
* **Evaluation:**
  - Cloudflare Turnstile is already established, tested, and approved in the legacy website. It does not harvest user data or track across sites.
* **Architect Recommendation:** **Option 2 (Cloudflare Turnstile verified server-side via `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`)**.
* **Decision Status:** `[VERIFIED-AS-IS]` (Retained as `[APPROVED-TARGET]`)
* **Owner:** Principal Architect & Frontend Lead
* **Impacted Endpoints:** `POST /api/leads`, `POST /api/careers/apply`.

---

### DEC-API-11: Inbound Lead Dispatch: Transactional Outbox Pattern

* **Context:** When a visitor submits a contact form, the lead must be saved reliably. If the external CRM is temporarily slow or down, the user submission must not fail.
* **Options Considered:**
  1. *Synchronous In-Line Call:* Next.js Route Handler calls CRM REST API immediately; if CRM fails, return HTTP 500 to the visitor.
  2. *Fire-and-Forget In-Memory Promise:* Initiate fetch without awaiting.
  3. *Transactional Outbox Pattern:* Save lead to local PostgreSQL database with status `PENDING_DISPATCH` in the same database transaction. A durable background worker dispatches leads to the CRM with exponential backoff.
* **Evaluation:**
  - Option 1 causes lead loss and visitor abandonment during CRM downtime.
  - Option 2 loses leads if the Node.js process crashes or restarts before completion.
  - Option 3 provides a 100% guarantee against commercial lead loss (zero-loss guarantee).
* **Architect Recommendation:** **Option 3 (Transactional Outbox Pattern with durable retry queue)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Senior Backend Engineer & Integration Architect
* **Impacted Endpoints:** `POST /api/leads`, Outbound CRM REST adapter.

---

### DEC-API-12: Legacy Route Retirement: HTTP 410 Gone vs 308 Redirect

* **Context:** The current repository contains prototype routes (`/api/auth/login`, `/api/content`, `/api/enquiries`, `/api/upload`, `/api/analytics`, `/admin/*`). These must be decommissioned without confusing legacy clients or breaking SEO.
* **Options Considered:**
  1. *Silent Deletion (HTTP 404):* Remove route files immediately.
  2. *Explicit Semantics (HTTP 410 Gone & 308 Permanent Redirect):* Redirect `/api/enquiries` to `/api/leads`; return explicit HTTP 410 Gone with deprecation JSON payload for internal prototype endpoints.
* **Evaluation:**
  - Explicit HTTP 410 and 308 status codes provide clear diagnostic signals to web clients, crawlers, and legacy integrations.
* **Architect Recommendation:** **Option 2 (308 Redirect for `/api/enquiries` to `/api/leads`; 410 Gone for prototype endpoints)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Lead Backend Architect
* **Impacted Endpoints:** All legacy prototype routes.

---

### DEC-API-13: Phone & Country Ingestion: E.164 International Format

* **Context:** Legacy forms stored country names as free text and raw phone strings without dialing codes. This caused CRM routing failures when sales teams attempted outbound calls.
* **Options Considered:**
  1. *Unrestricted String:* Store raw user input.
  2. *E.164 International Standard:* Frontend uses `intl-tel-input` to enforce country codes; backend validates with Google's `libphonenumber` format (`+<CountryCode><SubscriberNumber>`).
* **Evaluation:**
  - E.164 guarantees direct CRM tele-dialer compatibility and geographic routing.
* **Architect Recommendation:** **Option 2 (Strict E.164 format with ISO 3166-1 alpha-2 country code)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Fullstack Lead
* **Impacted Endpoints:** `POST /api/leads`, `POST /api/careers/apply`.

---

### DEC-API-14: SAP Consultation & Lead Enrichment Attribution

* **Context:** High-value enterprise SAP leads require full marketing attribution (UTM source, campaign, ad group, landing page URL, referring domain) passed to sales pipelines.
* **Options Considered:**
  1. *Flat Form Fields Only:* Ignore marketing attribution.
  2. *Structured Attribution Object:* Client JavaScript parses URL query parameters and document referrer, packing them into an `attribution` payload object stored with the lead and pushed to the CRM.
* **Evaluation:**
  - Attribution tracking provides ROI metrics for digital advertising spend on LinkedIn and Google Ads.
* **Architect Recommendation:** **Option 2 (Structured `attribution` payload schema + GTM `sap_demo_request_success` event)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Marketing Technologist & Integration Architect
* **Impacted Endpoints:** `POST /api/leads`.

---

### DEC-API-15: Candidate Application Duplicate Submission Threshold

* **Context:** Candidates frequently submit multiple identical applications for the same job requisition, creating recruiter fatigue and ATS bloat.
* **Options Considered:**
  1. *Allow Unlimited Submissions:* Accept every submission without validation.
  2. *Hard Block 30-Day Window:* If an application with the same email and `jobId` was received in the past 30 days, reject with `409 Conflict`.
  3. *Update Existing Record:* Overwrite previous application.
* **Evaluation:**
  - A 30-day deduplication window prevents spam and accidental double-clicks while permitting re-application after a reasonable time.
* **Architect Recommendation:** **Option 2 (30-day deduplication lock based on SHA-256 hash of email + jobId)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Recruitment Operations Lead
* **Impacted Endpoints:** `POST /api/careers/apply`.

---

### DEC-API-16: CMS Media Storage: Azure Blob Storage Provider

* **Context:** The prototype stored uploaded files on local server disk (`public/uploads`), which fails on ephemeral container hosting (Azure App Service).
* **Options Considered:**
  1. *Local Persistent Volume:* Azure Files CIFS share mounted to container.
  2. *Azure Blob Storage Provider:* Configure Strapi 5 with `@strapi/provider-upload-azure-storage` writing directly to Azure Blob container `media-public` behind Azure CDN.
* **Evaluation:**
  - Blob storage provides 99.999999999% (11 9s) durability, zero server disk consumption, and native CDN caching.
* **Architect Recommendation:** **Option 2 (Strapi Azure Blob Storage Provider with CDN acceleration)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Cloud DevOps Lead
* **Impacted Endpoints:** Strapi `POST /api/upload`.

---

### DEC-API-17: Webhook Security: ATS Signature Verification

* **Context:** The ATS webhook (`POST /api/integrations/ats/jobs`) accepts job updates that modify public website content. The endpoint must verify that calls originate strictly from the authorized ATS.
* **Options Considered:**
  1. *Shared Secret in Query String:* `?token=XYZ`
  2. *Fixed Authorization Bearer Token:* Constant bearer token in header.
  3. *HMAC-SHA256 Payload Signature with Timestamp Skew Check:* ATS computes `HMAC-SHA256(timestamp + "." + body, secret)` and sends it in `X-Nexucon-ATS-Signature`. Next.js verifies signature and rejects requests with timestamp skew > 300 seconds.
* **Evaluation:**
  - HMAC-SHA256 prevents replay attacks, tamper attacks, and credential sniffing.
* **Architect Recommendation:** **Option 3 (HMAC-SHA256 signature + 300s timestamp tolerance)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Security Engineer & Integration Architect
* **Impacted Endpoints:** `POST /api/integrations/ats/jobs`.

---

### DEC-API-18: Next.js Draft Mode Preview Architecture

* **Context:** Marketing authors in Strapi need to preview draft pages and blog articles on the actual Next.js frontend before publishing.
* **Options Considered:**
  1. *Staging Environment Only:* Drafts only visible by deploying a separate staging server.
  2. *Next.js Native Draft Mode:* Strapi preview button launches `/api/draft?secret=...&slug=...&type=...`. Next.js verifies the secret, calls `draftMode().enable()`, and redirects with a cryptographically signed cookie `__prerender_bypass`.
* **Evaluation:**
  - Next.js Draft Mode allows instant, secure previews on the production site without deploying separate staging environments.
* **Architect Recommendation:** **Option 2 (Next.js Draft Mode via secure preview route handler)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Senior Frontend Lead
* **Impacted Endpoints:** `GET /api/draft`.

---

### DEC-API-19: Structured Data (JSON-LD) for Job Requisitions

* **Context:** Job requisitions must be discovered by Google for Jobs, LinkedIn, and major job aggregators to maximize organic candidate acquisition.
* **Options Considered:**
  1. *Standard HTML Text:* Plain HTML descriptions only.
  2. *Schema.org `JobPosting` JSON-LD:* Embed rich structured data (`title`, `description`, `datePosted`, `validThrough`, `hiringOrganization`, `jobLocation`, `baseSalary`) in the `<head>` of `/careers/[slug]`.
* **Evaluation:**
  - Structured JSON-LD is the required industry standard for Google for Jobs indexing.
* **Architect Recommendation:** **Option 2 (Schema.org `JobPosting` JSON-LD generated server-side)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** SEO / Technical Lead
* **Impacted Endpoints:** `GET /api/careers/jobs/[slug]`.

---

### DEC-API-20: Telemetry Architecture: GA4 + App Insights vs Database

* **Context:** Prototype route `/api/analytics` logged client clicks directly to MongoDB, threatening database performance.
* **Options Considered:**
  1. *Maintain Custom DB Telemetry:* Expand MongoDB analytics collection.
  2. *Enterprise Telemetry Stack:* Client-side marketing telemetry tracked via Google Analytics 4 (GA4) deployed through Google Tag Manager (GTM); server-side API telemetry and health tracked via Azure Application Insights.
* **Evaluation:**
  - GA4 provides advanced marketing attribution and funnel analysis; Application Insights provides distributed tracing, exception alerts, and performance metrics without adding database load.
* **Architect Recommendation:** **Option 2 (Enterprise Telemetry Stack; deprecate custom analytics API)**.
* **Decision Status:** `[APPROVED-TARGET]`
* **Owner:** Analytics Architect & Lead DevOps Engineer
* **Impacted Endpoints:** Decommission `POST /api/analytics`.
