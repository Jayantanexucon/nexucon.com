# Nexucon Website & Marketing CMS: API Field Mapping Specification

**Document Identifier:** NEX-API-MAP-v1.0  
**Classification:** Engineering Baseline Specification  
**Status:** Draft for Backend, Frontend, Integration, Security, and QA Review  
**Target Release:** Production Release 2.0 - 4.0  
**Last Updated:** September 23, 2026  

---

## 1. Document Control & Purpose

This document establishes the binding field-level contract across all integration boundaries of the Nexucon digital platform. It defines the mapping, transformation, data validation, privacy classification, and error handling for data moving between:
1. Public Contact & Consultation Forms -> Internal Lead Model (Next.js BFF)
2. Internal Lead Model -> Corporate Lead Management / CRM Portal
3. Careers Application Forms (Fresher & Experienced) -> Careers Internal Database
4. Careers Database -> Corporate ATS / Staff Augmentation Portal
5. ATS Inbound Requisitions -> Careers Job Database & Public View Model
6. Strapi 5 Content Entities -> Next.js Frontend View Models
7. Strapi Media Assets -> Next.js Image Optimization Pipeline

### Classification Legend:
* `[VERIFIED-AS-IS]`: Verified directly from code in `Nexucon-Main-Page` or `nexucon.com`.
* `[APPROVED-TARGET]`: Formally mandated by signed-off enterprise decisions (currently 0 decisions signed off).
* `[PROPOSED]`: Recommended engineering specification pending formal owner sign-off.
* `[EXAMPLE-ONLY]`: Sample value illustrating contract syntax; not an agreed value.
* `[TBD WITH OWNER]`: Requires missing interface documentation from third-party system owners.

---

## 2. Website Inbound Lead Forms -> Internal Lead Model (BFF)

The platform consolidates two historic inbound form variants into a unified internal lead model:
* **Variant A (General Contact):** Sourced from `contact.html` (`assets/js/contact-form.js`) `[VERIFIED-AS-IS]`.
* **Variant B (SAP / Campaign Consultation):** Sourced from `sap-business-one.html` (`assets/js/sap-landing-form.js`) `[VERIFIED-AS-IS]`.

### Mapping Table: Inbound Web Forms -> Internal Lead Model (`LeadSubmissionRequest`)

| Source Field | Source Type | Target Internal Field (BFF) | Canonical Schema Name | Target Type | Required | Transformation & Business Logic | Default | Validation Rule | Sensitive Data Class | Source of Truth | Unmapped Behavior | Approval Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | `string` | `fullName` | `fullName` | `string` | Yes | Trim whitespace; title case normalization | None | Min 2 chars, max 100 chars, regex `^[\p{L}\s.'-]+$` | Personal (PII) | Website Form | Reject HTTP 400 | `[PROPOSED]` |
| `email` | `string` | `email` | `email` (alias: `emailAddress`)| `string` | Conditional | Trim; lowercase; required if `phone` omitted | `null` | RFC 5322 compliant regex; max 254 chars | Personal (PII) | Website Form | Reject HTTP 400 | `[PROPOSED]` |
| `phone` | `string` | `phone` | `phone` (alias: `phoneNumber`)| `string` | Conditional | Strip formatting spaces; convert to E.164 via `libphonenumber-js` | `null` | Min 7 digits, max 15 digits; E.164 format | Personal (PII) | Website Form | Reject HTTP 400 | `[PROPOSED]` |
| `organisation` / `companyName` | `string` | `company` | `company` (alias: `companyName`)| `string` | Yes | Trim whitespace; coalesces `organisation` or `companyName` | None | Min 2 chars, max 120 chars | Commercial PII | Website Form | Reject HTTP 400 | `[PROPOSED]` |
| `companySize` | `string` | `sapDetails.companySize`| `companySize` | `string` | No | Direct string copy from dropdown | `null` | Enum: `1-10`, `11-50`, `51-200`, `201-500`, `500+` | Internal Business | Website Form | Discard if invalid | `[VERIFIED-AS-IS / PROPOSED]` |
| `city` / `country` | `string` | `sapDetails.city` / `country` | `city` / `country` | `string` | Conditional | Maps `city` from SAP form; maps `country` from contact form | `null` | Max 100 chars; country ISO 3166-1 alpha-2 or full name | Personal (PII) | Website Form | Discard | `[VERIFIED-AS-IS / PROPOSED]` |
| `services` | `string[]` | `serviceInterest` | `serviceInterest` (normalized)| `string` | No | Normalizes array of selected checkboxes to primary interest | `"General Advisory"` | Array of strings from allowed practice catalog | Internal Business | Website Form | Discard unknown | `[VERIFIED-AS-IS / PROPOSED]` |
| `service` | `string` | `sapDetails.service` | `service` | `string` | No | Preserves single campaign service (e.g. "SAP Business ERP") | `"SAP Business ERP"` | Max 100 chars | Internal Business | Website Form | Fallback to Default | `[VERIFIED-AS-IS / PROPOSED]` |
| `message` | `string` | `message` | `message` (alias: `inquiryNotes`)| `string` | Conditional | Trim; strip dangerous control characters; required for contact | `""` | Min 10 chars, max 2000 chars | Commercial PII | Website Form | Reject HTTP 400 | `[PROPOSED]` |
| `website_url` | `string` | `_honeypotWebsite` | `_honeypotWebsite` | `string` | No | Honeypot trap: must be empty | `""` | Value must be empty string `""` | Operational Metadata| Browser DOM | Silent Drop / Bot Flag | `[VERIFIED-AS-IS / PROPOSED]` |
| `fax_number` | `string` | `_honeypotFax` | `_honeypotFax` | `string` | No | Honeypot trap: must be empty | `""` | Value must be empty string `""` | Operational Metadata| Browser DOM | Silent Drop / Bot Flag | `[VERIFIED-AS-IS / PROPOSED]` |
| `formLoadTimestamp` | `number` | `_clientTimingMs` | `_clientTimingMs` | `integer` | Yes | `Date.now() - formLoadTimestamp`; bot check (< 1500ms) | None | Integer timestamp > 0 | Operational Metadata| Browser DOM | Flag Bot Activity | `[VERIFIED-AS-IS / PROPOSED]` |
| `turnstileToken` | `string` | `turnstileToken` | `turnstileToken` | `string` | Yes | Cloudflare Turnstile token verified server-side at edge | None | Base64 token string; max 2048 chars | Secret Token | Cloudflare API | Reject HTTP 403 | `[VERIFIED-AS-IS / PROPOSED]` |
| `utmParams.source` | `string` | `attribution.utmSource` | `utmSource` | `string` | No | Sourced from URL search params; fallback `"direct"` | `"direct"` | Max 50 chars; lowercase alphanumeric and `-` | Marketing Telemetry | Browser URL | Default to "direct" | `[VERIFIED-AS-IS / PROPOSED]` |
| `utmParams.medium` | `string` | `attribution.utmMedium` | `utmMedium` | `string` | No | Sourced from URL search params; fallback `"web"` | `"web"` | Max 50 chars; lowercase | Marketing Telemetry | Browser URL | Default to "web" | `[VERIFIED-AS-IS / PROPOSED]` |
| `utmParams.campaign`| `string` | `attribution.utmCampaign`| `utmCampaign` | `string` | No | Sourced from URL search params | `null` | Max 100 chars | Marketing Telemetry | Browser URL | Discard | `[VERIFIED-AS-IS / PROPOSED]` |
| `utmParams.term` | `string` | `attribution.utmTerm` | `utmTerm` | `string` | No | Sourced from URL search params | `null` | Max 100 chars | Marketing Telemetry | Browser URL | Discard | `[VERIFIED-AS-IS / PROPOSED]` |
| `utmParams.content` | `string` | `attribution.utmContent`| `utmContent` | `string` | No | Sourced from URL search params | `null` | Max 100 chars | Marketing Telemetry | Browser URL | Discard | `[VERIFIED-AS-IS / PROPOSED]` |
| `pageUrl` | `string` | `attribution.landingPage`| `landingPage` | `string` | Yes | Full browser `window.location.href` | None | Valid absolute URI; max 500 chars | Operational Metadata| Browser DOM | Fallback to Referer| `[VERIFIED-AS-IS / PROPOSED]` |

---

## 3. Internal Lead Model -> Corporate Lead Management / CRM Portal

> [!WARNING]
> **Proposed Interface Contract [PENDING CRM OWNER SIGN-OFF]:** The exact endpoint path, authentication mechanism, and payload structure for the Corporate Lead Management / CRM Portal have not been delivered by the CRM engineering team. The mapping below represents the proposed architectural target contract (DEC-API-03, DEC-API-11, OD-04).

* **Target Base Endpoint:** Configured via `CRM_BASE_URL` (`https://<configured-crm-host>/api/v1/leads`) `[PROPOSED]`.
* **Outbound Authentication:** Configured via `CRM_API_KEY` header `X-Nexucon-CRM-Key` `[PROPOSED]`.

### Outbound CRM Adapter JSON Structure
```json
{
  "sourceSystem": "nexucon-public-website",
  "leadExternalId": "NEX-01HZY98A7B6C",
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
    "utmMedium": "paid-social",
    "utmCampaign": "sap-q4-accelerator",
    "landingPage": "https://nexucon.com/services/sap",
    "submittedAt": "2026-09-23T20:30:00Z"
  }
}
```

### Mapping Table: Internal Lead Model -> Corporate CRM API

| Internal Field | Internal Type | CRM Target JSON Path | CRM Target Type | Required | Transformation | Default | Sensitive Class | Approval Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `leadId` | `string (ULID/UUID)`| `leadExternalId` | `string` | Yes | Prefix `NEX-` + ID | None | Internal Technical | `[PROPOSED]` |
| `fullName` | `string` | `contact.fullName` | `string` | Yes | Direct mapping | None | Personal (PII) | `[PROPOSED]` |
| `email` | `string` | `contact.email` | `string` | Yes | Direct mapping | `null` | Personal (PII) | `[PROPOSED]` |
| `phone` | `string` | `contact.phone` | `string` | No | E.164 formatted string | `null` | Personal (PII) | `[PROPOSED]` |
| `company` | `string` | `contact.company` | `string` | Yes | Direct mapping | None | Commercial PII | `[PROPOSED]` |
| `serviceInterest`| `string` | `requirements.practiceDomain`| `string` | Yes | Maps to CRM practice domain enum | `"Enterprise - SAP"` | Commercial Data | `[PROPOSED]` |
| `message` | `string` | `requirements.notes` | `string` | No | Sanitized text string | `""` | Commercial PII | `[PROPOSED]` |
| `attribution.utmSource`| `string` | `telemetry.utmSource` | `string` | Yes | Direct mapping | `"direct"` | Marketing Telemetry | `[PROPOSED]` |
| `attribution.utmMedium`| `string` | `telemetry.utmMedium` | `string` | No | Direct mapping | `"web"` | Marketing Telemetry | `[PROPOSED]` |
| `attribution.utmCampaign`|`string` | `telemetry.utmCampaign`| `string` | No | Direct mapping | `null` | Marketing Telemetry | `[PROPOSED]` |
| `attribution.landingPage`| `string` | `telemetry.landingPage`| `string` | No | Direct mapping | `null` | Marketing Telemetry | `[PROPOSED]` |
| `createdAt` | `DateTime` | `telemetry.submittedAt` | `string (ISO 8601)`| Yes | Formatted as `YYYY-MM-DDTHH:mm:ss.sssZ` | UTC Now | Internal Technical | `[PROPOSED]` |

---

## 4. Careers Application Forms -> Careers Database

Verified from `FresherJobApplicationForm-CPEVI2CP.js` and `ExperienceJobApplicationForm-cgwMRwCh.js` in `Nexucon-Main-Page/careers/assets` `[VERIFIED-AS-IS]`.

### Candidate Data Boundary & Anti-Pattern Prohibition
> [!CAUTION]
> **Strict Segregation Mandate:** Under no circumstances shall candidate application submissions, candidate names, contact details, or resumes be saved into Strapi collections or Strapi media libraries. Careers data is strictly segregated into a dedicated PostgreSQL schema (`careers_applications`) and private Azure Blob Storage (`resumes-private`).

### Mapping Table: Candidate Application -> Careers Database (`careers_applications`)

| Source Form Field | Source Type | Careers DB Column | Canonical Schema Name | DB Column Type | Required | Transformation | Validation Rule | Sensitive Class | Approval Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `jobId` | `string` (URL Param) | `job_id` | `jobId` | `VARCHAR(36)` | Yes | Verified against active jobs in DB | Valid requisition ID | Internal Technical | `[VERIFIED-AS-IS / PROPOSED]` |
| `resume` | `File` (Binary) | `resume_blob_path` | `resume` | `VARCHAR(500)` | Yes | Written to private blob; stores blob key | PDF/DOCX; max 5,242,880 bytes (5MB) | Sensitive PII | `[VERIFIED-AS-IS / PROPOSED]` |
| `firstName` | `string` | `first_name` | `firstName` | `VARCHAR(100)` | Yes | Trim whitespace; title case | Min 1, max 100 chars | Personal (PII) | `[VERIFIED-AS-IS / PROPOSED]` |
| `lastName` | `string` | `last_name` | `lastName` | `VARCHAR(100)` | Yes | Trim whitespace; title case | Min 1, max 100 chars | Personal (PII) | `[VERIFIED-AS-IS / PROPOSED]` |
| `validEmail` | `string` | `email` | `email` | `VARCHAR(255)` | Yes | Trim; lowercase | RFC 5322 regex; max 255 chars | Personal (PII) | `[VERIFIED-AS-IS / PROPOSED]` |
| `phoneNumber` | `string` | `phone_number` | `phoneNumber` | `VARCHAR(30)` | Yes | Validate E.164 | Min 7 digits, max 20 digits | Personal (PII) | `[VERIFIED-AS-IS / PROPOSED]` |
| `jobRole` | `string` | `job_role` | `jobRole` | `VARCHAR(100)` | Yes | Validated against role catalog | Must match known job role title | Personal (PII) | `[VERIFIED-AS-IS / PROPOSED]` |
| `yearsOfExperience` | `number` | `years_experience` | `yearsOfExperience`| `INT` | Exp | Integer years; min 0, max 40 | 0 <= Years <= 40 | Personal (PII) | `[VERIFIED-AS-IS / PROPOSED]` |
| `releventYearsOfExperience`|`number`| `relevant_experience`| `releventYearsOfExperience`|`INT`| Exp | Integer years; <= total experience | 0 <= Years <= 40 | Personal (PII) | `[VERIFIED-AS-IS / PROPOSED]` |
| `currentCTCCurrency`| `string` | `current_ctc_currency` | `currentCTCCurrency`| `VARCHAR(10)` | Exp | Enum: `INR`, `USD`, `GBP`, `EUR`, `SAR`, `AED` | ISO Currency code | Confidential Personal | `[VERIFIED-AS-IS / PROPOSED]` |
| `currentCTC` | `number` | `current_ctc` | `currentCTC` | `NUMERIC(12,2)`| Exp | Normalized numeric value | Numeric > 0 | Confidential Personal | `[VERIFIED-AS-IS / PROPOSED]` |
| `expectedCTCCurrency`| `string` | `expected_ctc_currency`| `expectedCTCCurrency`| `VARCHAR(10)` | Exp | Enum: `INR`, `USD`, `GBP`, `EUR`, `SAR`, `AED` | ISO Currency code | Confidential Personal | `[VERIFIED-AS-IS / PROPOSED]` |
| `expectedCTC` | `number` | `expected_ctc` | `expectedCTC` | `NUMERIC(12,2)`| Exp | Normalized numeric value | Numeric > 0 | Confidential Personal | `[VERIFIED-AS-IS / PROPOSED]` |
| `noticePeriod` | `string` | `notice_period` | `noticePeriod` | `VARCHAR(50)` | Exp | Notice period string (e.g. "30 Days") | Max 50 chars | Personal (PII) | `[VERIFIED-AS-IS / PROPOSED]` |
| `linkedinUrl` | `string` | `linkedin_url` | `linkedinUrl` | `VARCHAR(255)` | No | Valid URL | Max 255 chars | Personal (PII) | `[PROPOSED]` |
| `consentDataProcessing`|`boolean` | `consent_data_processing`| `consentDataProcessing`|`BOOLEAN`| Yes | Must be true | Boolean `true` | Legal Consent | `[PROPOSED]` |
| `turnstileToken` | `string` | *(Verified at Edge)*| `turnstileToken` | *(Ephemeral)* | Yes | Verified against Cloudflare API | Token string | Secret Token | `[VERIFIED-AS-IS / PROPOSED]` |

---

## 5. ATS Job Requisition -> Careers Job Model

Verified from `JobListing-C8HuxP4g.js` and `JobDetails-DrTFRWQg.js` (`/job-posting/display`) `[VERIFIED-AS-IS]`.

### Mapping Table: ATS Requisition -> Public Job View Model

| ATS Source Field | ATS Type | Careers DB Column | Public View Model Field | Required | Transformation | Default | Approval Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `jobId` | `string` | `external_requisition_id`| `requisitionId` | Yes | Direct mapping | None | `[VERIFIED-AS-IS / PROPOSED]` |
| `jobName` | `string` | `title` | `jobTitle` | Yes | Direct mapping | None | `[VERIFIED-AS-IS / PROPOSED]` |
| `jobRole` | `string` | `practice_area` | `practiceArea` | Yes | Direct mapping | None | `[VERIFIED-AS-IS / PROPOSED]` |
| `jobDetails` | `string` | `job_details` | `shortSummary` | No | HTML sanitized string | `""` | `[VERIFIED-AS-IS / PROPOSED]` |
| `location` | `string` | `location` | `location` | Yes | Direct mapping | None | `[VERIFIED-AS-IS / PROPOSED]` |
| `jobType` | `string` | `employment_type` | `jobType` | Yes | Enum: `Full-Time`, `Part-Time`, `Contract` | `"Full-Time"` | `[VERIFIED-AS-IS / PROPOSED]` |
| `experienceLevel` | `string` | `experience_level` | `experienceLevel` | Yes | Enum: `Fresher`, `3-5 years`, `6-8 years`, `10+ years` | None | `[VERIFIED-AS-IS / PROPOSED]` |
| `applicationDeadline`| `string/date`| `closing_date` | `closingDate` | No | ISO 8601 Date string | `null` | `[VERIFIED-AS-IS / PROPOSED]` |
| `jobRequirements` | `string` | `requirements` | `requirementsList` | No | Split by newline or parsed JSON array | `[]` | `[VERIFIED-AS-IS / PROPOSED]` |
| `jobResponsibilities`|`string` | `responsibilities` | `responsibilitiesList` | No | Split by newline or parsed JSON array | `[]` | `[VERIFIED-AS-IS / PROPOSED]` |
| `skillRequired` | `string` | `skills` | `skillsList` | No | Split by newline or parsed JSON array | `[]` | `[VERIFIED-AS-IS / PROPOSED]` |
| `salaryRange` | `string` | `salary_range` | `salaryRange` | No | Direct string | `"Competitive"` | `[VERIFIED-AS-IS / PROPOSED]` |
| `benefits` | `string` | `benefits` | `benefitsList` | No | Split by newline or parsed JSON array | `[]` | `[VERIFIED-AS-IS / PROPOSED]` |
| `showJobToUser` | `boolean` | `status` | `isPublished` | Yes | `showJobToUser ? 'OPEN' : 'CLOSED'` | `'CLOSED'` | `[VERIFIED-AS-IS / PROPOSED]` |

---

## 6. Strapi 5 Content Entities -> Next.js View Models

### 6.1 Strapi Service -> Next.js Service View Model
* **Strapi Model UID:** `api::service.service` `[PROPOSED]`
* **Expected Route:** `GET /api/services?filters[slug][$eq]=...&populate=*` `[PROPOSED]`

| Strapi 5 Field | Strapi Type | Next.js View Model Field | TypeScript Target Type | Transformation | Fallback |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `title` | `string` | `title` | `string` | Direct string | `"Untitled Service"` |
| `slug` | `uid` | `slug` | `string` | Prepend `/services/` if relative | `""` |
| `practiceArea` | `enumeration` | `practiceArea` | `PracticeAreaEnum` | Matches TypeScript enum | `"Enterprise Modernization"` |
| `shortSummary` | `text` | `summary` | `string` | Direct string | `""` |
| `overviewBody` | `blocks (AST)` | `contentAst` | `StrapiBlockNode[]` | Parsed into React AST components | `[]` |
| `capabilities` | `component (repeatable)`| `capabilities` | `ServiceCapability[]` | Map `{ icon, title, description, tags }` | `[]` |
| `metrics` | `component (repeatable)`| `impactMetrics` | `ServiceMetric[]` | Map `{ metricValue, metricLabel, detail }` | `[]` |
| `featureImage` | `media (single)` | `heroImage` | `NextGenImageProps` | Extract URL, altText, width, height | Fallback default image |
| `seo` | `component` | `metadata` | `NextMetadataObject` | Map to Next.js `Metadata` API format | Site default metadata |

### 6.2 Strapi Page -> Next.js Page View Model
* **Strapi Model UID:** `api::page.page` `[PROPOSED]`
* **Expected Route:** `GET /api/pages?filters[slug][$eq]=...&populate[dynamicSections][populate]=*` `[PROPOSED]`

| Strapi 5 Field | Strapi Type | Next.js View Model Field | TypeScript Target Type | Transformation | Fallback |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `title` | `string` | `pageTitle` | `string` | Direct string | `"Nexucon"` |
| `slug` | `uid` | `pathname` | `string` | Normalize leading slash | `"/"` |
| `dynamicSections` | `dynamiczone` | `sections` | `DynamicSectionComponent[]` | Dynamic switch-case component renderer | `[]` |
| `enableBreadcrumbs`| `boolean` | `showBreadcrumbs`| `boolean` | Direct boolean mapping | `true` |
| `seo.metaTitle` | `string` | `metadata.title` | `string` | Format: `${metaTitle} \| Nexucon` | Global default title |
| `seo.metaDescription`|`text` | `metadata.description`| `string` | Direct string | Global default desc |
| `seo.indexing` | `enumeration` | `metadata.robots.index`| `boolean` | `indexing === "index"` | `true` |
| `seo.follow` | `enumeration` | `metadata.robots.follow`|`boolean` | `follow === "follow"` | `true` |

### 6.3 Strapi Media -> Next.js Image Component Configuration
* **Strapi Media Engine:** Backed by Azure Blob Storage container `media-public` `[PROPOSED]`.

| Strapi Media Attribute | Data Type | Next.js `<Image />` Prop | Transformation Rule |
| :--- | :--- | :--- | :--- |
| `url` | `string` | `src` | Prepend Azure Blob Storage CDN domain if relative |
| `alternativeText` | `string` | `alt` | Mandatory; if empty, fallback to image name with console warning |
| `width` | `integer` | `width` | Original width from image metadata |
| `height` | `integer` | `height` | Original height from image metadata |
| `formats.large.url` | `string` | `srcSet (large)` | Mapped to responsive `sizes` attribute (1000px) |
| `formats.medium.url` | `string` | `srcSet (medium)` | Mapped to responsive `sizes` attribute (750px) |
| `formats.small.url` | `string` | `srcSet (small)` | Mapped to responsive `sizes` attribute (500px) |
| `formats.thumbnail.url`|`string` | `blurDataURL` | Used as low-quality image placeholder (LQIP) |

---

## 7. Change Log & Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| **v1.0** | 2026-09-23 | Senior Backend Engineer | Initial Field Mapping specification establishing crosswalk between legacy forms, careers SPA, DB models, and CRM/ATS payloads. |
| **v1.1** | 2026-09-23 | Principal API Architect | **Contract Consistency Review & Reconciliation:**<br>1. Updated document status to `Draft for Backend, Frontend, Integration, Security, and QA Review`.<br>2. Harmonized Section 2 Target Internal Field names to match canonical API schemas: `email` (alias `emailAddress`), `phone` (alias `phoneNumber`), `company` (alias `companyName`), `serviceInterest` (alias `serviceInterests`), `message` (alias `inquiryNotes`).<br>3. Aligned Outbound CRM Adapter mapping in Section 3 with the nested JSON structure in the API Specification; marked as `[PROPOSED CONTRACT - PENDING CRM OWNER SIGN-OFF]`.<br>4. Aligned Section 4 Careers DB columns with PostgreSQL DDL (`email`, `phone_number`, `resume_blob_path`, `job_id`).<br>5. Added explicit Candidate Data Boundary & Anti-Pattern Prohibition section.<br>6. Reclassified all unapproved target mappings to `[PROPOSED]`. |
