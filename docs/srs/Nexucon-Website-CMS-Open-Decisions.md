# Open Decisions Register: Nexucon Website & CMS Rebuild

**Document Reference:** NEX-DEC-REG-v1.0  
**Project:** Nexucon Company Website & Marketing CMS Platform  
**Status:** Active Governance Document  
**Last Updated:** September 22, 2026  

---

## Overview

This register formally logs all architectural, operational, security, and product decisions that require stakeholder determination or validation. Each item specifies the technical context, impact, evaluated options, recommended course of action, assigned decision owner, required milestone, and current status.

---

## Register of Open Decisions

### OD-01: Strapi 5 Edition Selection (Community Edition vs. Cloud/Enterprise Plan)
* **Question / Decision:** Should the marketing CMS launch on Strapi 5 Community Edition (Self-Hosted on Azure App Service) or upgrade to Strapi Cloud / Enterprise Edition?
* **Why It Matters:** Strapi Community Edition enforces constraints: single-locale in free tier (if internationalization plugin requires advanced licensing), maximum of 3 default admin roles (Super Admin, Editor, Author), and lack of granular field-level permissions or audit logs. If marketing requires custom reviewer roles or multi-market localization at launch, licensing costs must be budgeted.
* **Options:**
  * **Option A (Recommended for Initial Launch):** Deploy Strapi 5 Community Edition self-hosted on Azure App Service with custom middleware for basic audit logging. Stick to standard 3 roles (Super Admin, Editor, Author) for Release 1–2.
  * **Option B:** Purchase Strapi Enterprise / Cloud License (\$99–\$499/mo) to unlock granular custom RBAC, audit log trails, and unlimited review workflows.
* **Recommendation:** **Option A** for initial launch to preserve cost boundaries (< \$350/mo total cloud budget). Re-evaluate upgrade at Release 3 if marketing workflows demand more than 3 distinct role configurations.
* **Owner:** Technical Architect & Head of Digital Marketing
* **Required-By Milestone:** Release 0 (Architecture Finalization)
* **Status:** PROPOSED

---

### OD-02: Careers Architecture: Headless Next.js Subsystem vs. Independent Microservice
* **Question / Decision:** Should the public Careers portal and application submission API be built inside the primary Next.js App Router workspace (as isolated route groups) or deployed as an independent Node.js container microservice?
* **Why It Matters:** Running Careers within Next.js simplifies deployment, eliminates cross-origin complexity, shares the Tailwind design system, and maximizes Google search indexing. However, failure isolation and distinct security boundaries are needed to ensure recruitment traffic or candidate data never intersects with the CMS.
* **Options:**
  * **Option A (Recommended):** Build Careers within the primary Next.js application using isolated Route Groups (`app/(careers)/*`) and dedicated API routes (`app/api/careers/*`), with strict code boundaries and separate backend storage endpoints.
  * **Option B:** Deploy a standalone Careers microservice on a separate Azure App Service (`careers.nexucon.com`).
* **Recommendation:** **Option A**. Keeping the frontend in the same Next.js workspace ensures uniform domain authority (`nexucon.com/careers`) for SEO, consistent CSS styling, and zero multi-service latency, while enforcing strict backend isolation via separate PostgreSQL schemas and private Azure Blob containers.
* **Owner:** Technical Architect & Recruitment Lead
* **Required-By Milestone:** Release 1
* **Status:** PROPOSED

---

### OD-03: ATS Requisition & Candidate Synchronization Protocol
* **Question / Decision:** What communication protocol and integration pattern should govern synchronization between the Next.js Careers engine and Nexucon's existing ATS / Staff Augmentation Portal?
* **Why It Matters:** If the ATS lacks outbound webhook capability, the website must poll the ATS for active job postings. If candidate applications cannot be received synchronously by the ATS, an asynchronous message queue or outbox worker is required to prevent lost resumes.
* **Options:**
  * **Option A (Direct REST Webhooks + Event Polling Fallback):** The ATS pushes new requisitions via signed webhooks; candidate submissions are pushed synchronously via HTTPS REST with fallback to an encrypted PostgreSQL outbox table.
  * **Option B (Asynchronous Queue via Azure Service Bus):** Decouple ATS messaging entirely through Azure Service Bus queues.
* **Recommendation:** **Option A**. To keep initial Azure infrastructure costs low, utilize direct HTTPS REST calls with an application-level PostgreSQL transactional outbox. Defer Azure Service Bus until candidate volume exceeds 5,000 applications/month.
* **Owner:** ATS Technical Owner & Solution Architect
* **Required-By Milestone:** Release 2
* **Status:** TBD WITH ATS OWNER

---

### OD-04: CRM Lead Pipeline Ingestion & Outbox Retry Strategy
* **Question / Decision:** How should contact form submissions and campaign consultation leads be guaranteed delivery into the corporate Lead Management / CRM Portal without dropping leads during CRM maintenance?
* **Why It Matters:** The current prototype writes enquiries only to a local MongoDB collection with zero CRM forwarding. Sales leads are high-value revenue opportunities; an outage on the CRM portal must not cause submission errors to website visitors.
* **Options:**
  * **Option A (Transactional Outbox in PostgreSQL with Background Worker):** Store leads immediately in a local encrypted database table with status `PENDING`, then dispatch to CRM. If CRM returns HTTP 5xx or times out, a Next.js cron/background worker retries with exponential backoff.
  * **Option B (Direct REST Call with User Error on Failure):** Post directly to CRM; if CRM fails, display "System temporarily busy" to user.
* **Recommendation:** **Option A**. Leads are persisted instantly and acknowledged to the visitor (`201 Created`), while the outbox engine guarantees delivery with automatic retry (up to 5 attempts over 24 hours).
* **Owner:** CRM / Lead Portal Owner & Full-Stack Lead
* **Required-By Milestone:** Release 2
* **Status:** PROPOSED

---

### OD-05: Internal Administration Authentication: Microsoft Entra ID vs. Native Database Auth
* **Question / Decision:** Should internal staff (Careers administrators, recruiters, and marketing leadership) authenticate via corporate Microsoft Entra ID (Azure AD SSO) or separate database credentials?
* **Why It Matters:** The prototype currently uses a hardcoded bcrypt admin hash and JWT cookies. Corporate security policy (SOC 2, ISO 27001) mandates centralized employee offboarding, session revocation, and Multi-Factor Authentication (MFA).
* **Options:**
  * **Option A (Hybrid Enterprise Model):** Integrate Next.js Careers Admin and internal portals with Microsoft Entra ID via OpenID Connect (NextAuth / Auth.js). Retain native Strapi authentication for CMS authors if Strapi SSO requires an Enterprise license.
  * **Option B (Pure Database Credentials):** Use local email/password authentication with enforced bcrypt (12 rounds) and separate database tables across all portals.
* **Recommendation:** **Option A**. Implement Microsoft Entra ID for internal Next.js administration and Careers management to enforce corporate MFA and centralized lifecycle management. For Strapi Community Edition, enforce complex passwords and IP whitelisting until an enterprise SSO add-on is justified.
* **Owner:** Security Architect & IT Administrator
* **Required-By Milestone:** Release 1 (CMS) & Release 2 (Careers)
* **Status:** PROPOSED

---

### OD-06: Candidate Resume File Validation & Antivirus Scanning Architecture
* **Question / Decision:** How should candidate resumes be inspected for malware, invalid MIME types, and embedded macros before being committed to private Azure Blob Storage?
* **Why It Matters:** Allowing arbitrary file uploads (PDF, DOCX) creates severe vulnerabilities (trojans, ransomware, macro attacks) that could compromise internal recruiter workstations.
* **Options:**
  * **Option A (In-Process Magic-Byte Validation + Azure Defender for Storage):** Next.js API validates file headers (`file-type` binary magic bytes, strict extension allowlist, 5MB limit), writes to a quarantine blob container, and Azure Defender for Storage scans asynchronously before moving to the active container.
  * **Option B (Containerized ClamAV Sidecar):** Deploy a container running ClamAV to scan files synchronously in-flight before blob upload.
* **Recommendation:** **Option A**. Binary magic-byte validation catches spoofed files immediately in memory. Azure Defender for Storage provides zero-maintenance cloud-native malware scanning without requiring dedicated VM resources.
* **Owner:** Security Architect & DevOps Engineer
* **Required-By Milestone:** Release 2
* **Status:** PROPOSED

---

### OD-07: Gemini AI Integration: Server-Side Governance & Prompt Safeguards
* **Question / Decision:** How should Google Gemini API capabilities (draft metadata generation, SEO brief expansion, FAQ structuring) be governed within the CMS editorial workflow?
* **Why It Matters:** AI-generated claims regarding SAP certifications, client case study metrics, or technical SLAs must never bypass human review. API tokens must be strictly secured, and candidate resumes or client confidential data must never be transmitted to external AI endpoints.
* **Options:**
  * **Option A (Server-Side Micro-Tool with Human-in-the-Loop Sign-off):** Gemini 1.5/2.0 Flash is invoked strictly server-side via Next.js Route Handlers / Strapi custom controllers. Prompts are templatized with system instructions prohibiting hallucinated claims. Content is saved in `DRAFT` state only; automated publishing is blocked.
  * **Option B (Clientside Browser Integration):** Marketing editors invoke Gemini via browser extensions or client JavaScript.
* **Recommendation:** **Option A**. All AI calls originate server-side using Azure Key Vault secrets. Strict output validation ensures AI-suggested content is always labeled as unverified draft until approved by an editor. Candidate data is cryptographically blacklisted from entering any AI prompt pipeline.
* **Owner:** AI Specialist & Digital Marketing Lead
* **Required-By Milestone:** Release 3
* **Status:** PROPOSED

---

### OD-08: Content & Redirect Migration Strategy from Legacy PHP/HTML Web Estate
* **Question / Decision:** How should legacy URLs (including `.php` and `.html` endpoints discovered in legacy settings and server configurations) be inventoried, mapped, and preserved?
* **Why It Matters:** The existing database configuration references `<!-- header.php -->` and historic URLs. Unmapped legacy links will trigger 404 errors, destroy accumulated Google PageRank, and break inbound backlinks.
* **Options:**
  * **Option A (Next.js Middleware + Strapi Managed Redirect Table):** Preload an immutable map of known legacy `.php` and `.html` URLs in Next.js `middleware.ts` for instant 301 execution at the edge. Allow marketing to manage dynamic vanity redirects via a Strapi `Redirect` collection type.
  * **Option B (Pure Strapi Redirect Plugin):** Query Strapi on every 404 response to determine if a redirect exists.
* **Recommendation:** **Option A**. Edge middleware evaluates known legacy redirects in sub-5ms without database roundtrips. Strapi-managed vanity redirects are cached in memory using Next.js tag-based ISR.
* **Owner:** SEO Specialist & Full-Stack Lead
* **Required-By Milestone:** Release 1 (Core Redirects) & Release 3 (Comprehensive Cutover Audit)
* **Status:** PROPOSED

---

### OD-09: Edge Delivery & Bot Protection: Cloudflare Free/Pro vs. Azure Front Door
* **Question / Decision:** Should edge DNS, SSL termination, and bot protection be handled by Cloudflare (Free/Pro) or Azure Front Door Standard?
* **Why It Matters:** Azure Front Door Standard incurs a baseline cost of ~\$35/month + data egress fees, whereas Cloudflare Free/Pro provides industry-standard DDoS mitigation, Turnstile bot protection (replacing reCAPTCHA), and global CDN caching at \$0–\$20/month.
* **Options:**
  * **Option A (Recommended):** Place Cloudflare (Pro plan, \$20/mo) in front of the Azure App Service. Utilize Cloudflare Turnstile for contact form bot protection and edge caching for static assets.
  * **Option B:** Deploy Azure Front Door Standard as the native Azure ingress controller.
* **Recommendation:** **Option A**. Cloudflare provides superior bot filtering (Turnstile), instant DNS propagation, and web application firewall rules at an extremely low price point, directly honoring the lean budget mandate.
* **Owner:** DevOps Engineer & Security Architect
* **Required-By Milestone:** Release 0
* **Status:** PROPOSED

---

### OD-10: Database Sizing & Burstable Tier Scaling Thresholds
* **Question / Decision:** What initial SKU should be provisioned for Azure Database for PostgreSQL Flexible Server, and what telemetry triggers an upgrade?
* **Why It Matters:** A Burstable B1ms / B2s instance costs ~\$25–\$50/month, making it ideal for launch. However, connection pooling and CPU limits must be governed so that concurrent Strapi API requests and Next.js revalidations do not exhaust database connections.
* **Options:**
  * **Option A (Burstable B2s with PgBouncer Enabled):** Provision B2s (2 vCPU, 4GB RAM) with built-in PgBouncer connection pooling enabled. Set Application Insights alert on CPU > 75% for 15 minutes to trigger vertical scale to General Purpose (GP_Standard_D2ds_v5).
  * **Option B:** Start directly with General Purpose tier (~\$140/month).
* **Recommendation:** **Option A**. Built-in PgBouncer handles Next.js serverless connection spikes seamlessly, keeping baseline infrastructure spend well below the monthly ceiling.
* **Owner:** Infrastructure Architect & Database Administrator
* **Required-By Milestone:** Release 0
* **Status:** PROPOSED
