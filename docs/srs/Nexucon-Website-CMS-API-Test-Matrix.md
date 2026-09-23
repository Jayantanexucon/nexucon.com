# Nexucon Website & Marketing CMS Platform: API Test Matrix & QA Verification Plan

**Document Reference:** NEX-API-TST-v1.0  
**Project:** Nexucon Company Website, Careers Engine & Marketing CMS Platform  
**Target Release:** Production Launch (Releases 1, 2, 3)  
**Standard Response Contract:** Enforced  
**QA Lead:** QA Automation Lead & Senior Backend Engineer  

---

## 1. Test Strategy & Scope Overview

This test matrix defines the comprehensive validation suite for all public Route Handlers, Careers APIs, Strapi CMS webhooks, and enterprise integration adapters across the Nexucon digital ecosystem.

### Testing Domains Covered
1. **Functional Verification:** Positive path execution against standard request/response contracts.
2. **Boundary Testing:** String length minimums/maximums, pagination edge cases, and file size limits (5 MB ceiling).
3. **Negative & Schema Validation:** Malformed JSON, missing required fields, type mismatches, and unsupported HTTP methods.
4. **Security & Vulnerability Testing:** Bot challenge bypass, file upload spoofing, magic byte tampering, path traversal, XSS injection, HMAC signature verification, and RBAC authorization boundaries.
5. **Idempotency & Concurrency:** Duplicate submissions, double-clicks, and replay attack prevention.
6. **Rate Limiting & Throttling:** Quota exhaustion on public forms and burst protection on webhooks.
7. **Downstream Failure & Resilience:** Outbox fallback when CRM is unavailable, graceful degradation when Strapi is down, and storage timeout handling.

---

## 2. API Test Matrix

| Test ID | Endpoint & Method | Scenario Description | Test Type | Input Conditions | Expected HTTP | Expected Response / Behavior Assertion | Severity | Target Automation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-LEAD-001** | `POST /api/leads` | Standard contact form submission | Functional | Valid name, email, phone, message, valid Turnstile token | `201 Created` | `{ success: true, data: { leadId, status: "RECEIVED" } }` | High | Automated (Jest/Supertest) |
| **TC-LEAD-002** | `POST /api/leads` | SAP consultation submission with UTM attribution | Functional | Full SAP payload with company size, city, complete `attribution` object | `201 Created` | Lead saved with attribution; status `RECEIVED` | High | Automated (Supertest) |
| **TC-LEAD-003** | `POST /api/leads` | Missing Cloudflare Turnstile token | Security / Negative | Payload with valid fields but omitted `turnstileToken` | `400 Bad Request` | `{ success: false, errors: [{ code: "LEAD-TURNSTILE-MISSING-001" }] }` | Critical | Automated (Supertest) |
| **TC-LEAD-004** | `POST /api/leads` | Invalid / forged Turnstile token | Security | Fake Turnstile token string (`"fake_token_123"`) | `403 Forbidden` | Server fails validation against Cloudflare API; returns `LEAD-TURNSTILE-FAILED-002` | Critical | Automated (Supertest with WireMock) |
| **TC-LEAD-005** | `POST /api/leads` | Honeypot field filled by bot | Security / Anti-Spam | Populated `website_url` or `fax_number` | `200 OK` (Silent Drop) | Response returns simulated success; no record inserted in database | High | Automated (Supertest) |
| **TC-LEAD-006** | `POST /api/leads` | Invalid RFC 5322 email format | Negative | `email: "not-an-email@"` | `400 Bad Request` | `{ success: false, errors: [{ field: "email", code: "LEAD-EMAIL-INVALID-005" }] }` | Medium | Automated (Supertest) |
| **TC-LEAD-007** | `POST /api/leads` | Invalid phone number format | Boundary / Negative| `phone: "12345"` (Not valid E.164) | `400 Bad Request` | Error identifies phone field failure | Medium | Automated (Supertest) |
| **TC-LEAD-008** | `POST /api/leads` | Message exceeds maximum 2000 chars | Boundary | String of 2,001 characters in `message` | `400 Bad Request` | Error code `LEAD-MESSAGE-TOO-LONG-009` | Low | Automated (Supertest) |
| **TC-LEAD-009** | `POST /api/leads` | Duplicate submission within 5-min window | Idempotency | Identical payload submitted 2 seconds apart | `409 Conflict` | Error code `LEAD-DUPLICATE-DETECTED-010`; single DB entry | High | Automated (Supertest) |
| **TC-LEAD-010** | `POST /api/leads` | Rate limit breached (> 5 req / 10 min) | Rate Limiting | 6 consecutive requests from same IP in 1 minute | `429 Too Many Requests` | Header `Retry-After` present; error code `COM-RATE-LIMIT-010` | High | Automated (k6 Load Test) |
| **TC-LEAD-011** | `POST /api/leads` | XSS / HTML script payload injection | Security | `fullName: "<script>alert(1)</script>"` | `201 Created` | Script tags sanitized or HTML-escaped before persistence | Critical | Automated (Supertest + DB check) |
| **TC-LEAD-012** | `POST /api/leads` | External CRM is down (HTTP 500 / Timeout) | Integration Resilience | Valid lead payload; CRM gateway mocked to return 500 | `201 Created` | Lead committed to local outbox table with status `PENDING_RETRY`; user gets success | Critical | Automated (Mocked CRM) |
| **TC-CAR-001** | `GET /api/careers/jobs` | Retrieve active job requisitions | Functional | Query parameters: `?page=1&limit=10` | `200 OK` | `{ success: true, data: { total, jobs: [...] } }` | High | Automated (Supertest) |
| **TC-CAR-002** | `GET /api/careers/jobs` | Filter jobs by practice area and location | Functional | `?practiceArea=SAP&location=London` | `200 OK` | Only matching open jobs returned | Medium | Automated (Supertest) |
| **TC-CAR-003** | `GET /api/careers/jobs/[slug]`| Retrieve valid job requisition by slug | Functional | Valid slug: `principal-sap-s4hana-architect` | `200 OK` | Job detail object including structured data | High | Automated (Supertest) |
| **TC-CAR-004** | `GET /api/careers/jobs/[slug]`| Request non-existent or draft job slug | Negative | Slug: `non-existent-job-slug` | `404 Not Found` | Error code `CAR-JOB-NOT-FOUND-001` | Medium | Automated (Supertest) |
| **TC-CAR-005** | `POST /api/careers/apply`| Valid candidate application with PDF resume | Functional | Valid candidate fields + 2 MB valid PDF file | `201 Created` | Resume uploaded to Azure container `resumes-private`; DB record created | High | Automated (Supertest + Azure Mock) |
| **TC-CAR-006** | `POST /api/careers/apply`| Valid candidate application with DOCX resume | Functional | Valid candidate fields + 3 MB valid Word DOCX file | `201 Created` | Magic bytes PK\x03\x04 verified; successful submission | High | Automated (Supertest) |
| **TC-CAR-007** | `POST /api/careers/apply`| Candidate consent checkbox omitted | Negative | `consentDataProcessing: false` | `400 Bad Request` | Error code `CAR-CONSENT-REQUIRED-003` | High | Automated (Supertest) |
| **TC-CAR-008** | `POST /api/careers/apply`| Resume file exceeds 5 MB limit | Boundary | Multipart upload with 5,242,881 bytes PDF | `413 Content Too Large` | Error code `CAR-RESUME-TOO-LARGE-005` | High | Automated (Supertest) |
| **TC-CAR-009** | `POST /api/careers/apply`| Executable renamed to .pdf (Magic byte check) | Security | `.exe` file renamed to `resume.pdf` | `415 Unsupported Media Type` | Magic byte mismatch detected; error `CAR-RESUME-MAGIC-BYTE-007` | Critical | Automated (Supertest) |
| **TC-CAR-010** | `POST /api/careers/apply`| Duplicate candidate application (< 30 days) | Idempotency | Same candidate email applying to same `jobId` twice | `409 Conflict` | Error code `CAR-DUPLICATE-APP-010` | High | Automated (Supertest) |
| **TC-CAR-011** | `POST /api/careers/apply`| Application for closed job requisition | Business Negative | Valid application targeting job with status `CLOSED` | `410 Gone` | Error code `CAR-JOB-CLOSED-002` | Medium | Automated (Supertest) |
| **TC-CAR-012** | `GET /api/careers/admin/applications/[id]/resume-url` | Generate SAS download URL with Recruiter role | Functional / Auth | Valid session cookie with role `Recruiter` | `200 OK` | Valid Azure SAS URL returned; expires in 15 minutes | High | Automated (Authenticated Supertest) |
| **TC-CAR-013** | `GET /api/careers/admin/applications/[id]/resume-url` | Unauthenticated request for candidate resume | Security | Request without valid Entra ID session | `401 Unauthorized` | Error code `COM-AUTH-MISSING-003` | Critical | Automated (Supertest) |
| **TC-CAR-014** | `GET /api/careers/admin/applications/[id]/resume-url` | Non-recruiter user role (e.g. Marketing Editor)| Security | Valid session with role `Marketing_Editor` | `403 Forbidden` | Access denied; error code `CAR-SAS-UNAUTHORIZED-011` | Critical | Automated (Supertest) |
| **TC-REV-001** | `POST /api/revalidate` | Valid Strapi entry publish webhook | Functional | Valid `Authorization: Bearer <secret>`, payload: `{ model: "service", entry: { slug: "sap" } }` | `200 OK` | Next.js tag cache revalidated; returns `{ revalidated: true }` | High | Automated (Supertest) |
| **TC-REV-002** | `POST /api/revalidate` | Invalid revalidation bearer token | Security | Request with incorrect authorization token | `401 Unauthorized` | Error code `CMS-REV-SECRET-INVALID-004` | Critical | Automated (Supertest) |
| **TC-REV-003** | `POST /api/revalidate` | Missing payload model / tags | Negative | `{}` empty JSON body | `400 Bad Request` | Error code `CMS-REV-TAG-MISSING-005` | Medium | Automated (Supertest) |
| **TC-DFT-001** | `GET /api/draft` | Valid preview request from Strapi | Functional | `?secret=<valid>&slug=sap-cloud&type=service` | `307 Temporary Redirect`| Redirects to `/services/sap-cloud`; sets `__prerender_bypass` cookie | High | Automated (Supertest) |
| **TC-DFT-002** | `GET /api/draft` | Invalid preview secret parameter | Security | `?secret=wrong_secret&slug=sap-cloud` | `401 Unauthorized` | Error code `CMS-PREVIEW-SECRET-BAD-006` | High | Automated (Supertest) |
| **TC-ATS-001** | `POST /api/integrations/ats/jobs` | Inbound job update with valid HMAC signature | Functional / Integration | Valid payload; header `X-Nexucon-ATS-Signature: <hmac>` | `200 OK` | Requisition upserted in Careers DB; ISR tag revalidated | Critical | Automated (Supertest with Crypto) |
| **TC-ATS-002** | `POST /api/integrations/ats/jobs` | Tampered payload or bad HMAC signature | Security | Modifying payload body after HMAC calculation | `401 Unauthorized` | Signature mismatch detected; error `ATS-SIG-INVALID-002` | Critical | Automated (Supertest) |
| **TC-ATS-003** | `POST /api/integrations/ats/jobs` | Replay attack with expired timestamp (> 300s) | Security | Valid HMAC but `timestamp` header is 6 minutes old | `400 Bad Request` | Timestamp skew exceeded; error `ATS-TIMESTAMP-SKEW-003` | High | Automated (Supertest) |
| **TC-LEG-001** | `POST /api/auth/login` | Access deprecated prototype login route | Regression / Lifecycle | Arbitrary credentials posted to old route | `410 Gone` | Error code `LEGACY-AUTH-DISABLED-001` | High | Automated (Supertest) |
| **TC-LEG-002** | `POST /api/enquiries` | Legacy contact route invocation | Regression / Redirect | Legacy enquiry payload posted to `/api/enquiries` | `308 Permanent Redirect`| Redirect header points to `/api/leads` | High | Automated (Supertest) |
| **TC-LEG-003** | `POST /api/upload` | Deprecated local file upload endpoint | Regression / Security | Multipart file posted to old upload route | `410 Gone` | Error code `LEGACY-UPLOAD-DISABLED-004`; no file written | High | Automated (Supertest) |

---

## 3. Test Execution & Automation Stack

```
+-------------------------------------------------------------+
|                      Test Automation Layers                 |
+-------------------------------------------------------------+
| 1. Unit & Schema Tests (Jest + Zod)                         |
|    - Validates Zod request schemas and magic-byte buffers   |
| 2. Integration & Route Tests (Supertest + Next.js Server)   |
|    - Tests full HTTP request lifecycle against local DB      |
| 3. Contract & Mocking (WireMock / MSW)                      |
|    - Mocks external CRM Gateway, Cloudflare, & ATS webhooks  |
| 4. Security & Penetration Tests (OWASP ZAP + Custom Fuzzer) |
|    - Validates Turnstile bypass, header spoofing, XSS       |
| 5. Performance & Load Tests (k6)                            |
|    - 500 virtual users testing rate limits and cache hits   |
+-------------------------------------------------------------+
```
