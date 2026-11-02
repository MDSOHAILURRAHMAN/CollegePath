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

Open http://localhost:3000. The seed includes the NIRF India Rankings 2025 top ten in the Overall and Universities categories (17 unique institutions), with source, category, year, rank, and published city/state. It does not invent program, fee, outcome, or admissions information. Clearly labelled fictional UI fixtures are added only outside production and are excluded from recommendations.

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
- Transparent recommendations filter verified programs and known hard-budget conflicts. They always state that admission likelihood is not assessed without matching historical cut-off evidence.
- Contact enquiries persist to PostgreSQL; staff can add internal notes, follow-up dates, and update lead status.
- Admin college drafts, source review/verification, CSV import, account roles, counselling services, availability, and booking status.
- Razorpay server-created orders and signature-verified, idempotent payment webhooks. Browser checkout never marks a booking paid.

## Optional services

- **Email:** Set `RESEND_API_KEY` and `EMAIL_FROM` to enable verification and password-reset mail. Without a provider, local registration remains available, but email verification/recovery messages are not sent.
- **Payments:** Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` together. Use Razorpay test credentials locally. Configure the webhook URL as `/api/webhooks/razorpay` and subscribe to `payment.captured`, `order.paid`, and `payment.failed`. Without all credentials, checkout reports that payment is unavailable and no payment is simulated.
- **OAuth/SMS:** Not configured in this release.

## College CSV import

Admin college management accepts up to 500 rows and 2 MB per import. Each valid row is inserted as a **draft**. Invalid rows, duplicate slugs, and save errors are reported with row numbers. Importing a source does not automatically verify the college.

Required column: `name`, `slug`. Optional columns: `institutionType`, `description`, `city`, `state`, `officialWebsite`, `officialAdmissionUrl`, `sourceName`, `sourceUrl`.

Use HTTPS source URLs. Import programs, fee records, rankings, placement outcomes, and recognition through their own reviewed workflows; this MVP does not yet include those admin editors.

## Deployment

- Set a strong `BETTER_AUTH_SECRET`, a persistent PostgreSQL `DATABASE_URL`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_APP_URL` for the deployed origin.
- Use HTTPS, a managed PostgreSQL service, backups, and `npm run db:deploy` as a release step.
- Apply migrations and seed the NIRF subset before opening the directory. Set email and payment credentials only after the corresponding provider accounts and verified webhook URLs are ready.
- `Dockerfile` builds Next standalone output. `docker-compose.app.yml` is a self-hosted example; set `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, and external provider credentials in the deployment environment. Never commit `.env`.
- Configure proxy host/forwarded headers and database network access for the platform you choose. Review cookies, rate limiting, monitoring, backup/restore, and data retention before opening registration.

## Important release gaps

The initial real-data seed is a small NIRF-ranked subset, not a nationwide admissions catalog. It contains no verified programs, current tuition, admission requirements, or placement outcomes. Those facts require official institution or regulator sources, periodic review, and additional source-aware import workflows before students should rely on them for application decisions. Email and payment integrations require operator credentials. Counselling notifications, refund execution, complete program/fee/ranking/accreditation CRUD, CSV import for every related data type, guardian/child consent safeguards, and a formal account deletion/export workflow need business/provider setup and further implementation. Policy pages are templates and require legal review; their presence does not establish compliance.

See [docs/api.md](docs/api.md) for route details and [data methodology](src/app/data-methodology/page.tsx) for public data handling.
