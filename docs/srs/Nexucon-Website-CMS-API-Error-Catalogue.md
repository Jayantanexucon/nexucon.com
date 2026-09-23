# Nexucon Website & Marketing CMS Platform: API Error Catalogue

**Document Reference:** NEX-API-ERR-v1.0  
**Project:** Nexucon Company Website, Careers Engine & Marketing CMS Platform  
**Target Release:** Production Launch (Releases 1, 2, 3)  
**Status:** Draft for Backend, Frontend, Integration, Security, and QA Review  
**Standard Response Contract:** Enforced  
**Security Level:** Restricted — Internal Engineering & Operational Contract  

---

## 1. Architectural Error Envelope & Design Principles

All APIs exposed by the Next.js Backend-for-Frontend (BFF), the Careers Engine, and integration webhooks MUST adhere to the uniform JSON error response specification.

### 1.1 Standard Error Response Schema (`application/json`)

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

### 1.2 Core Error Handling Principles

1. **Security Isolation & PII Protection:** User-facing responses MUST NEVER expose database schema names, stack traces, private Azure resource names, connection strings, or unmasked Personally Identifiable Information (PII). All candidate and lead PII (email, phone, address) must be masked in server telemetry logs (`j***e@enterprise.com`, `+44 *** *** 0958`).
2. **Correlation ID Propagation:** Every request must generate or propagate a unique correlation ID (`req_<ulid>` or Azure `Request-Id`). The correlation ID must be returned in the response envelope and attached to every Application Insights log entry.
3. **HTTP Status Code Precision:** Standard RFC 9110 HTTP status codes must be used strictly:
   - `400 Bad Request`: Syntactic or schema validation failure.
   - `401 Unauthorized`: Missing or invalid authentication token/cookie.
   - `403 Forbidden`: Authenticated caller lacks requisite RBAC permissions.
   - `404 Not Found`: Entity or route does not exist.
   - `409 Conflict`: Business duplicate or concurrency conflict.
   - `410 Gone`: Decommissioned legacy route or closed job requisition.
   - `413 Content Too Large`: Payload or binary upload exceeds configured boundary.
   - `415 Unsupported Media Type`: Non-allowed MIME type or failed magic byte verification.
   - `422 Unprocessable Content`: Semantically invalid data (e.g., date in past).
   - `429 Too Many Requests`: Rate limit threshold breached.
   - `500 Internal Server Error`: Unhandled server exception.
   - `502 Bad Gateway`: Downstream external service (Strapi, CRM, ATS) unreachable.
   - `503 Service Unavailable`: Maintenance mode, circuit breaker open, or queue full.
   - `504 Gateway Timeout`: Downstream external service timed out.

---

## 2. Common & Platform Errors (`COM-*`)

| Error Code | HTTP Status | Audience | User-Safe Message | Internal Log Message | Retryable? | Alert Severity | PII / Security Restriction | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `COM-VALIDATION-001` | 400 | Public / Client | "The request payload failed schema validation." | "Payload validation error: {details} on route {route}" | No | None | Do not log unmasked payload values. | `[PROPOSED]` |
| `COM-MALFORMED-JSON-002` | 400 | Public / Client | "The request body contains invalid or malformed JSON." | "Malformed JSON syntax from IP {clientIp}" | No | None | No restrictions. | `[PROPOSED]` |
| `COM-AUTH-MISSING-003` | 401 | Internal / Client | "Authentication credentials are required to access this resource." | "Missing Authorization header or session cookie on protected route {route}" | No | Sev 3 / Info | Do not log session cookie values. | `[PROPOSED]` |
| `COM-AUTH-INVALID-004` | 401 | Internal / Client | "The provided authentication token is invalid or has expired." | "Token verification failed: {reason} on route {route}" | No (Re-authenticate) | Sev 3 / Info | Do not log raw JWT tokens. | `[PROPOSED]` |
| `COM-FORBIDDEN-005` | 403 | Internal / Client | "You do not have permission to perform this action." | "RBAC access denied for user {userId} requiring role {requiredRole}" | No | Sev 2 / Warning | Log user identity and role attempt; no sensitive data. | `[PROPOSED]` |
| `COM-NOT-FOUND-006` | 404 | Public / Client | "The requested resource could not be found." | "Resource not found for identifier {id} on entity {entityType}" | No | None | Avoid reflecting unsanitized input URLs. | `[PROPOSED]` |
| `COM-CONFLICT-007` | 409 | Public / Client | "A conflicting resource already exists or operation was previously completed." | "Conflict detected: duplicate key or concurrent modification on {resource}" | No | None | Mask conflict identifiers if PII. | `[PROPOSED]` |
| `COM-PAYLOAD-TOO-LARGE-008`| 413 | Public / Client | "The request payload exceeds the maximum allowed size limit." | "Content-Length {contentLength} exceeds limit of {maxLimit}" | No | None | No restrictions. | `[PROPOSED]` |
| `COM-UNSUPPORTED-MEDIA-009`| 415 | Public / Client | "The request media type is unsupported. Expected application/json or multipart/form-data." | "Invalid Content-Type header received: {contentType}" | No | None | No restrictions. | `[PROPOSED]` |
| `COM-RATE-LIMIT-010` | 429 | Public / Client | "Too many requests. Please wait before attempting this action again." | "Rate limit breached for IP {clientIp} on bucket {bucketName}. Limit: {limit}, Window: {window}s" | Yes (After `Retry-After` seconds) | Sev 3 / Info | Hash IP address if GDPR compliance requires pseudonymous logging. | `[PROPOSED]` |
| `COM-INTERNAL-ERROR-011` | 500 | Public / Client | "An unexpected error occurred while processing your request. Please try again later." | "Unhandled Exception in {handler}: {exceptionClass} - {exceptionMessage}. Stack: {stackTrace}" | Yes (Exponential backoff) | Sev 1 / Critical | NEVER expose stack trace in HTTP response body. Mask PII in stack traces. | `[PROPOSED]` |
| `COM-DOWNSTREAM-TIMEOUT-012`| 504 | Public / Client | "The upstream service took too long to respond. Please try again later." | "Downstream gateway timeout calling {serviceName} at {endpoint} after {timeoutMs}ms" | Yes (Exponential backoff) | Sev 2 / Warning | Do not leak internal hostnames or service URIs to user. | `[PROPOSED]` |
| `COM-CIRCUIT-OPEN-013` | 503 | Public / Client | "The service is temporarily unavailable due to upstream maintenance. Please retry shortly." | "Circuit breaker is OPEN for {serviceName}. Fast-failing inbound request." | Yes (After backoff) | Sev 1 / Critical | No restrictions. | `[PROPOSED]` |

---

## 3. Lead & Contact Domain Errors (`LEAD-*`)

| Error Code | HTTP Status | Audience | User-Safe Message | Internal Log Message | Retryable? | Alert Severity | PII / Security Restriction | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `LEAD-TURNSTILE-MISSING-001` | 400 | Public Web | "Anti-bot verification token is required." | "Turnstile verification token missing in lead submission payload" | No | None | None | `[VERIFIED-AS-IS]` |
| `LEAD-TURNSTILE-FAILED-002` | 403 | Public Web | "Security verification failed. Please refresh the page and try again." | "Cloudflare Turnstile token validation failed with error codes: {cfErrors}" | No | Sev 3 / Info | None | `[VERIFIED-AS-IS]` |
| `LEAD-HONEYPOT-TRIGGERED-003`| 200 (Silent Drop) | Public Web | "Enquiry received." (Simulated success to deter bot discovery) | "Honeypot field triggered: field {field} had value '{val}' from IP {clientIp}" | No | None | Do not disclose detection to client. | `[VERIFIED-AS-IS / PROPOSED]` |
| `LEAD-NAME-INVALID-004` | 400 | Public Web | "Please provide your full name (at least 2 characters)." | "Validation failure: name length < 2 or invalid characters" | No | None | Mask name in logs. | `[PROPOSED]` |
| `LEAD-EMAIL-INVALID-005` | 400 | Public Web | "Please provide a valid business email address." | "Validation failure: email format invalid: {maskedEmail}" | No | None | Mask email in logs (`j***e@domain.com`). | `[PROPOSED]` |
| `LEAD-PHONE-INVALID-006` | 400 | Public Web | "Please provide a valid phone number with international country dialing code." | "Validation failure: phone number failed E.164 parsing" | No | None | Mask phone in logs (`+44 *** *** 0958`). | `[PROPOSED]` |
| `LEAD-CONTACT-METHOD-007` | 400 | Public Web | "Either a valid email address or phone number must be provided." | "Validation failure: neither email nor phone provided in legacy form submission" | No | None | None | `[VERIFIED-AS-IS]` |
| `LEAD-MESSAGE-TOO-SHORT-008`| 400 | Public Web | "Please provide a brief description of your enquiry (minimum 10 characters)." | "Validation failure: message length {len} < 10" | No | None | Do not log full message body if containing commercial secrets. | `[PROPOSED]` |
| `LEAD-MESSAGE-TOO-LONG-009` | 400 | Public Web | "Your message exceeds the maximum allowed length of 2,000 characters." | "Validation failure: message length {len} > 2000" | No | None | None | `[PROPOSED]` |
| `LEAD-DUPLICATE-DETECTED-010`| 409 | Public Web | "A similar enquiry has already been received. An advisor will contact you shortly." | "Duplicate lead detected via hash {idempotencyHash}. Existing lead ID: {leadId}" | No | None | Do not re-dispatch to CRM. | `[PROPOSED]` |
| `LEAD-CRM-DISPATCH-FAILED-011`| 502 / Outbox Queued | External / Log | "Enquiry received. An enterprise architect will respond within 24 hours." (Saved locally in outbox) | "Outbound CRM HTTP dispatch failed: {statusCode} {errorBody}. Queued in transactional outbox for retry." | Yes (Async Retry) | Sev 2 / Warning | Lead MUST NOT be lost. Stored in outbox table with status PENDING_RETRY. | `[PROPOSED]` |
| `LEAD-CRM-TIMEOUT-012` | 504 / Outbox Queued | External / Log | "Enquiry received. An enterprise architect will respond within 24 hours." | "CRM gateway timed out after {timeoutMs}ms. Retrying via background worker." | Yes (Async Retry) | Sev 2 / Warning | None | `[PROPOSED]` |

---

## 4. Careers & Candidate Application Domain Errors (`CAR-*`)

| Error Code | HTTP Status | Audience | User-Safe Message | Internal Log Message | Retryable? | Alert Severity | PII / Security Restriction | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CAR-JOB-NOT-FOUND-001` | 404 | Public Web | "The requested job opening could not be found." | "Job requisition ID {jobId} / slug {slug} not found in careers repository" | No | None | None | `[PROPOSED]` |
| `CAR-JOB-CLOSED-002` | 410 | Public Web | "This job requisition is no longer accepting applications." | "Application rejected: Job requisition {jobId} status is CLOSED or closing date {closingDate} elapsed" | No | None | None | `[PROPOSED]` |
| `CAR-CONSENT-REQUIRED-003` | 400 | Candidate | "You must provide consent for candidate data processing to submit your application." | "Validation failure: consentDataProcessing is false or missing" | No | None | None | `[PROPOSED]` |
| `CAR-RESUME-MISSING-004` | 400 | Candidate | "Please attach your resume in PDF or DOCX format." | "Multipart form missing required file field 'resume'" | No | None | None | `[VERIFIED-AS-IS]` |
| `CAR-RESUME-TOO-LARGE-005` | 413 | Candidate | "The uploaded resume exceeds the maximum size limit of 4 MB (legacy baseline) / 5 MB (proposed target)." | "Resume upload rejected: file size {fileSize} bytes exceeds maximum allowed limit" | No | None | None | `[VERIFIED-AS-IS / PROPOSED]` |
| `CAR-RESUME-INVALID-EXT-006`| 415 | Candidate | "Only .pdf (legacy) or .pdf/.docx (proposed) resume files are permitted." | "File extension {ext} not permitted in resume upload" | No | None | None | `[VERIFIED-AS-IS / PROPOSED]` |
| `CAR-RESUME-MAGIC-BYTE-007` | 415 | Candidate | "The uploaded file format does not match a valid PDF or Word document." | "Magic byte mismatch: uploaded file MIME claims {mime} but buffer header is {hexHeader}" | No | Sev 2 / Warning | Security audit: potential file spoofing or malware payload attempt. | `[PROPOSED]` |
| `CAR-RESUME-VIRUS-FOUND-008`| 422 | Candidate | "The uploaded resume failed security scanning. Please provide an uninfected document." | "Azure Defender / ClamAV scan reported malware in uploaded resume: {signature}" | No | Sev 1 / Critical | Quarantine file immediately. Never write to public storage. Log candidate IP and hash. | `[PROPOSED]` |
| `CAR-STORAGE-UPLOAD-FAIL-009`| 502 | Candidate / Log | "Unable to upload application documents at this time. Please retry shortly." | "Azure Blob Storage upload failed for container resumes-private: {azureError}" | Yes | Sev 1 / Critical | Do not expose storage connection string or private container URL. | `[PROPOSED]` |
| `CAR-DUPLICATE-APP-010` | 409 | Candidate | "You have already submitted an application for this position within the last 30 days." | "Duplicate application detected: candidate {emailHash} for requisition {jobId}" | No | None | Mask candidate email in log. | `[PROPOSED]` |
| `CAR-SAS-UNAUTHORIZED-011` | 403 | Recruiter | "You are not authorized to generate download links for candidate resumes." | "Recruiter {recruiterId} lacks permission to download resume for application {applicationId}" | No | Sev 2 / Warning | Log recruiter ID, user roles, and target candidate application ID. | `[PROPOSED]` |
| `CAR-SAS-EXPIRED-012` | 410 | Recruiter | "This download link has expired. Please refresh the portal to generate a new link." | "Attempted access of expired SAS URL on blob {blobUri}" | Yes (Generate new link) | None | SAS tokens expire in 15 minutes. | `[PROPOSED]` |
| `CAR-BLOB-NOT-FOUND-013` | 404 | Recruiter | "The resume document could not be located in secure storage." | "Blob path {blobPath} referenced in application {applicationId} not found in Azure container" | No | Sev 2 / Warning | Investigate potential storage deletion or orphaned record. | `[PROPOSED]` |

---

## 5. ATS Integration Domain Errors (`ATS-*`)

| Error Code | HTTP Status | Audience | User-Safe Message | Internal Log Message | Retryable? | Alert Severity | PII / Security Restriction | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ATS-SIG-MISSING-001` | 401 | External ATS | "Signature header X-Nexucon-ATS-Signature is missing." | "Inbound ATS webhook rejected: missing signature header" | No | Sev 2 / Warning | None | `[PROPOSED]` |
| `ATS-SIG-INVALID-002` | 401 | External ATS | "HMAC signature verification failed." | "Inbound ATS webhook HMAC SHA-256 verification failed for payload hash {hash}" | No | Sev 2 / Warning | Security event: possible unauthorized spoofing attempt. | `[PROPOSED]` |
| `ATS-TIMESTAMP-SKEW-003` | 400 | External ATS | "Webhook timestamp skew exceeds maximum tolerance of 300 seconds." | "ATS webhook timestamp {ts} differs from server time {now} by {delta}s" | No | Sev 3 / Info | Replay attack prevention. | `[PROPOSED]` |
| `ATS-EVENT-UNKNOWN-004` | 422 | External ATS | "Unrecognized ATS event type received." | "Unknown event '{event}' in ATS webhook payload" | No | Sev 3 / Info | None | `[PROPOSED]` |
| `ATS-PAYLOAD-MALFORMED-005` | 400 | External ATS | "Payload does not conform to ATS integration schema." | "ATS schema validation error: {details}" | No | Sev 2 / Warning | None | `[PROPOSED]` |
| `ATS-REQ-ID-MISSING-006` | 400 | External ATS | "Field 'externalRequisitionId' is mandatory." | "Missing externalRequisitionId in ATS event payload" | No | Sev 3 / Info | None | `[PROPOSED]` |
| `ATS-SYNC-DB-FAILED-007` | 500 | External ATS | "Internal database error updating job requisition." | "Database error during ATS requisition upsert: {error}" | Yes (Retry webhook) | Sev 1 / Critical | Ensure database transaction rollback. | `[PROPOSED]` |

---

## 6. Strapi 5 & Headless CMS Domain Errors (`CMS-*`)

| Error Code | HTTP Status | Audience | User-Safe Message | Internal Log Message | Retryable? | Alert Severity | PII / Security Restriction | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CMS-UNREACHABLE-001` | 502 | Next.js Server | "Content service is temporarily unavailable." | "Strapi 5 REST API unreachable at {strapiHost}: {connectionError}" | Yes (Backoff) | Sev 1 / Critical | Mask internal Strapi App Service hostname. Fallback to cached ISR page. | `[PROPOSED]` |
| `CMS-AUTH-TOKEN-INVALID-002`| 500 | Next.js Server | "Failed to authenticate with Content Management Service." | "Strapi API returned 401 Unauthorized for configured STRAPI_API_TOKEN" | No | Sev 1 / Critical | NEVER log Strapi bearer token in error logs. | `[PROPOSED]` |
| `CMS-NOT-FOUND-003` | 404 | Public Visitor | "The requested page could not be found." | "Strapi returned 0 entries for query {entity}?filters[slug][$eq]={slug}" | No | None | Trigger Next.js `notFound()` handler. | `[PROPOSED]` |
| `CMS-REV-SECRET-INVALID-004`| 401 | Strapi Webhook | "Invalid or missing revalidation authorization secret." | "Cache revalidation webhook rejected: invalid NEXT_REVALIDATION_SECRET" | No | Sev 2 / Warning | Security event: unauthorized cache purge attempt. | `[PROPOSED]` |
| `CMS-REV-TAG-MISSING-005` | 400 | Strapi Webhook | "Revalidation request payload must specify model or tags." | "Revalidation webhook payload missing model/slug/tags identifiers" | No | Sev 3 / Info | None | `[PROPOSED]` |
| `CMS-PREVIEW-SECRET-BAD-006`| 401 | CMS Editor | "Invalid preview secret token." | "Draft mode toggle rejected: invalid PREVIEW_SECRET token" | No | Sev 3 / Info | None | `[PROPOSED]` |
| `CMS-PREVIEW-TARGET-BAD-007`| 404 | CMS Editor | "Draft content could not be found for the specified slug and type." | "Draft mode query found no draft or published entry for {type}/{slug}" | No | None | None | `[PROPOSED]` |

---

## 7. Legacy Prototype Decommissioning Errors (`LEGACY-*`)

During the phase-out of prototype routes in the current Next.js repository, legacy clients or bookmarks will receive explicit retirement errors:

| Error Code | HTTP Status | Audience | User-Safe Message | Internal Log Message | Retryable? | Alert Severity | PII / Security Restriction | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `LEGACY-AUTH-DISABLED-001` | 410 Gone | Prototype Client | "This authentication endpoint has been retired. Please access the Strapi Admin or use Microsoft Entra ID." | "Deprecated POST /api/auth/login invoked by IP {clientIp}" | No | Sev 3 / Info | Reject password payloads immediately without hashing. | `[PROPOSED]` |
| `LEGACY-CONTENT-RETIRED-002`| 410 Gone | Prototype Client | "Content management has migrated to Strapi 5. Custom /api/content is decommissioned." | "Deprecated POST /api/content invoked by IP {clientIp}" | No | None | None | `[PROPOSED]` |
| `LEGACY-ENQUIRY-DEPRECATED-003`| 308 Perm Redirect | Public Web | "Redirecting to /api/leads." | "Legacy POST /api/enquiries routed to /api/leads adapter" | No | None | Forward to new endpoint with Turnstile token. | `[PROPOSED]` |
| `LEGACY-UPLOAD-DISABLED-004`| 410 Gone | Prototype Client | "Local disk media uploads are disabled. Use Strapi Media Library for public assets or /api/careers/apply for resumes." | "Deprecated POST /api/upload invoked by IP {clientIp}" | No | Sev 2 / Warning | Prevent disk write vulnerability. | `[PROPOSED]` |
| `LEGACY-ANALYTICS-RETIRED-005`| 410 Gone | Client Tracker | "Database beacon analytics is retired. Telemetry is tracked via GA4 and Application Insights." | "Deprecated POST /api/analytics invoked by IP {clientIp}" | No | None | Return 410 Gone without database write. | `[PROPOSED]` |
| `LEGACY-ADMIN-ROUTE-LOCKED-006`| 410 Gone | Browser Client | "The requested administration interface is permanently decommissioned." | "Attempted access to retired /admin routes. IP: {clientIp}" | No | Sev 3 / Info | Do not leak legacy admin structure. | `[PROPOSED]` |

---

## 8. Summary of Error Code Prefixes & Severity Matrix

```
Prefix Breakdown:
  COM-*    : Common Platform & Infrastructure Errors (001 - 099)
  LEAD-*   : Lead Ingestion & CRM Errors (001 - 099)
  CAR-*    : Careers & Candidate Application Errors (001 - 099)
  ATS-*    : External ATS Webhook & Sync Errors (001 - 099)
  CMS-*    : Strapi 5 Headless CMS & Revalidation Errors (001 - 099)
  LEGACY-* : Retired Prototype Route Decommissioning Notices (001 - 099)

Severity Levels:
  Sev 1 (Critical) : Complete feature outage, data loss risk, malware/security breach, downstream service hard failure. Immediate on-call pager.
  Sev 2 (Warning)  : Integration sync failure, circuit breaker open, repeated HMAC failure, retryable CRM queue backlog. High-priority ticket.
  Sev 3 (Info)     : Authentication failure, rate limit throttle, single-instance validation error. Operational log metric only.
  None             : Normal user validation feedback (400, 404, 409). No operational alert.
```

---

## 9. Change Log & Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| **v1.0** | 2026-09-23 | Senior Backend Engineer | Initial Error Catalogue drafting with 42 centralized error codes. |
| **v1.1** | 2026-09-23 | Senior Backend Engineer | **Contract Consistency Review & Reconciliation:**<br>1. Updated document status to `Draft for Backend, Frontend, Integration, Security, and QA Review`.<br>2. Corrected example JSON error schema in Section 1.1: replaced legacy code `"INVALID_EMAIL_FORMAT"` with `"LEAD-EMAIL-INVALID-005"`.<br>3. Locked `LEAD-HONEYPOT-TRIGGERED-003` HTTP status strictly to `200 OK` (silent drop) to prevent bots from discovering trap detection.<br>4. Locked `LEGACY-ADMIN-ROUTE-LOCKED-006` and `LEGACY-ANALYTICS-RETIRED-005` strictly to `410 Gone`.<br>5. Reclassified error codes from `[APPROVED-TARGET]` to `[PROPOSED]` to align with project governance policies. |
