# Nexucon Website & Marketing CMS Platform: API Retirement & Migration Plan

**Document Reference:** NEX-API-RET-v1.0  
**Project:** Nexucon Company Website, Careers Engine & Marketing CMS Platform  
**Target Release:** Full Decommissioning by Release 3 Production Cutover  
**Classification:** Engineering Migration & Governance Plan  

---

## 1. Executive Summary & Migration Objectives

The prototype Next.js repository (`nexucon.com`) contains 9 legacy route handlers and 3 server actions implemented during early concept exploration. These endpoints rely on local MongoDB models (`UserModel`, `ContentPageModel`, `EnquiryModel`, `MediaAssetModel`, `SiteSettingsModel`, `AnalyticsEventModel`) with memory fallback stores, ephemeral server disk storage (`public/uploads`), and basic symmetric JWT cookies.

This retirement plan establishes the formal strategy to decommission these prototype routes safely, migrate existing content and settings to Strapi 5, redirect commercial lead traffic without data loss, and transition administrative identities to Microsoft Entra ID.

---

## 2. Inventory of Endpoints Scheduled for Retirement

| Legacy Endpoint / Action | Verified File Path | Replacement Architecture | Phased Cutover | HTTP Decommissioning Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **`POST /api/auth/login`** | `app/api/auth/login/route.ts` | Strapi Admin Native Auth + Microsoft Entra ID (SSO) | Release 1 | Return `410 Gone` with migration notice JSON |
| **`POST /api/auth/logout`** | `app/api/auth/logout/route.ts` | Entra ID Single Sign-Out / Strapi Session Purge | Release 1 | Return `410 Gone` |
| **`GET /api/content`** | `app/api/content/route.ts` | Strapi 5 REST API (`GET /api/pages`) + Next.js ISR | Release 1 | Return `410 Gone` |
| **`POST /api/content`** | `app/api/content/route.ts` | Strapi 5 Content Manager (Draft & Publish) | Release 1 | Return `410 Gone` |
| **`POST /api/enquiries`** | `app/api/enquiries/route.ts` | Target `POST /api/leads` + CRM Outbox Adapter | Release 2 | HTTP `308 Permanent Redirect` to `/api/leads` |
| **`POST /api/upload`** | `app/api/upload/route.ts` | Strapi Azure Blob Storage Provider + `/api/careers/apply` | Release 1 | Return `410 Gone` |
| **`POST /api/analytics`** | `app/api/analytics/route.ts` | Google Analytics 4 (via GTM) + Azure App Insights | Release 2 | Return `204 No Content` -> `410 Gone` |
| **`POST /admin/create-user`** | `app/admin/create-user/route.ts` | Microsoft Entra ID User Provisioning & Strapi RBAC | Release 1 | Return `410 Gone` |
| **`POST /admin/save-settings`** | `app/admin/save-settings/route.ts` | Strapi 5 Single Type: `GlobalSiteSettings` | Release 1 | Return `410 Gone` |
| **Server Actions (`actions.ts`)**| `app/admin/actions.ts` | Direct Strapi CMS editing & React Server Components | Release 1 | Code removal from repository |

---

## 3. Phased Retirement Schedule

```
  Phase 1: Release 1 Alpha (CMS & Identity Standup)
  +-------------------------------------------------------------+
  | - Deploy Strapi 5 on Azure App Service with Azure Blob       |
  | - Configure Microsoft Entra ID SSO for marketing editors    |
  | - Export ContentPageModel & SiteSettingsModel to Strapi 5   |
  | - Decommission: /api/auth/*, /api/content, /admin/*, /upload|
  +-------------------------------------------------------------+
                                |
                                v
  Phase 2: Release 2 Beta (Lead & Careers Integration)
  +-------------------------------------------------------------+
  | - Deploy POST /api/leads with Turnstile & CRM Outbox        |
  | - Redirect POST /api/enquiries -> POST /api/leads (HTTP 308)|
  | - Deploy POST /api/careers/apply with Azure Private Blob    |
  | - Decommission POST /api/analytics (enable GA4 / GTM)       |
  +-------------------------------------------------------------+
                                |
                                v
  Phase 3: Release 3 Production Cutover (Final Purge)
  +-------------------------------------------------------------+
  | - Delete all legacy route files and Mongoose models         |
  | - Drop prototype MongoDB database & local upload directories|
  | - Complete DNS migration to Azure App Service / Front Door  |
  +-------------------------------------------------------------+
```

---

## 4. Detailed Migration & Decommissioning Plans

### 4.1 Authentication & User Management Routes
* **Endpoints:** `POST /api/auth/login`, `POST /api/auth/logout`, `POST /admin/create-user`
* **Current Vulnerabilities:** No MFA, default credentials embedded in prototype UI, static 7-day HS256 JWT cookie without server-side revocation list, no role authorization checks.
* **Migration Procedure:**
  1. Internal marketing authors provisioned in Microsoft Entra ID under security group `SG-Nexucon-Marketing-Editors`.
  2. Strapi 5 Admin configured with Microsoft Entra ID SSO integration.
  3. Replace route handlers with HTTP `410 Gone` handler returning structured error `LEGACY-AUTH-DISABLED-001`.
  4. Remove `UserModel.ts` and `requireUserSession` middleware dependencies.
* **Rollback Plan:** In the event of Entra ID misconfiguration during staging, Strapi native administrator accounts serve as an emergency fallback.

### 4.2 Content Management Routes
* **Endpoints:** `GET /api/content`, `POST /api/content`, `POST /admin/save-settings`
* **Current Vulnerabilities:** Lacks Draft/Publish states, unindexed queries, legacy PHP header snippets stored in site settings (`<!-- header.php -->`), any logged-in user can overwrite all pages.
* **Migration Procedure:**
  1. Execute data migration script (`scripts/migrate-mongo-to-strapi.ts`):
     - Extract all records from `ContentPageModel`.
     - Transform markdown and block structures into Strapi 5 Dynamic Zone components.
     - Extract navigation, footer, and branding fields from `SiteSettingsModel` into Strapi Single Type `GlobalSiteSettings`.
  2. Verify all slugs render with 100% fidelity via Next.js React Server Components.
  3. Replace route handlers with HTTP `410 Gone` returning `LEGACY-CONTENT-RETIRED-002`.

### 4.3 Inbound Enquiry & Lead Routes
* **Endpoint:** `POST /api/enquiries`
* **Current Vulnerabilities:** No anti-bot verification, no rate limiting, no UTM attribution capture, writes only to local MongoDB without CRM synchronization.
* **Migration Procedure:**
  1. Deploy target Route Handler `POST /api/leads`.
  2. Update public website forms (`/contact`, `/sap-business-one`) to target `/api/leads` with Turnstile tokens.
  3. Configure backward-compatibility adapter on `POST /api/enquiries`:
     - If request includes valid Turnstile token, transform schema to target lead contract and forward to CRM outbox.
     - Issue HTTP `308 Permanent Redirect` instructing callers to use `/api/leads`.
  4. Maintain outbox audit logging in PostgreSQL.

### 4.4 Media Upload Route
* **Endpoint:** `POST /api/upload`
* **Current Vulnerabilities:** Saves files to local disk `public/uploads/` with UUID filename; fails when Azure App Service scales horizontally or restarts container; no virus scan or magic byte validation.
* **Migration Procedure:**
  1. Batch copy all existing media assets in `public/uploads/` to Azure Blob Storage container `media-public` using Azure CLI `az storage blob upload-batch`.
  2. Update public page asset references to point to Azure CDN endpoints (`https://cdn.nexucon.com/media/...`).
  3. Configure Strapi 5 with `@strapi/provider-upload-azure-storage` for ongoing public content uploads.
  4. Replace `POST /api/upload` with HTTP `410 Gone` returning `LEGACY-UPLOAD-DISABLED-004`.

### 4.5 Analytics Route
* **Endpoint:** `POST /api/analytics`
* **Current Vulnerabilities:** High volume database writes on every pageview, unindexed event logs, no bot filtering, hardcoded SEO score (100) on prototype dashboard.
* **Migration Procedure:**
  1. Integrate Google Tag Manager (GTM) container script in Next.js Root Layout (`app/layout.tsx`).
  2. Configure GA4 tags for pageviews, button clicks, and form submissions.
  3. Configure Azure Application Insights SDK for server-side route telemetry and error tracking.
  4. Temporarily return HTTP `204 No Content` for 14 days to absorb client caching lag, then replace with HTTP `410 Gone`.

---

## 5. Security & Risk Management During Migration

1. **Dual-Run Data Integrity:** During the Release 2 Beta period, any enquiry received via the legacy endpoint must be dual-written to the PostgreSQL outbox to ensure zero lead loss.
2. **Secret Revocation:** Upon decommissioning `POST /api/auth/login`, immediately revoke the prototype `JWT_SECRET` in all deployment environments.
3. **Database Drop Authorization:** The prototype MongoDB instance will remain read-only for 30 calendar days post-cutover before formal decommission and data erasure, ensuring an audit-compliant fallback window.

---

## 6. Cutover Sign-Off Checklist

- [ ] All marketing pages and global settings successfully migrated to Strapi 5.
- [ ] Next.js React Server Components verified pulling from Strapi with ISR tag cache working.
- [ ] Microsoft Entra ID SSO verified for all marketing team accounts.
- [ ] Turnstile anti-bot verified active on `/api/leads` and `/api/careers/apply`.
- [ ] Outbound CRM outbox worker verified processing test leads to corporate CRM gateway.
- [ ] All 9 legacy routes return expected HTTP 410 / 308 status codes.
- [ ] Zero unhandled 500 exceptions reported in Azure Application Insights over 72 continuous hours.
