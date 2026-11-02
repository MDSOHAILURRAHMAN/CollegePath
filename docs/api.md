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

## Student

| Method and path | Purpose |
| --- | --- |
| `GET /api/student/profile` | Own profile only. |
| `PATCH /api/student/profile` | Validated profile update for the current student. |
| `POST /api/student/consent` | Record/update optional marketing consent. |
| `GET /api/student/saved-colleges` | Current student’s shortlist only. |
| `POST /api/student/saved-colleges` | Save a visible college to the current student’s list. |
| `DELETE /api/student/saved-colleges/{collegeId}` | Remove only the current student’s saved record. |
| `GET /api/student/comparisons` | Current student’s saved comparisons. |
| `POST /api/student/comparisons` | Save a comparison of two or three public college slugs. |
| `GET /api/recommendations` | Current student’s saved recommendation runs. |
| `GET /api/bookings` | Current student’s own counselling bookings. |
| `POST /api/bookings` | Reserve a configured future counsellor slot and create a pending-payment booking. |
| `POST /api/payments/create-order` | Create/reuse a server-side Razorpay order for an owned booking. |

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
| `POST /api/admin/colleges/import` | Admin CSV import, maximum 500 rows/2 MB, row-level validation. |
| `GET /api/admin/services` | Admin counselling services and counsellor accounts. |
| `POST /api/admin/services` | Create a counselling service, inactive by default in the UI. |
| `PATCH /api/admin/services/{serviceId}` | Update/publish a service only when price, deliverables, and policy exist. |
| `GET /api/admin/availability` | Future counsellor slots. |
| `POST /api/admin/availability` | Add a future slot for an account with the counsellor role. |
| `POST /api/webhooks/razorpay` | Verify HMAC, amount, currency, and event idempotency before payment/booking updates. |

## CSV example

```csv
name,slug,institutionType,city,state,officialWebsite,officialAdmissionUrl,sourceName,sourceUrl,description
Sample University,sample-university,OTHER,Jaipur,Rajasthan,https://sample.example,https://sample.example/admissions,Official site,https://sample.example/about,Imported as a draft for review
```

College records imported this way remain drafts. This MVP has not implemented CSV mapping for programs, fees, rankings, placements, or accreditation.