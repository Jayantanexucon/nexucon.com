# Nexucon Website & Marketing CMS Platform: API Architecture Catalogue & Index

**Document Reference:** NEX-API-CAT-v1.0  
**Project:** Nexucon Corporate Website, Careers Engine & Marketing CMS Platform  
**Target Release:** Production Launch (Releases 1, 2, 3)  
**Status:** Draft for Backend, Frontend, Integration, Security, and QA Review  
**Standard Response Contract:** Enforced  
**Document Type:** Master API Index & Architectural Guide  

---

## 1. Document Suite Overview

This API Architecture Catalogue serves as the central index and entry point for the implementation-ready specification suite governing the Nexucon digital ecosystem. Detailed technical requirements, contracts, data schemas, and governance policies are partitioned across specialized reference documents:

| Specification Document | Document Code | Description & Target Audience |
| :--- | :--- | :--- |
| **[Master API Specification v1.0](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-API-Specification-v1.0.md)** | `NEX-API-SPEC-v1.0` | Comprehensive 27-section API contract covering architectural context, endpoint specifications (A–O format), response envelopes, Zod schemas, PostgreSQL DDL, and resilience patterns. Primary contract for all engineers. |
| **[OpenAPI 3.1 Definition](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-OpenAPI-v1.0.yaml)** | `NEX-API-OAS-v1.0` | Machine-readable OpenAPI 3.1 YAML definition covering all public endpoints, Strapi managed paths, security schemes (Bearer, Entra ID, HMAC, Turnstile), parameters, and reusable schemas. |
| **[API Field Mapping Matrix](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-API-Field-Mapping.md)** | `NEX-API-MAP-v1.0` | Field-by-field crosswalk mapping legacy HTML forms (`contact.html`, `sap-business-one.html`), Careers SPA components, target Zod schemas, database models, and external CRM/ATS payloads. |
| **[API Error Catalogue](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-API-Error-Catalogue.md)** | `NEX-API-ERR-v1.0` | Centralized inventory of 42 error codes categorized by domain (`COM-*`, `LEAD-*`, `CAR-*`, `ATS-*`, `CMS-*`, `LEGACY-*`), with HTTP statuses, user-safe messages, log formats, alert severities, and retry rules. |
| **[API Test Matrix & QA Plan](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-API-Test-Matrix.md)** | `NEX-API-TST-v1.0` | 45-case QA verification matrix spanning functional, boundary, negative, security (magic bytes, Turnstile, XSS), idempotency, rate limiting, and failure resilience test suites. |
| **[API Decision Register](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-API-Decision-Register.md)** | `NEX-API-DEC-v1.0` | Formal architectural decision records (ADRs) evaluating options, trade-offs, and governance rationale across 20 critical integration, security, and infrastructure decisions. |
| **[API Retirement & Migration Plan](file:///Users/avishekchakraborty/dev/Website_projs_B1/next_nexucon_website/nexucon.com/docs/srs/Nexucon-Website-CMS-API-Retirement-Plan.md)** | `NEX-API-RET-v1.0` | Phased decommissioning strategy, data migration path, traffic redirection (HTTP 410 vs 308), Consumer Migration Playbook, and sign-off checklist for 9 legacy prototype routes. |

---

## 2. API Landscape & Domain Inventory

The target ecosystem is structured into four distinct operational tiers:

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

### Domain A: Public Web & Inbound Lead APIs (Next.js BFF)
* **`POST /api/leads`** `[PROPOSED]`: Ingests general contact enquiries, SAP consultation requests, and campaign landing submissions. Enforces Turnstile bot verification, E.164 phone formatting, UTM attribution capture, and PostgreSQL Transactional Outbox persistence for zero-loss CRM dispatch.

### Domain B: Cache Management & CMS Preview APIs
* **`POST /api/revalidate`** `[PROPOSED]`: Webhook invoked by Strapi 5 upon content publishing to purge Next.js tag-based ISR caches instantly.
* **`GET /api/draft`** `[PROPOSED]`: Enables Next.js Draft Mode via secure one-time secret tokens, setting 60-minute preview cookies for marketing editors.

### Domain C: Careers & Candidate Recruitment Engine (Decoupled Engine)
* **`GET /api/careers/jobs`** `[PROPOSED]`: Public job feed supporting practice area, location, and employment type filtering with 15-minute ISR tag caching.
* **`GET /api/careers/jobs/[slug]`** `[PROPOSED]`: Single job requisition view delivering detailed responsibilities, qualifications, and Schema.org `JobPosting` JSON-LD markup.
* **`POST /api/careers/apply`** `[PROPOSED]`: Ingests candidate applications and resume files (PDF/DOCX, max 5 MB; legacy baseline 4 MB PDF). Performs in-memory binary magic-byte inspection, stores files in private Azure Blob Storage (`resumes-private`), and queues ATS synchronization.
* **`GET /api/careers/admin/applications/[id]/resume-url`** `[PROPOSED]`: Generates a temporary, 15-minute Azure Shared Access Signature (SAS) download URL for authorized recruiters authenticated via Microsoft Entra ID (`Nexucon.Recruiter`).

### Domain D: Enterprise Integration Adapters (ATS & CRM)
* **`POST /api/integrations/ats/jobs`** `[PROPOSED CONTRACT - PENDING ATS OWNER SIGN-OFF]`: Inbound webhook ingesting job requisition lifecycle events from the corporate ATS. Secured with HMAC-SHA256 signatures (`X-Nexucon-ATS-Signature`) and timestamp skew verification.
* **Outbound CRM Dispatch Adapter** `[PROPOSED CONTRACT - PENDING CRM OWNER SIGN-OFF]`: Asynchronous background worker dispatching normalized lead payloads to the Corporate CRM Gateway with exponential retry backoff.

### Domain E: Headless Marketing CMS APIs (Strapi 5 Managed)
* **`GET /api/global-setting`**, **`GET /api/pages`**, **`GET /api/services`**, **`GET /api/blogs`**, **`GET /api/case-studies`**, **`GET /api/redirects`**, **`POST /api/upload`**: Managed Strapi 5 Content APIs consumed server-side by Next.js React Server Components and backed by Azure Blob Storage.

---

## 3. As-Is Prototype Route Retirement Summary

All 9 prototype routes in the existing Next.js repository are systematically retired under the schedule defined in `NEX-API-RET-v1.0`:

| Legacy Endpoint | Current File Path | Target Architecture Disposition | HTTP Status |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | `app/api/auth/login/route.ts` | Replace with Microsoft Entra ID SSO & Strapi Native Auth | `410 Gone` |
| `POST /api/auth/logout` | `app/api/auth/logout/route.ts` | Replace with Entra ID Single Sign-Out | `410 Gone` |
| `GET /api/content` | `app/api/content/route.ts` | Replace with Strapi 5 REST API + Next.js ISR | `410 Gone` |
| `POST /api/content` | `app/api/content/route.ts` | Replace with Strapi Content Manager | `410 Gone` |
| `POST /api/enquiries` | `app/api/enquiries/route.ts` | Redirect to target `POST /api/leads` + Outbox adapter | `308 Permanent Redirect` |
| `POST /api/upload` | `app/api/upload/route.ts` | Replace with Strapi Azure Blob Storage Provider | `410 Gone` |
| `POST /api/analytics` | `app/api/analytics/route.ts` | Replace with Google Analytics 4 (via GTM) & Azure App Insights | `410 Gone` |
| `POST /admin/create-user` | `app/admin/create-user/route.ts` | Replace with Microsoft Entra ID user provisioning | `410 Gone` |
| `POST /admin/save-settings` | `app/admin/save-settings/route.ts` | Replace with Strapi Single Type `GlobalSiteSettings` | `410 Gone` |

---

## 4. Governance & Classification Legend

All APIs, schemas, and architectural components are governed under the following classification taxonomy:
- **`[VERIFIED-AS-IS]`**: Features and behaviors inspected and confirmed in the codebase (`nexucon.com` or `Nexucon-Main-Page`).
- **`[APPROVED-TARGET]`**: Formally approved target architecture contracts for production delivery (0 items currently approved).
- **`[PROPOSED]`**: Recommended industry best-practice patterns awaiting final stakeholder review.
- **`[EXAMPLE-ONLY]`**: Non-binding illustrative schema placeholders.
- **`[TBD WITH OWNER]`**: External integration interfaces requiring confirmation from third-party system owners.

---

## 5. Change Log & Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| **v1.0** | 2026-09-23 | Solution Architecture Team | Initial API Catalogue index. |
| **v1.1** | 2026-09-23 | Principal API Architect | **Contract Consistency Review & Reconciliation:**<br>1. Updated document status to `Draft for Backend, Frontend, Integration, Security, and QA Review`.<br>2. Reclassified all target contracts from `[APPROVED-TARGET]` to `[PROPOSED]` to enforce project governance.<br>3. Aligned document cross-references across all 7 companion specifications.<br>4. Updated Test Matrix reference to 45 test scenarios.<br>5. Noted Consumer Migration Playbook in Retirement Plan. |
