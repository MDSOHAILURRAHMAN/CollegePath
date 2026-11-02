# CollegePath

CollegePath is a student-first college discovery and counselling MVP built with Next.js App Router, TypeScript, Tailwind CSS, Prisma 7, PostgreSQL, Better Auth, Zod, and Razorpay's server SDK.

## Requirements

- Node.js 22.14 or newer
- npm 10+
- Docker Desktop with its engine running, or another PostgreSQL 16-compatible database

## Local development

1. Install dependencies and create local environment settings:

	```powershell
	npm ci
	Copy-Item .env.example .env
	```

2. Replace `BETTER_AUTH_SECRET` in `.env` with a generated value:

	```powershell
	node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
	```

3. Start PostgreSQL:

	```powershell
	docker compose up -d postgres
	```

4. Apply migrations and seed the sourced NIRF directory, JoSAA program snapshot, and local-only demo fixtures:

	```powershell
	npm run db:deploy
	npm run db:seed
	```

5. Start the app:

	```powershell
	npm run dev
	```

Open http://localhost:3000. The seed includes the NIRF India Rankings 2025 Overall top ten and Universities top 100 (106 unique institutions), plus the official JoSAA 2026-27 participating-institute cohort. The snapshot captured on 2 November 2026 covers 138 institutes, 1,007 program listings, and 28 fee panels that explicitly refer to the 2026-27 session; 11 directory entries had no program rows in the captured profiles. Some fee panels link to an institute’s separate fee page instead of listing amounts. Captured fee text and links are preserved verbatim and are not converted into annual totals or compared across semesters, categories, or accommodation choices. The directory is a useful national cohort, not a complete catalog of every Indian college or course. Clearly labelled fictional UI fixtures are added only outside production and are excluded from recommendations.

If Docker Desktop is installed but not running, start Docker Desktop before step 3. If PostgreSQL is hosted elsewhere, set `DATABASE_URL` to that connection string instead.

## First administrator

Register through the site; public registration can create student accounts only. Then promote the account from a trusted local terminal:

```powershell
npm run admin:promote -- you@example.com ADMIN
```

Admins can grant counsellor/admin access from **Account access**. The CLI also supports `STUDENT` and `COUNSELLOR`. At least one admin must remain.

## Development commands

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

`npm run db:migrate` is for local schema changes and creates new migrations. Use `npm run db:deploy` to apply checked-in migrations in a deployment. `npm run data:sync:josaa` refreshes the official source snapshot; inspect the generated JSON diff before committing it, then run `npm run db:seed` to upsert source-linked records. This data refresh is a manual annual release step, not an automatic live scrape.

GitHub Actions runs the production build, lint, and type check against PostgreSQL on pushes and pull requests to `main`.

## Included workflows

- Server-side college search, category/type/degree/state/fee filters, pagination, and URL-based search state.
- College details and comparisons show source, year, and verification status; missing values remain “Not available.”
- Better Auth email/password signup, sign-in, sign-out, session handling, and server-side role checks.
- Student profile, saved colleges, saved comparisons, private recommendation history, and booking history.
- Transparent recommendations match verified programs when available; when no verified program data match, they return clearly labelled NIRF ranking-and-location exploration suggestions without claiming course, fee, eligibility, or admission fit.
- Contact enquiries persist to PostgreSQL; staff can add internal notes, follow-up dates, and update lead status.
- Students can export their account data as JSON or delete their account; deletion removes credentials and student data, clears private booking notes, de-identifies retained financial bookings, and keeps only necessary audit records.
- Admin college drafts, source review/verification, CSV import, account roles, counselling services, availability, and booking status.
- Razorpay server-created orders, server-side checkout signature and captured-payment verification, and signed payment webhooks. Browser checkout never marks a booking paid.
- `/api/health` reports database status, provider configuration status, and verified directory coverage without exposing credentials.

## Optional services

- **Email:** Production startup requires `RESEND_API_KEY` and `EMAIL_FROM`. Verify the sender domain in Resend and use a domain-scoped sending key. In local development without a provider, reset messages are stored in an ignored local mailbox at `/dev/emails`; verification is not required.
- **Payments:** Production startup requires live `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Use test credentials only in development/staging. Configure the live webhook URL as `/api/webhooks/razorpay` and subscribe to `payment.captured` and `payment.failed`. Keep the webhook secret from the same Razorpay mode as the API keys. Without credentials, the site will not start in production and local checkout remains disabled.
- **OAuth/SMS:** Not configured in this release.

## College CSV import

Admin college management accepts up to 500 rows and 2 MB per import. Each valid row is inserted as a **draft**. Invalid rows, duplicate slugs, and save errors are reported with row numbers. Importing a source does not automatically verify the college.

Required column: `name`, `slug`. Optional columns: `institutionType`, `description`, `city`, `state`, `officialWebsite`, `officialAdmissionUrl`, `sourceName`, `sourceUrl`.

Use HTTPS source URLs. Admins can add source-linked program records and optional academic-year fee records from each college card in **College data management**, then review their status and source. Ranking, placement, accreditation, and recognition records still need dedicated admin editors; CSV import for related data types is not available.

## Deployment

- Set a strong `BETTER_AUTH_SECRET`, a persistent PostgreSQL `DATABASE_URL`, and matching HTTPS `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` for the deployed origin. `NEXT_PUBLIC_APP_URL` must be present during the production build as well as at runtime so canonical links and metadata use the real domain. The Docker build requires it explicitly; Compose defaults to localhost only for local use.
- Configure Resend and Razorpay secrets in the hosting platform’s secret manager. Production startup validates all provider credentials and rejects non-HTTPS site URLs or non-live Razorpay keys. Never put production secrets in `.env`, GitHub, or the source snapshot.
- Use HTTPS, a managed PostgreSQL service, backups, and `npm run db:deploy` as a release step.
- Apply migrations, run `npm run db:seed`, and confirm `/api/health` reports the expected directory counts before opening registration. Complete email-domain verification and a live-mode Razorpay test before enabling paid counselling.
- `Dockerfile` builds Next standalone output and includes a separate database-tools target. For the self-hosted Compose example, set `POSTGRES_PASSWORD`, run `docker compose --profile tools run --rm database-tools` once to migrate and seed the catalog, then start the web service with `docker compose up -d web`. Set `BETTER_AUTH_SECRET`, the app URLs, and external provider credentials in the deployment environment. Never commit `.env`.
- Configure proxy host/forwarded headers and database network access for the platform you choose. Review cookies, rate limiting, monitoring, backup/restore, and data retention before opening registration.

## Important release gaps

The real-data directory now includes current JoSAA 2026-27 undergraduate program names for participating IITs, IISc, NITs, IIEST, IIITs, and Other-GFTIs, plus 28 official fee panels with current-year references. Some panels provide linked fee information rather than numerical amounts. It is not every Indian institution, course, or campus; many institutions publish no normalized 2026-27 schedule in JoSAA. It contains no nationwide verified admission requirements or placement outcomes. Numeric fee comparisons are limited to separately reviewed annual tuition records; raw schedules are not treated as annual estimates. The JoSAA source snapshot must be refreshed and reviewed for each admission year. Ranking, placement, accreditation, and recognition admin editors, counseling notifications, refund execution, and guardian/child consent safeguards still need implementation and provider or policy setup. Live launch also requires the operator to configure verified Resend and Razorpay accounts in the hosting secret manager. Policy pages are templates and require legal review; their presence does not establish compliance.

See [docs/api.md](docs/api.md) for route details and [data methodology](src/app/data-methodology/page.tsx) for public data handling.
