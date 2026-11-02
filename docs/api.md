# API

All JSON endpoints use same-origin requests. Request bodies and query strings are validated server-side. Authenticated endpoints read the Better Auth session and enforce ownership/roles; hiding a control in the browser is not authorization.

## Public

| Method and path | Purpose |
| --- | --- |
| `GET /api/auth/*` | Better Auth session and account endpoints. |
| `POST /api/auth/*` | Better Auth registration, sign-in, sign-out, verification, and reset endpoints. |
| `GET /api/colleges` | Search and filter by query, state, category, institution type, degree, fee range, sort, and page. |
| `GET /api/courses` | Course categories with listed-program counts. |
| `GET /api/states` | Distinct states present in visible college records. |
| `GET /api/compare?colleges=slug&colleges=slug` | Public comparison data for up to three colleges. |
| `POST /api/recommendations` | Validated transparent matching; optionally stores the result for the signed-in student. |
| `POST /api/leads` | Rate-limited public counselling enquiry; returns `201` only after persistence. |
| `GET /api/dev/emails?email=...` | Loopback-only local development mailbox for password-reset previews; returns `404` outside development. |
| `GET /api/health` | Database/provider readiness and verified directory counts; does not return secret values. |

## Student

| Method and path | Purpose |
| --- | --- |
| `GET /api/student/profile` | Own profile only. |
| `PATCH /api/student/profile` | Validated profile update for the current student. |
| `GET /api/student/account` | Download the signed-in student’s account data as JSON, excluding credentials and staff-only notes. |
| `DELETE /api/student/account` | Remove student credentials and personal data, clear private booking notes, de-identify retained financial bookings, and retain required audit records. Requires the exact confirmation phrase and same-site origin. |
| `POST /api/student/consent` | Record/update optional marketing consent. |
| `GET /api/student/saved-colleges` | Current student’s shortlist only. |
| `POST /api/student/saved-colleges` | Save a visible college to the current student’s list. |
| `DELETE /api/student/saved-colleges/{collegeId}` | Remove only the current student’s saved record. |
| `GET /api/student/comparisons` | Current student’s saved comparisons. |
| `POST /api/student/comparisons` | Save a comparison of two or three public college slugs. |
| `DELETE /api/student/comparisons/{comparisonId}` | Delete only the current student’s saved comparison. |
| `GET /api/recommendations` | Current student’s saved recommendation runs. |
| `GET /api/bookings` | Current student’s own counselling bookings. |
| `POST /api/bookings` | Reserve a configured future counsellor slot and create a pending-payment booking. |
| `POST /api/payments/create-order` | Create/reuse a server-side Razorpay order for an owned booking. |
| `POST /api/payments/verify` | Verify Checkout HMAC, fetch the payment from Razorpay, and confirm only a captured payment matching the student's booking. |

## Staff and administration

| Method and path | Purpose |
| --- | --- |
| `GET /api/admin/leads` | Counsellor/admin lead queue with pagination and status filtering. |
| `PATCH /api/admin/leads/{leadId}` | Update lead status, follow-up, or add an internal note; audited. |
| `GET /api/admin/bookings` | Counsellor/admin booking queue. |
| `PATCH /api/admin/bookings/{bookingId}` | Enforced booking transition; confirmation requires verified payment. |
| `GET /api/admin/users` | Admin-only user list without credential fields. |
| `PATCH /api/admin/users/{userId}` | Admin-only role changes; last-admin and self-demotion safeguards. |
| `GET /api/admin/colleges` | Admin college records and source labels. |
| `POST /api/admin/colleges` | Create a draft college record. |
| `PATCH /api/admin/colleges/{collegeId}` | Update verification state; a verified state requires an HTTPS source. |
| `GET /api/admin/colleges/{collegeId}/programs` | List program categories, program records, sources, and fee records. |
| `POST /api/admin/colleges/{collegeId}/programs` | Add a source-linked program with optional academic-year fees; records can start as draft, pending review, or verified after source review. |
| `PATCH /api/admin/colleges/{collegeId}/programs` | Review a program or fee status and attach/update its official source. |
| `POST /api/admin/colleges/import` | Admin CSV import, maximum 500 rows/2 MB, row-level validation. |
| `GET /api/admin/services` | Admin counselling services and counsellor accounts. |
| `POST /api/admin/services` | Create a counselling service, inactive by default in the UI. |
| `PATCH /api/admin/services/{serviceId}` | Update/publish a service only when price, deliverables, and policy exist. |
| `GET /api/admin/availability` | Future counsellor slots. |
| `POST /api/admin/availability` | Add a future slot for an account with the counsellor role. |
| `POST /api/webhooks/razorpay` | Verify raw-body HMAC, amount, currency, and event idempotency before handling `payment.captured` or `payment.failed`. |

## CSV example

```csv
name,slug,institutionType,city,state,officialWebsite,officialAdmissionUrl,sourceName,sourceUrl,description
Sample University,sample-university,OTHER,Jaipur,Rajasthan,https://sample.example,https://sample.example/admissions,Official site,https://sample.example/about,Imported as a draft for review
```

College records imported this way remain drafts. Admins can add source-linked programs and optional fees through `GET`, `POST`, and `PATCH /api/admin/colleges/[collegeId]/programs`. CSV mapping for programs, fees, rankings, placements, or accreditation is not implemented.
