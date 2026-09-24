# Appointment Booking Platform

A multi-business appointment booking platform built with **Next.js, React, TypeScript, Supabase, and Resend**.

The platform allows businesses such as clinics, salons, dentists, doctors, gyms, car service centers, coaching institutes, and consultants to configure their business profile, working hours, services, appointment rules, and public booking page.

Business owners can manage appointments, customers, availability, rescheduling, and email notifications from an authenticated dashboard. Customers can view availability and book appointments through a public booking flow.

## Project Overview

### Main capabilities

- Authentication with Supabase Auth
- Business profile and business settings
- Flexible working hours configuration
- Service management
- Appointment duration, slot interval, buffer time, and pricing configuration
- Public business booking pages
- Public availability lookup
- Appointment creation and duplicate-slot protection
- Appointment dashboard and calendar management
- Appointment search and filtering
- Appointment rescheduling
- Customer appointment history
- Email notifications using Resend
- Scheduled appointment reminder emails through a protected cron endpoint
- Business-level authorization and cross-business data isolation
- Responsive dashboard UI
- Accessibility and regression checks
- Supabase database migrations managed through GitHub Actions

## Technology Stack

- **Framework:** Next.js 16
- **Language:** TypeScript
- **UI:** React 19, Tailwind CSS, shadcn/ui-related components
- **Authentication and database:** Supabase
- **Database:** PostgreSQL through Supabase
- **Email provider:** Resend
- **CI/CD checks:** GitHub Actions
- **Runtime used by CI:** Node.js 20

## Requirements

Install the following before starting development:

- Node.js 20 or a compatible supported Node.js version
- npm
- A Supabase project
- A Resend account if email notifications are required
- Git
- Supabase CLI for local migration and database workflow tasks

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/iamgajanan/appointment-booking-platform.git
cd appointment-booking-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure local environment variables

Create a `.env.local` file in the project root.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_sender_email
```

Use the Supabase project URL and anon key from the Supabase dashboard. Configure the Resend values only when email functionality is needed.

Do not commit `.env.local`, API keys, service-role keys, database passwords, or cron secrets to source control.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create a Next.js production build |
| `npm run start` | Start the Next.js production server after a build |
| `npm run test:phase9` | Run regression and security-oriented Phase 9 checks |
| `npm run test:phase10` | Run responsive and accessibility checks |
| `npm run test:phase11` | Run production-readiness static checks |

Recommended local verification sequence:

```bash
npm run lint
npm run test:phase9
npm run test:phase10
npm run test:phase11
npm run build
npm run start
```

## Supabase Configuration

The application uses Supabase for authentication, PostgreSQL data storage, row-level security, and database migrations.

### Initial Supabase setup

1. Create or open the Supabase project.
2. Copy the project URL into `NEXT_PUBLIC_SUPABASE_URL`.
3. Copy the public anon key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Apply the SQL migrations from the repository's Supabase migration directory.
5. Confirm that authentication and database access work locally.
6. Review the Supabase Auth settings before production deployment.

### Database migrations

Database schema changes must be committed as timestamped Supabase migrations. Do not make untracked production-only schema changes directly in the dashboard.

Typical local migration commands are:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Use the correct database password and Supabase access token through secure environment variables or the CLI prompt. Never commit database passwords or access tokens.

The project CI workflow links the Supabase project, repairs known legacy migration history, and runs:

```bash
supabase db push
```

Review migration output whenever a schema change is introduced.

## Email and Notification Configuration

Email notifications use Resend.

Required values:

```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_sender_email
```

Before production use:

- Verify the sender domain or sender email in Resend.
- Confirm that the configured sender is accepted by Resend.
- Keep the Resend API key server-side.
- Test successful delivery and failure handling.
- Check duplicate-prevention behavior for scheduled reminders.

## Cron Appointment Reminders

The application includes a protected appointment reminder endpoint:

```text
/api/cron/appointment-reminders
```

The production scheduler must call the endpoint using the configured cron secret and the authorization format expected by the application.

Before enabling scheduled reminders:

- Configure the cron secret outside source control.
- Use the production application URL.
- Schedule the job only once per intended interval.
- Confirm the scheduler's timezone, timeout, and retry behavior.
- Verify that missing or invalid authorization is rejected.
- Verify that already-processed reminders are not sent again.
- Review logs for failures without exposing secrets.

## GitHub Actions and CI

The repository contains two workflows:

- `.github/workflows/ci.yml`
- `.github/workflows/phase11.yml`

### Main CI workflow

The main CI workflow runs on pushes and pull requests targeting `main`. It performs the following checks:

1. Checks out the repository.
2. Sets up Node.js 20.
3. Installs dependencies.
4. Runs lint.
5. Runs Phase 9 regression checks.
6. Runs Phase 10 responsive and accessibility checks.
7. Builds the Next.js application.
8. On pushes to `main` or manual workflow execution, links Supabase and applies migrations after the build succeeds.

### Phase 11 workflow

The Phase 11 workflow runs lint, Phase 9 checks, Phase 10 checks, Phase 11 production-readiness checks, and the Next.js build.

### GitHub Actions secrets

Configure these secrets in the repository settings when CI needs access to Supabase:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD
SUPABASE_PROJECT_REF
```

The workflows contain safe CI fallback values for the public Supabase build variables. Supabase migration credentials must be configured as GitHub Actions secrets for migration jobs to work.

Do not store Resend API keys, cron secrets, service-role keys, or database passwords in the repository files.

## Security and Authorization

The application includes business-level access controls and has been tested for cross-business isolation. Authenticated dashboard access and API authorization should remain enabled for protected resources.

Security guidelines:

- Keep Supabase service-role credentials server-side only.
- Never expose private credentials through `NEXT_PUBLIC_` variables.
- Do not bypass row-level security to create public write access.
- Validate ownership before reading or modifying business data.
- Keep notification logs restricted to the intended server-side access pattern.
- Review Supabase security advisor findings before production launch.
- Do not change database extensions or security policies blindly when constraints or notification processing depend on them.

## Production Readiness and Release Checklist

The application-level development and local testing phases have been completed. Hosting and deployment configuration remain environment-specific.

Before the first production release:

- [ ] Configure production environment variables in the hosting provider.
- [ ] Configure the production Supabase project and verify migrations.
- [ ] Configure and verify the Resend sender identity.
- [ ] Configure the appointment reminder cron scheduler and secret.
- [ ] Confirm production authentication and redirect URLs.
- [ ] Confirm public booking and availability using the production URL.
- [ ] Confirm email delivery in the production environment.
- [ ] Keep the previous successful deployment available for rollback.
- [ ] Review Supabase Auth leaked-password protection settings.
- [ ] Review remaining Supabase security advisor findings.
- [ ] Verify the final CI and Phase 11 workflow runs are successful.
- [ ] Configure a custom domain only after the deployment is working.

## Rollback Guidance

Keep the previous successful deployment available in the hosting provider.

- For an application-only issue, roll back to the previous deployment.
- For database changes, prefer a reviewed forward-fix migration.
- Do not manually delete production migration history.
- Take database backups according to the hosting and Supabase plan before significant production changes.

## Documentation

- [Production readiness runbook](docs/production-readiness.md)
- [Next.js documentation](https://nextjs.org/docs)
- [Supabase documentation](https://supabase.com/docs)
- [Resend documentation](https://resend.com/docs)

## Project Status

The project has completed its primary feature implementation, local testing, authorization review, accessibility checks, regression checks, production-readiness checks, and CI migration workflow verification.

The remaining work is deployment preparation: configuring the hosting environment, production secrets, cron scheduling, domain, and final live-environment verification.
