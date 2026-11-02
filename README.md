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

4. Apply the checked-in migration and seed sourced NIRF records plus local-only demo fixtures:

	```powershell
	npm run db:deploy
	npm run db:seed
	```

5. Start the app:

	```powershell
	npm run dev
	```

Open http://localhost:3000. The seed includes the NIRF India Rankings 2025 Overall top ten and Universities top 100 (106 unique institutions), with source, category, year, rank, and published city/state. It does not invent program, fee, outcome, or admissions information. Clearly labelled fictional UI fixtures are added only outside production and are excluded from recommendations.

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

`npm run db:migrate` is for local schema changes and creates new migrations. Use `npm run db:deploy` to apply checked-in migrations in a deployment. The initial SQL migration is generated from `prisma/schema.prisma`.

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
- Razorpay server-created orders and signature-verified, idempotent payment webhooks. Browser checkout never marks a booking paid.

## Optional services

- **Email:** Set `RESEND_API_KEY` and `EMAIL_FROM` to deliver verification and password-reset mail in production. In local development without a provider, reset messages are stored in an ignored local mailbox at `/dev/emails`; verification is not required. Production email workflows stay unavailable until a provider is configured.
- **Payments:** Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` together. Use Razorpay test credentials locally. Configure the webhook URL as `/api/webhooks/razorpay` and subscribe to `payment.captured`, `order.paid`, and `payment.failed`. Without all credentials, checkout reports that payment is unavailable and no payment is simulated.
- **OAuth/SMS:** Not configured in this release.

## College CSV import

Admin college management accepts up to 500 rows and 2 MB per import. Each valid row is inserted as a **draft**. Invalid rows, duplicate slugs, and save errors are reported with row numbers. Importing a source does not automatically verify the college.

Required column: `name`, `slug`. Optional columns: `institutionType`, `description`, `city`, `state`, `officialWebsite`, `officialAdmissionUrl`, `sourceName`, `sourceUrl`.

Use HTTPS source URLs. Admins can add source-linked program records and optional academic-year fee records from each college card in **College data management**, then review their status and source. Ranking, placement, accreditation, and recognition records still need dedicated admin editors; CSV import for related data types is not available.

## Deployment

- Set a strong `BETTER_AUTH_SECRET`, a persistent PostgreSQL `DATABASE_URL`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_APP_URL` for the deployed origin.
- Use HTTPS, a managed PostgreSQL service, backups, and `npm run db:deploy` as a release step.
- Apply migrations and seed the NIRF subset before opening the directory. Set email and payment credentials only after the corresponding provider accounts and verified webhook URLs are ready.
- `Dockerfile` builds Next standalone output. `docker-compose.app.yml` is a self-hosted example; set `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, and external provider credentials in the deployment environment. Never commit `.env`.
- Configure proxy host/forwarded headers and database network access for the platform you choose. Review cookies, rate limiting, monitoring, backup/restore, and data retention before opening registration.

## Important release gaps

The current real-data seed contains the NIRF 2025 Overall top ten and Universities top 100; it is not a nationwide admissions catalog. It contains no verified program offerings, current tuition, admission requirements, or placement outcomes. Admins can add and review sourced program and fee records, but current published facts must be entered from official institution or regulator sources and periodically rechecked before students rely on them for applications. Ranking, placement, accreditation, and recognition admin editors, CSV import for related data types, counselling notifications, refund execution, and guardian/child consent safeguards still need implementation and provider or policy setup. Email and payment integrations require operator credentials. Policy pages are templates and require legal review; their presence does not establish compliance.

See [docs/api.md](docs/api.md) for route details and [data methodology](src/app/data-methodology/page.tsx) for public data handling.
