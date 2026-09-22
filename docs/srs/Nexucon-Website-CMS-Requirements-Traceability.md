# Requirements Traceability Matrix: Nexucon Website & CMS Platform

**Document Reference:** NEX-RTM-v1.0  
**Project:** Nexucon Company Website & Marketing CMS Platform  
**Target Release:** Production Launch (Releases 0 through 4)  
**Standard Compliance:** ISO/IEC/IEEE 29148:2018  

---

## 1. Overview and Tracing Methodology

This Requirements Traceability Matrix (RTM) links each functional and non-functional requirement from its high-level business objective to its architecture component, software module, test specification, and release milestone.

### Verification Methods:
* **TEST (T):** Automated unit, integration, or end-to-end execution.
* **INSPECTION (I):** Static analysis, code review, or visual layout review.
* **DEMONSTRATION (D):** Interactive workflow validation during sprint review.
* **AUDIT (A):** Formal third-party or security scan, penetration test, or compliance check.

---

## 2. Functional Requirements Traceability Matrix

| Requirement ID | Requirement Title | Business Objective | Source | Architecture Component | Implementation Module | Test Case ID | Target Release | Method | Status | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-WEB-01** | Responsive Enterprise Homepage | Brand Authority & Client Inbound | Code / Decision | Next.js App Router | `app/page.tsx` | `TC-WEB-001` | Release 1 | D, T | Planned | Frontend Lead |
| **FR-WEB-02** | Specialized Practice Pages (SAP, AI, Cloud) | Inbound Lead Generation | Code / Decision | Next.js App Router | `app/services/[slug]/page.tsx` | `TC-WEB-002` | Release 1 | D, T | Planned | Frontend Lead |
| **FR-WEB-03** | Enterprise Case Study Hub | Social Proof & Conversion | Roadmap / Decision | Next.js App Router | `app/work/[slug]/page.tsx` | `TC-WEB-003` | Release 1 | D, T | Planned | Frontend Lead |
| **FR-WEB-04** | Thought Leadership Insights & Blog | Organic Search & Domain Authority | Code / Decision | Next.js App Router | `app/insights/[slug]/page.tsx` | `TC-WEB-004` | Release 1 | D, T | Planned | SEO Lead |
| **FR-WEB-05** | Dynamic Global Navigation & Footer | Seamless UX & Brand Navigation | Code / Decision | Next.js Root Layout | `app/layout.tsx`, `components/Nav.tsx` | `TC-WEB-005` | Release 1 | D, I | Planned | Frontend Lead |
| **FR-WEB-06** | Custom 404 & 500 Resilient Error Pages | Brand Protection & Bounce Reduction | Proposed Standard | Next.js Error Boundaries | `app/not-found.tsx`, `app/error.tsx` | `TC-WEB-006` | Release 1 | T | Planned | Frontend Lead |
| **FR-CMS-01** | Strapi 5 Headless CMS Deployment | Autonomous Marketing Publishing | Explicit Decision | Strapi on Azure App Service | `strapi-server/` | `TC-CMS-001` | Release 1 | D, A | Planned | DevOps Lead |
| **FR-CMS-02** | Structured Content Schemas & Dynamic Zones | Consistent Enterprise Branding | Explicit Decision | Strapi Content-Type Builder | `api/page/content-types/page/` | `TC-CMS-002` | Release 1 | D, I | Planned | Solution Architect |
| **FR-CMS-03** | Draft & Publish Governance Workflow | Content Quality Assurance | Explicit Decision | Strapi Content Engine | `strapi-server/config/` | `TC-CMS-003` | Release 1 | D | Planned | Marketing Lead |
| **FR-CMS-04** | Next.js Live Draft Mode Preview | Frictionless Editorial Review | Explicit Decision | Next.js Draft Mode + Strapi | `app/api/draft/route.ts` | `TC-CMS-004` | Release 1 | D, T | Planned | Full-Stack Lead |
| **FR-CMS-05** | Instant Cache Invalidation Webhooks | Sub-Second Content Publishing | Explicit Decision | Next.js ISR Tag Revalidation | `app/api/revalidate/route.ts` | `TC-CMS-005` | Release 1 | T | Planned | Backend Lead |
| **FR-SEO-01** | Dynamic Metadata & Canonical URL Injection | Organic Search Rankings | Code / Decision | Next.js `generateMetadata` | `lib/seo.ts`, `app/[slug]/page.tsx` | `TC-SEO-001` | Release 1 | T, I | Planned | SEO Lead |
| **FR-SEO-02** | Dynamic XML Sitemap Generation | Search Engine Indexing | Proposed / Roadmap | Next.js Dynamic Sitemap | `app/sitemap.ts` | `TC-SEO-002` | Release 1 | T, I | Planned | SEO Lead |
| **FR-SEO-03** | Dynamic Robots.txt Generation | Crawl Budget & Security | Proposed / Roadmap | Next.js Dynamic Robots | `app/robots.ts` | `TC-SEO-003` | Release 1 | T, I | Planned | SEO Lead |
| **FR-SEO-04** | Structured Schema Graph (JSON-LD) | Rich Snippets & Search Visibility | Code / Decision | Next.js Schema Components | `components/StructuredData.tsx` | `TC-SEO-004` | Release 1 | T, I | Planned | SEO Lead |
| **FR-SEO-05** | Legacy 301 Redirect Engine (.php/.html) | Preservation of Historic PageRank | Code / Decision | Next.js Edge Middleware | `middleware.ts` | `TC-SEO-005` | Release 1 | T | Planned | SEO Lead |
| **FR-CAR-01** | Public Job Directory & Filter Engine | Talent Acquisition Pipeline | Explicit Decision | Next.js App Router | `app/careers/page.tsx` | `TC-CAR-001` | Release 2 | D, T | Planned | Full-Stack Lead |
| **FR-CAR-02** | Job Requisition Detail & Schema Markup | High-Converting Candidate Inbound | Explicit Decision | Next.js App Router | `app/careers/[slug]/page.tsx` | `TC-CAR-002` | Release 2 | D, T | Planned | Full-Stack Lead |
| **FR-CAR-03** | Candidate Application & Resume Upload | Seamless Candidate Onboarding | Explicit Decision | Next.js Server Action / API | `app/api/careers/apply/route.ts` | `TC-CAR-003` | Release 2 | T, A | Planned | Full-Stack Lead |
| **FR-CAR-04** | Candidate Data Isolation from Strapi | Strict Candidate Data Privacy | Explicit Decision | Dedicated PostgreSQL Schema | `lib/careers-db.ts` | `TC-CAR-004` | Release 2 | A, I | Planned | Security Architect |
| **FR-CAR-05** | Private Blob Resume Storage & SAS Access | Zero Public File Exposure | Explicit Decision | Azure Blob Private Container | `lib/blob-private.ts` | `TC-CAR-005` | Release 2 | T, A | Planned | Security Architect |
| **FR-ATS-01** | Two-Way ATS Requisition Synchronization | Automated Job Management | Explicit Decision | Inbound ATS Webhook / Poller | `app/api/integrations/ats/jobs/` | `TC-ATS-001` | Release 2 | T, D | Planned | Backend Lead |
| **FR-ATS-02** | Candidate Application Forwarding to ATS | Automated Candidate Pipeline | Explicit Decision | Outbound REST Client | `lib/integrations/ats-client.ts` | `TC-ATS-002` | Release 2 | T, D | Planned | Backend Lead |
| **FR-ATS-03** | ATS Ingestion Outbox & Failure Queue | Zero Candidate Drop Guarantee | Explicit Decision | PostgreSQL Outbox Table | `lib/outbox/ats-outbox.ts` | `TC-ATS-003` | Release 2 | T | Planned | Backend Lead |
| **FR-CRM-01** | Contact Form Edge Validation & Spam Block | Lead Ingestion Integrity | Code / Decision | Next.js API + Turnstile | `app/api/leads/route.ts` | `TC-CRM-001` | Release 2 | T | Planned | Backend Lead |
| **FR-CRM-02** | Comprehensive UTM & Attribution Capture | Multi-Touch ROI Reporting | Explicit Decision | Next.js Client Hook & Lead API | `hooks/useAttribution.ts` | `TC-CRM-002` | Release 2 | T, D | Planned | Marketing Lead |
| **FR-CRM-03** | Outbound Lead Dispatch to Corporate CRM | Automated Sales Pipeline | Explicit Decision | CRM REST Gateway Adapter | `lib/integrations/crm-client.ts` | `TC-CRM-003` | Release 2 | T, D | Planned | Backend Lead |
| **FR-CRM-04** | CRM Outbox Resilient Retry Worker | Zero Lead Loss Guarantee | Explicit Decision | PostgreSQL Outbox Worker | `lib/outbox/crm-outbox.ts` | `TC-CRM-004` | Release 2 | T | Planned | Backend Lead |
| **FR-AUTH-01** | Microsoft Entra ID (Azure AD) Staff Auth | Enterprise SSO & Centralized Identity | Explicit Decision | NextAuth / Auth.js Provider | `app/api/auth/[...nextauth]/` | `TC-AUT-001` | Release 2 | D, A | Planned | Security Architect |
| **FR-AUTH-02** | Strapi CMS Role-Based Access Control | Editorial Boundary Protection | Explicit Decision | Strapi Admin Permissions | `strapi-server/config/admin.js` | `TC-AUT-002` | Release 1 | D, A | Planned | Security Architect |
| **FR-AUTH-03** | Deprecation of Hardcoded Credentials | Eliminate Critical Security Flaw | Verified Bug (`I-01`) | Auth Subsystem | Decommission `app/login/page.tsx` | `TC-AUT-003` | Release 1 | I, A | Planned | Security Architect |
| **FR-MED-01** | Public Marketing Media via Azure Blob | Persistent Cloud Media Assets | Verified Defect (`I-02`) | Azure Blob Storage Provider | `@strapi/provider-upload-azure` | `TC-MED-001` | Release 1 | T, D | Planned | DevOps Lead |
| **FR-MED-02** | Responsive Image Generation & WebP/AVIF | Performance & LCP Optimization | Explicit Decision | Next.js `<Image>` & Strapi | `components/OptimizedImage.tsx` | `TC-MED-002` | Release 1 | T, I | Planned | Frontend Lead |
| **FR-MED-03** | SVG XML Sanitization & Threat Stripping | XSS Elimination | Verified Risk (`R-05`) | Server-side Sanitizer | `lib/security/svg-sanitizer.ts` | `TC-MED-003` | Release 1 | T, A | Planned | Security Architect |
| **FR-ANL-01** | Google Analytics 4 & Tag Manager via Consent | Regulatory Compliant Tracking | Explicit Decision | Consent Banner + GTM Container | `components/AnalyticsGtm.tsx` | `TC-ANL-001` | Release 3 | D, T | Planned | Marketing Lead |
| **FR-ANL-02** | Application Insights APM & Correlation IDs | Infrastructure Observability | Explicit Decision | Node.js App Insights SDK | `instrumentation.ts` | `TC-ANL-002` | Release 0 | T, I | Planned | DevOps Lead |
| **FR-AI-01** | Server-Side Gemini SEO & Metadata Assistant | Augmented Marketing Productivity | Proposed / Decision | Next.js Route Handler | `app/api/ai/seo-assist/route.ts` | `TC-AI-001` | Release 3 | D, T | Planned | AI Lead |
| **FR-AI-02** | AI Output Human-Approval Boundary | Prevention of Brand Hallucinations | Explicit Decision | Strapi Custom Plugin / Draft | `strapi-server/plugins/ai-draft/` | `TC-AI-002` | Release 3 | D, A | Planned | Marketing Lead |
| **FR-MIG-01** | Legacy MongoDB Content Migration to Strapi | Content Continuity | Code / Decision | Node.js Migration Script | `scripts/migrate-mongo-strapi.ts` | `TC-MIG-001` | Release 2 | T, D | Planned | Backend Lead |

---

## 3. Non-Functional Requirements (NFR) Traceability

| NFR ID | Category | Requirement Description | Target Metric / Standard | Verification Method | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NFR-PERF-01** | Performance | Core Web Vitals across all public pages | LCP < 2.0s, INP < 150ms, CLS < 0.05 | Automated Lighthouse CI in GitHub Actions | Frontend Lead |
| **NFR-PERF-02** | Performance | Time to First Byte (TTFB) | TTFB < 500ms on cached pages | Synthetics Monitoring in App Insights | DevOps Lead |
| **NFR-PERF-03** | Performance | Total clientside JavaScript bundle per route | < 120 KB gzip for landing routes | Next.js Build Analyzer bundle check | Frontend Lead |
| **NFR-AVAIL-01** | Availability | Public website uptime SLA | 99.9% uptime (excluding scheduled windows) | Application Insights multi-region ping | DevOps Lead |
| **NFR-AVAIL-02** | Reliability | Recovery Point Objective (RPO) & RTO | RPO < 1 hour, RTO < 4 hours | Annual Disaster Recovery simulation drill | Database Admin |
| **NFR-SCAL-01** | Scalability | Concurrent traffic tolerance | 200 concurrent active users without degradation | Azure Load Testing script (Release 3) | DevOps Lead |
| **NFR-SEC-01** | Security | Transport Layer Security & Protocol Enforcement | TLS 1.3 mandatory, HSTS enabled (1 year) | Qualys SSL Labs Grade A+ Audit | Security Architect |
| **NFR-SEC-02** | Security | Content Security Policy (CSP) & Security Headers | Strict CSP, X-Frame-Options DENY, XSS protection | SecurityHeaders.com Grade A Audit | Security Architect |
| **NFR-SEC-03** | Security | Candidate Resume Access Authorization | Zero public access; SAS token max 15m lifetime | Automated penetration testing | Security Architect |
| **NFR-A11Y-01** | Accessibility | Web Content Accessibility Compliance | WCAG 2.2 Level AA conformance | Axe-core automated tests & manual screen-reader review | UI/UX Lead |
| **NFR-COST-01** | FinOps / Cost | Lean Launch Cloud Infrastructure Spend | Total Azure infrastructure spend < \$350 USD/month | Azure Cost Management budget alerts (\$250, \$350) | Solution Architect |
| **NFR-MAINT-01** | Maintainability | Strict TypeScript & Linting Enforcement | Zero `any` types in production, ESLint clean | GitHub Actions CI blocking check | Full-Stack Lead |
