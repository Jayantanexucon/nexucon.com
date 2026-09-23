# Nexucon Website & Marketing CMS: API Field Mapping Specification

**Document Identifier:** NEX-API-MAP-v1.0  
**Classification:** Engineering Baseline Specification  
**Status:** APPROVED-TARGET / PROPOSED (Marked per mapping)  
**Target Release:** Production Release 2.0 - 4.0  
**Last Updated:** September 23, 2026  

---

## 1. Document Control & Purpose

This document establishes the binding field-level contract across all integration boundaries of the Nexucon digital platform. It defines the mapping, transformation, data validation, privacy classification, and error handling for data moving between:
1. Public Contact & Consultation Forms -> Internal Lead Model
2. Internal Lead Model -> Corporate Lead Management / CRM Portal
3. Careers Application Forms (Fresher & Experienced) -> Careers Internal Database
4. Careers Database -> Corporate ATS / Staff Augmentation Portal
5. ATS Inbound Requisitions -> Careers Job Database & Public View Model
6. Strapi 5 Content Entities -> Next.js Frontend View Models
7. Strapi Media Assets -> Next.js Image Optimization Pipeline

### Classification Legend:
* `[VERIFIED-AS-IS]`: Verified directly from code in `Nexucon-Main-Page` or `nexucon.com`.
* `[APPROVED-TARGET]`: Formally mandated by the approved SRS baseline.
* `[PROPOSED]`: Recommended engineering specification pending formal owner sign-off.
* `[EXAMPLE-ONLY]`: Sample value illustrating contract syntax; not an agreed value.
* `[TBD]`: Requires missing interface documentation from third-party system owners.

---

## 2. Website Inbound Lead Forms -> Internal Lead Model

The platform consolidates two historic inbound form variants into a unified internal lead model:
* **Variant A (General Contact):** Sourced from `contact.html` (`assets/js/contact-form.js`) `[VERIFIED-AS-IS]`.
* **Variant B (SAP / Campaign Consultation):** Sourced from `sap-business-one.html` (`assets/js/sap-landing-form.js`) `[VERIFIED-AS-IS]`.

### Mapping Table: Inbound Web Forms -> Internal Lead Model

| Source Field | Source Type | Target Internal Field | Target Type | Required | Transformation & Business Logic | Default | Validation Rule | Sensitive Data Class | Source of Truth | Unmapped Behavior | Approval Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | `string` | `fullName` | `string` | Yes | Trim whitespace; title case normalization | None | Min 2 chars, max 100 chars, regex `^[\p{L}\s.'-]+$` | Personal (PII) | Website Form | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `email` | `string` | `emailAddress` | `string` | Conditional | Trim; lowercase; required if `phone` omitted | `null` | RFC 5322 compliant regex; max 254 chars | Personal (PII) | Website Form | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `phone` | `string` | `phoneNumber` | `string` | Conditional | Strip formatting spaces; convert to E.164 via `libphonenumber-js` | `null` | Min 7 digits, max 15 digits; E.164 format | Personal (PII) | Website Form | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `organisation` / `companyName` | `string` | `companyName` | `string` | Yes | Trim whitespace; coalesces `organisation` or `companyName` | None | Min 2 chars, max 120 chars | Commercial PII | Website Form | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `companySize` | `string` | `companySize` | `string` | No | Direct string copy from dropdown | `null` | Enum: `1-10`, `11-50`, `51-200`, `201-500`, `500+` | Internal Business | Website Form | Discard if invalid | `[VERIFIED-AS-IS]` |
| `city` / `country` | `string` | `locationCity` / `locationCountry` | `string` | Conditional | Maps `city` from SAP form; maps `country` from contact form | `null` | Max 100 chars; country ISO 3166-1 alpha-2 or full name | Personal (PII) | Website Form | Discard | `[VERIFIED-AS-IS]` |
| `services` | `string[]` | `serviceInterests` | `string[]` | No | Normalizes array of selected checkboxes | `[]` | Array of strings from allowed practice catalog | Internal Business | Website Form | Discard unknown | `[VERIFIED-AS-IS]` |
| `service` | `string` | `primaryService` | `string` | No | Preserves single campaign service (e.g. "SAP Business ERP") | `"General Advisory"` | Max 100 chars | Internal Business | Website Form | Fallback to Default | `[VERIFIED-AS-IS]` |
| `message` | `string` | `inquiryNotes` | `string` | Conditional | Trim; strip dangerous control characters; required for contact | `""` | Min 10 chars, max 3000 chars | Commercial PII | Website Form | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `website_url` | `string` | `_honeypotWebsite` | `string` | No | Honeypot trap: must be empty | `""` | Value must be empty string `""` | Operational Metadata| Browser DOM | Silent Drop / Bot Flag | `[VERIFIED-AS-IS]` |
| `fax_number` | `string` | `_honeypotFax` | `string` | No | Honeypot trap: must be empty | `""` | Value must be empty string `""` | Operational Metadata| Browser DOM | Silent Drop / Bot Flag | `[VERIFIED-AS-IS]` |
| `formLoadTimestamp` | `number` | `_clientTimingMs` | `integer` | Yes | `Date.now() - formLoadTimestamp`; bot check (< 1500ms) | None | Integer timestamp > 0 | Operational Metadata| Browser DOM | Flag Bot Activity | `[VERIFIED-AS-IS]` |
| `turnstileToken` | `string` | `_turnstileToken` | `string` | Yes | Cloudflare Turnstile token verified server-side at edge | None | Base64 token string; max 2048 chars | Secret Token | Cloudflare API | Reject HTTP 403 | `[VERIFIED-AS-IS]` |
| `utmParams.source` | `string` | `attribution.utmSource` | `string` | No | Sourced from URL search params; fallback `"direct"` | `"direct"` | Max 50 chars; lowercase alphanumeric and `-` | Marketing Telemetry | Browser URL | Default to "direct" | `[VERIFIED-AS-IS]` |
| `utmParams.medium` | `string` | `attribution.utmMedium` | `string` | No | Sourced from URL search params; fallback `"web"` | `"web"` | Max 50 chars; lowercase | Marketing Telemetry | Browser URL | Default to "web" | `[VERIFIED-AS-IS]` |
| `utmParams.campaign`| `string` | `attribution.utmCampaign`| `string` | No | Sourced from URL search params | `null` | Max 100 chars | Marketing Telemetry | Browser URL | Discard | `[VERIFIED-AS-IS]` |
| `utmParams.term` | `string` | `attribution.utmTerm` | `string` | No | Sourced from URL search params | `null` | Max 100 chars | Marketing Telemetry | Browser URL | Discard | `[VERIFIED-AS-IS]` |
| `utmParams.content` | `string` | `attribution.utmContent`| `string` | No | Sourced from URL search params | `null` | Max 100 chars | Marketing Telemetry | Browser URL | Discard | `[VERIFIED-AS-IS]` |
| `pageUrl` | `string` | `attribution.landingUrl`| `string` | Yes | Full browser `window.location.href` | None | Valid absolute URI; max 500 chars | Operational Metadata| Browser DOM | Fallback to Referer| `[VERIFIED-AS-IS]` |

---

## 3. Internal Lead Model -> Corporate Lead Management / CRM Portal

This mapping governs the outbound dispatch from the Next.js server-side outbox worker to the corporate CRM REST interface.

* **Target Base Endpoint:** Configured via `CRM_BASE_URL` (`https://<configured-crm-host>/api/v1/leads`) `[PROPOSED]`.
* **Outbound Authentication:** Configured via `CRM_API_KEY` header `X-Nexucon-CRM-Key` `[PROPOSED]`.

### Mapping Table: Internal Lead Model -> Corporate CRM API

| Internal Field | Internal Type | CRM Target Field | CRM Target Type | Required | Transformation | Default | Validation Rule | Sensitive Class | Unmapped Behavior | Approval Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `leadId` | `string (UUID)` | `external_lead_id` | `string` | Yes | Prefix `NEX-` + UUIDv4 | None | UUIDv4 format | Internal Technical | Fail Outbox Dispatch | `[APPROVED-TARGET]` |
| `fullName` | `string` | `contact_name` | `string` | Yes | Direct mapping | None | Max 100 chars | Personal (PII) | Fail Outbox Dispatch | `[PROPOSED]` |
| `emailAddress` | `string` | `contact_email` | `string` | Yes | Direct mapping (if null, synthetic CRM email)| `null` | RFC 5322 regex | Personal (PII) | Allow null if phone exists | `[PROPOSED]` |
| `phoneNumber` | `string` | `contact_phone` | `string` | No | E.164 formatted string | `null` | Max 20 chars | Personal (PII) | Omit field | `[PROPOSED]` |
| `companyName` | `string` | `account_name` | `string` | Yes | Direct mapping | None | Max 120 chars | Commercial PII | Fail Outbox Dispatch | `[PROPOSED]` |
| `companySize` | `string` | `employee_bracket` | `string` | No | Normalizes to CRM range code | `"UNKNOWN"` | Max 20 chars | Commercial Data | Omit field | `[PROPOSED]` |
| `locationCity` | `string` | `city` | `string` | No | Direct mapping | `null` | Max 100 chars | Personal (PII) | Omit field | `[PROPOSED]` |
| `locationCountry` | `string` | `country` | `string` | No | Converts to ISO-3166-1 alpha-2 code | `"GB"` | 2-character country code | Personal (PII) | Fallback to "GB" | `[PROPOSED]` |
| `primaryService` | `string` | `practice_line` | `string` | Yes | Maps to CRM practice domain enum | `"ENTERPRISE_ADVISORY"`| CRM practice enum | Commercial Data | Fallback to default | `[PROPOSED]` |
| `serviceInterests` | `string[]` | `secondary_interests`| `string[]` | No | Array of standardized interest tags | `[]` | Array of strings | Commercial Data | Omit field | `[PROPOSED]` |
| `inquiryNotes` | `string` | `lead_description` | `string` | No | Sanitized text string | `""` | Max 3000 chars | Commercial PII | Omit field | `[PROPOSED]` |
| `attribution.utmSource`| `string` | `lead_source` | `string` | Yes | Direct mapping | `"website"` | Max 50 chars | Marketing Telemetry | Default "website" | `[APPROVED-TARGET]` |
| `attribution.utmMedium`| `string` | `lead_medium` | `string` | No | Direct mapping | `null` | Max 50 chars | Marketing Telemetry | Omit field | `[APPROVED-TARGET]` |
| `attribution.utmCampaign`|`string` | `campaign_code` | `string` | No | Direct mapping | `null` | Max 100 chars | Marketing Telemetry | Omit field | `[APPROVED-TARGET]` |
| `attribution.landingUrl`| `string` | `referrer_url` | `string` | No | Direct mapping | `null` | Valid URL | Marketing Telemetry | Omit field | `[APPROVED-TARGET]` |
| `createdAt` | `DateTime` | `submitted_at_utc` | `string (ISO 8601)`| Yes | Formatted as `YYYY-MM-DDTHH:mm:ss.sssZ` | UTC Now | ISO 8601 UTC | Internal Technical | Autogenerate UTC Now | `[APPROVED-TARGET]` |

---

## 4. Careers Application Forms -> Careers Database

Verified from `FresherJobApplicationForm-CPEVI2CP.js` and `ExperienceJobApplicationForm-cgwMRwCh.js` in `Nexucon-Main-Page/careers/assets` `[VERIFIED-AS-IS]`.

### Mapping Table: Candidate Application -> Careers Database (`careers_db`)

| Source Form Field | Source Type | Careers DB Column | DB Column Type | Required | Transformation | Validation Rule | Sensitive Class | Unmapped Behavior | Approval Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `jobId` | `string` (URL Param) | `job_requisition_id` | `UUID / string` | Yes | Verified against active jobs in DB | Valid requisition ID | Internal Technical | Reject HTTP 404 | `[VERIFIED-AS-IS]` |
| `resume` | `File` (Binary) | `resume_blob_key` | `string` | Yes | Written to private blob; stores blob key | PDF format only; max 4,194,304 bytes (4MB) | Sensitive PII | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `firstName` | `string` | `first_name` | `varchar(100)` | Yes | Trim whitespace; title case | Min 1, max 100 chars | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `lastName` | `string` | `last_name` | `varchar(100)` | Yes | Trim whitespace; title case | Min 1, max 100 chars | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `validEmail` | `string` | `email_address` | `varchar(255)` | Yes | Trim; lowercase; verified matches `confirmEmail` | RFC 5322 regex; max 255 chars | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `phoneNumber` | `string` | `phone_number` | `varchar(30)` | Yes | Remove `+` prefix; validate E.164 | Min 7 digits, max 20 digits | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `jobRole` | `string` | `applied_role_title` | `varchar(150)` | Yes | Validated against role catalog | Must match known job role title | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `location` | `string` | `location_city` | `varchar(100)` | Fresher | Resolves "Other" text input | Max 100 chars | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `highestqualification`| `string` | `highest_qualification`| `varchar(50)` | Yes | Enum: `diploma`, `graduation`, `masters` | Valid enum string | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `secendary` (Class 10) | `number` | `class_10_percentage` | `decimal(5,2)` | Fresher | Parsed float; 60% <= marks <= 100% | Min 60.00, Max 100.00 | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `secboard` | `string` | `class_10_board` | `varchar(50)` | Fresher | Enum: `WBBSE`, `ICSCE`, `CBSE`, `others` | Valid enum string | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `secendaryYear` | `number` | `class_10_passing_year`| `integer` | Fresher | Integer year between 1970 and current + 3 | 1970 <= Year <= YearNow+3 | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `hsMarks` (Class 12) | `number` | `class_12_percentage` | `decimal(5,2)` | Conditional | Required if Diploma omitted; 60% <= marks | Min 60.00, Max 100.00 | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `hsboard` | `string` | `class_12_board` | `varchar(50)` | Conditional | Enum: `WBBSE`, `WBCHSE`, `ICSCE`, `CBSE`, `others`| Valid enum string | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `hsPassingYear` | `number` | `class_12_passing_year`| `integer` | Conditional | Integer year between 1970 and current + 3 | 1970 <= Year <= YearNow+3 | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `diplomaMarks` | `number` | `diploma_percentage` | `decimal(5,2)` | Conditional | Required if Class 12 omitted; 60% <= marks | Min 60.00, Max 100.00 | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `diplomaPassingYear` | `number` | `diploma_passing_year` | `integer` | Conditional | Integer year between 1970 and current + 3 | 1970 <= Year <= YearNow+3 | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `graduationMarks` | `number` | `graduation_percentage`| `decimal(5,2)` | Conditional | Required for Graduation/Masters; 60% <= marks | Min 60.00, Max 100.00 | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `graduationCollege` | `string` | `graduation_college` | `varchar(200)` | Conditional | Trim whitespace | Max 200 chars | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `gradationUniversity`| `string` | `graduation_university`| `varchar(200)` | Conditional | Trim whitespace (note legacy typo in source) | Max 200 chars | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `graduationDegree` | `string` | `graduation_degree` | `varchar(50)` | Conditional | Enum: `BCA`, `Btech`, `BE`, `Bsc`, `BBA`, etc. | Valid enum string | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `graduationStream` | `string` | `graduation_stream` | `varchar(100)` | Conditional | Trim whitespace | Max 100 chars | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `graduationPassingYear`|`number` | `graduation_passing_year`|`integer` | Conditional | Integer year between 1980 and current + 3 | 1980 <= Year <= YearNow+3 | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `postGraduationMarks`| `number` | `post_grad_percentage` | `decimal(5,2)` | Conditional | Required for Masters; 60% <= marks | Min 60.00, Max 100.00 | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `primarySkills` | `string` | `primary_skills` | `text` | Fresher | Comma-separated or free text | Max 1000 chars | Personal (PII) | Discard | `[VERIFIED-AS-IS]` |
| `panCardNumber` | `string` | `pan_card_hash` | `varchar(64)` | Fresher | SHA-256 hash stored; raw PAN never stored | Indian PAN regex `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` | Sensitive Personal (PII)| Discard | `[PROPOSED]` |
| `adhaarCardNumber` | `string` | `aadhaar_card_hash` | `varchar(64)` | Fresher | SHA-256 hash stored; raw UIDAI never stored | 12-digit numeric regex | Sensitive Personal (PII)| Discard | `[PROPOSED]` |
| `yearsOfExperience` | `number` | `total_experience_years`| `decimal(4,1)` | Exp | Float years; min 2, max 30 for experienced | 2.0 <= Years <= 30.0 | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `releventYearsOfExperience`|`number`| `relevant_experience_years`|`decimal(4,1)`| Exp | Float years; <= total experience | 2.0 <= Years <= 30.0 | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `currentCTCCurrency`| `string` | `current_ctc_currency` | `varchar(5)` | Exp | Enum: `INR`, `USD`, `GBP`, `EUR`, `SAR`, `AED` | ISO Currency code | Confidential Personal | Fallback to "GBP" | `[VERIFIED-AS-IS]` |
| `currentCTC` | `number` | `current_ctc_amount` | `decimal(12,2)`| Exp | Normalized numeric value | Numeric > 0 | Confidential Personal | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `expectedCTCCurrency`| `string` | `expected_ctc_currency`| `varchar(5)` | Exp | Enum: `INR`, `USD`, `GBP`, `EUR`, `SAR`, `AED` | ISO Currency code | Confidential Personal | Fallback to "GBP" | `[VERIFIED-AS-IS]` |
| `expectedCTC` | `number` | `expected_ctc_amount` | `decimal(12,2)`| Exp | Normalized numeric value | Numeric > 0 | Confidential Personal | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `noticePeriod` | `number` | `notice_period_days` | `integer` | Exp | Notice period in days; min 0, max 180 | 0 <= Days <= 180 | Personal (PII) | Reject HTTP 400 | `[VERIFIED-AS-IS]` |
| `isCuming` | `boolean` | `can_visit_kolkata_office`| `boolean` | Fresher | In-person interview availability | `false` | Boolean | Personal (PII) | Default false | `[VERIFIED-AS-IS]` |

---

## 5. ATS Job Requisition -> Careers Job Model

Verified from `JobListing-C8HuxP4g.js` and `JobDetails-DrTFRWQg.js` (`/job-posting/display`) `[VERIFIED-AS-IS]`.

### Mapping Table: ATS Requisition -> Public Job View Model

| ATS Source Field | ATS Type | Careers DB Column | Public View Model Field | Required | Transformation | Default | Approval Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `jobId` | `string` | `external_requisition_id`| `requisitionId` | Yes | Direct mapping | None | `[VERIFIED-AS-IS]` |
| `jobName` | `string` | `title` | `jobTitle` | Yes | Direct mapping | None | `[VERIFIED-AS-IS]` |
| `jobRole` | `string` | `role_category` | `roleCategory` | Yes | Direct mapping | None | `[VERIFIED-AS-IS]` |
| `jobDetails` | `string` | `summary` | `shortSummary` | No | HTML sanitized string | `""` | `[VERIFIED-AS-IS]` |
| `location` | `string` | `location_text` | `location` | Yes | Direct mapping | None | `[VERIFIED-AS-IS]` |
| `jobType` | `string` | `employment_type` | `jobType` | Yes | Enum: `Full Time`, `Part Time`, `Contract` | `"Full Time"` | `[VERIFIED-AS-IS]` |
| `experienceLevel` | `string` | `experience_level` | `experienceLevel` | Yes | Enum: `Fresher`, `3-5 years`, `6-8 years`, `9-10 years`, `10+ years` | None | `[VERIFIED-AS-IS]` |
| `applicationDeadline`| `string/date`| `closing_date` | `closingDate` | No | ISO 8601 Date string | `null` | `[VERIFIED-AS-IS]` |
| `jobRequirements` | `string` | `requirements_text` | `requirementsList` | No | Split by newline `\n+` into string array | `[]` | `[VERIFIED-AS-IS]` |
| `jobResponsibilities`|`string` | `responsibilities_text`| `responsibilitiesList` | No | Split by newline `\n+` into string array | `[]` | `[VERIFIED-AS-IS]` |
| `skillRequired` | `string` | `skills_text` | `skillsList` | No | Split by newline `\n+` into string array | `[]` | `[VERIFIED-AS-IS]` |
| `salaryRange` | `string` | `salary_range_display`| `salaryRange` | No | Direct string | `"Competitive"` | `[VERIFIED-AS-IS]` |
| `benefits` | `string` | `benefits_text` | `benefitsList` | No | Split by newline `\n+` into string array | `[]` | `[VERIFIED-AS-IS]` |
| `showApplyButton` | `boolean` | `is_accepting_applications`| `allowApplications`| Yes | Direct boolean mapping | `true` | `[VERIFIED-AS-IS]` |
| `showJobToUser` | `boolean` | `is_publicly_visible` | `isPublished` | Yes | Must be true for public display | `false` | `[VERIFIED-AS-IS]` |
| `createdAt` | `string/date`| `created_at` | `postedDate` | Yes | ISO 8601 Date string | UTC Now | `[VERIFIED-AS-IS]` |

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
* **Strapi Media Engine:** Backed by Azure Blob Storage container `media-public` `[APPROVED-TARGET]`.

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
