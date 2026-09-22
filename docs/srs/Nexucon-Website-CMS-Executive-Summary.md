# Executive Summary: Nexucon Website & CMS Rebuild Platform

**Document Reference:** NEX-SRS-EXEC-v1.0  
**Target Release:** Production Launch (Q4 2026 / Q1 2027)  
**Prepared For:** Executive Leadership, Board of Directors, and Department Stakeholders  

---

## 1. Vision, Business Context & Objectives

Nexucon is an enterprise technology consulting and systems engineering firm specializing in autonomous enterprise systems, SAP S/4HANA modernization, enterprise AI/data engineering, cloud modernization, and specialized 24/7 staff augmentation pods. 

To reflect this elite enterprise market positioning, Nexucon is undertaking a complete re-architecture and rebuild of its digital presence. The legacy web estate—characterized by a monolithic, hardcoded prototype running custom admin forms over an unscaled database—is being replaced by a modern, decoupled, secure, and search-optimized digital marketing and talent acquisition ecosystem.

### Core Business Objectives:
1. **Accelerate Client Inbound Conversion:** Present high-converting, authoritative enterprise capability pages, case studies, and strategic advisory pathways for Fortune 500 / Mid-Market buyers.
2. **Drive Organic Search Leadership:** Achieve top-tier technical SEO performance (sub-second TTFB, 100/100 Core Web Vitals, structured schema graphs, and canonical redirect integrity).
3. **Empower Digital Marketing with a Headless CMS:** Provide an intuitive, low-friction content management interface (Strapi 5) with draft/preview workflows, dynamic content modeling, and instant revalidation—without developer intervention.
4. **Segregate Talent Acquisition & Candidate Privacy:** Implement an enterprise Careers portal that feeds directly into Nexucon’s Applicant Tracking System (ATS) while completely isolating candidate PII and resumes from the marketing CMS.
5. **Seamless CRM Pipeline Integration:** Automate the capture, enrichment (UTM/attribution), spam filtering, and routing of website enquiries directly into the corporate Lead Management / CRM portal.
6. **Maintain a Cost-Conscious Cloud Footprint:** Deliver an enterprise-grade, highly available Azure deployment optimized for lean initial operations (under \$350/month) with elastic scaling triggers.

---

## 2. Target Solution Architecture & Clear Boundaries

The target solution enforces a strict three-tier separation of concerns, eliminating cross-contamination between marketing content, enterprise sales leads, and recruitment data:

```
                      +------------------------------------------+
                      |          Cloudflare Edge Network         |
                      |   (DNS, SSL Termination, Turnstile WAF)  |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |         Public Web Application           |
                      |          (Next.js 16 App Router)         |
                      |        Hosted on Azure App Service       |
                      +--------------------+---------------------+
                                           |
        +----------------------------------+----------------------------------+
        |                                  |                                  |
        v                                  v                                  v
+-----------------------+      +-----------------------+      +-----------------------+
|  Marketing CMS Tier   |      | Careers & Talent Tier |      |   Lead Management     |
|       (Strapi 5)      |      |   (Custom API Engine) |      |     (CRM Proxy)       |
|  Content & SEO Hub    |      |  ATS Webhook Bridge   |      |  Outbox Queue Worker  |
+-----------+-----------+      +-----------+-----------+      +-----------+-----------+
            |                              |                              |
            v                              v                              v
+-----------------------+      +-----------------------+      +-----------------------+
| Azure PostgreSQL Flex |      | Private Resume Blob   |      | Corporate CRM Portal  |
| Public Media Storage  |      | Entra ID Admin Auth   |      | REST API Integration  |
+-----------------------+      +-----------------------+      +-----------------------+
```

### Core System Pillars:
* **The Public Experience Layer (Next.js 16 App Router):** Built with React 19 Server Components (RSC), delivering hyper-fast static pages with Incremental Static Regeneration (ISR). Careers, blog posts, service pillars, and industry solutions share a unified, ultra-responsive Tailwind design system.
* **The Marketing CMS Layer (Strapi 5 Headless CMS):** Dedicated exclusively to marketing content editors. Manages landing pages, service descriptions, thought leadership blogs, author profiles, testimonials, redirects, and global site metadata. Utilizes PostgreSQL for structured data and Azure Blob Storage for public media assets.
* **The Careers & Recruitment Layer (Decoupled Subsystem):** Public job listings and application forms are surfaced through Next.js for maximum SEO visibility. However, backend ingestion, candidate profiles, and resume storage are strictly decoupled. Candidate data is **never** written to Strapi. Resumes are stored in a private, encrypted Azure Blob container accessible only via short-lived SAS tokens. Integration with Nexucon's existing ATS ensures two-way requisition synchronization.
* **The CRM & Lead Management Pipeline:** Inbound contact requests and advisory consultations are validated at the edge using Cloudflare Turnstile bot protection, stamped with full UTM and campaign telemetry, and dispatched to the corporate CRM via an idempotent, retry-resilient gateway.

---

## 3. Key Architectural & Operational Decisions

| Architecture Domain | Baseline / Prototype (As-Is) | Target Production Standard (To-Be) | Strategic Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 with ad-hoc client fetches | Next.js 16 App Router (RSC by default, ISR) | Sub-second load times, optimal TTFB, near-zero clientside JS bundle. |
| **Content Management** | Monolithic custom MongoDB models & forms | Strapi 5 Headless CMS (PostgreSQL) | Professional editorial workflow, Draft & Publish, dynamic components. |
| **Careers & Candidate PII** | Non-existent in codebase | Isolated Careers Module + ATS Integration | Strict GDPR/SOC 2 compliance; zero candidate PII exposed to marketing editors. |
| **Resume File Storage** | Ephemeral local disk (`public/uploads`) | Azure Blob Storage (Private container, SAS access) | Immutable persistence, zero public URL exposure, defense against data leakage. |
| **Lead Routing** | Database table with no notifications or CRM | Edge-validated REST dispatch to CRM + Outbox retry | Guaranteed zero lead loss, enriched UTM attribution, automated sales follow-up. |
| **Administration Auth** | Hardcoded admin credentials & simple JWT | Microsoft Entra ID (Azure AD) + Strapi RBAC | Enterprise single sign-on (SSO), mandatory MFA, strict audit trails. |
| **Cloud Hosting** | Localhost / Unconfigured | Azure App Service (Linux) + Flexible PostgreSQL | Enterprise compliance, native Key Vault integration, automated scaling. |
| **Infrastructure Cost** | Undefined | **Lean Launch Topology (< \$350/mo)** | Avoids expensive Azure Front Door / APIM until justified by enterprise traffic. |

---

## 4. Phased Delivery Roadmap

Delivery is structured across five sequential, risk-mitigated milestones:

```
[Release 0: Foundation] ────> [Release 1: CMS Alpha] ────> [Release 2: Integrated Beta] ────> [Release 3: UAT] ────> [Release 4: Production]
   Azure IaC (Bicep)           Strapi 5 Content Models      Careers + ATS Ingestion         End-to-End Testing       SEO Redirect Cutover
   Next.js 16 Base Shell       Draft Mode & ISR Hooks       CRM Enriched Lead Gateway       Pen-Testing & Audit      DNS & Zero-Downtime Launch
   Key Vault & Security        Public Page Migration        Resume SAS Storage Pipeline     Accessibility (WCAG)     Cloudflare Traffic Shift
```

* **Release 0 (Foundation - Weeks 1–3):** Infrastructure as Code (Bicep), Azure App Service plans, PostgreSQL Flexible Server, Azure Key Vault, CI/CD pipelines in GitHub Actions.
* **Release 1 (CMS-Connected Alpha - Weeks 4–6):** Strapi 5 deployment, dynamic content schemas, Next.js Draft Mode preview integration, public marketing pages migration, On-Demand ISR cache invalidation.
* **Release 2 (Integrated Beta - Weeks 7–9):** Public Careers directory, Candidate application workflow, ATS two-way requisition sync, Private Blob SAS resume handling, CRM lead gateway with Cloudflare Turnstile.
* **Release 3 (UAT & Security Candidate - Weeks 10–11):** End-to-end integration testing, WCAG 2.2 AA accessibility audit, penetration testing, SEO redirect regression verification, disaster recovery simulation.
* **Release 4 (Production Launch - Week 12):** Content freeze, 301 redirect map deployment, DNS cutover to Cloudflare, production cutover, search console sitemap verification, 24/7 post-launch hypercare.

---

## 5. Summary of Executive Governance & Next Steps

This Software Requirements Specification (SRS) establishes the binding contract between business strategy, architectural integrity, and technical delivery. By strictly adhering to these requirements:
* **The Executive Team** is guaranteed a compliant, scalable, and audit-ready digital platform.
* **The Marketing Team** gains an agile, modern CMS capable of launching multi-channel campaigns without engineering bottlenecks.
* **The Talent Acquisition Team** operates with seamless ATS connectivity and automated candidate capture.
* **The Engineering Team** operates from clear interface contracts, automated CI/CD pipelines, and a modern TypeScript/React 19 stack.
