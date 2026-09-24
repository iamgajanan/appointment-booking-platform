# Production Readiness Runbook

## Environment variables

Configure production values in the hosting provider's encrypted environment settings, never in source control. Required application values include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the server-side Supabase migration credentials used only by CI. Email delivery requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. Public browser variables may use the `NEXT_PUBLIC_` prefix; service credentials must remain server-side or in CI secrets.

## API and logging

Return structured JSON errors without exposing tokens, passwords, provider responses containing secrets, SQL details, or internal stack traces. Review logs before release and use request identifiers when troubleshooting production failures.

## Cron

Configure the appointment-reminder cron request in the hosting provider with the production cron secret. The endpoint must reject missing or invalid authorization and should be scheduled only once per intended interval. Confirm the cron job's timezone, timeout, retry behavior, and duplicate-prevention behavior before enabling it.

## Migration

Every production schema change must be committed as a timestamped Supabase migration. CI runs the build first, repairs known legacy migration history, and then runs `supabase db push`. Review migration output before considering a release successful.

## Rollback

Keep the previous successful deployment available in the hosting provider. For an application-only regression, roll back to the previous deployment and preserve the database state. For schema changes, use a reviewed forward-fix migration unless a tested, compatible rollback migration exists; do not manually delete production migration history.

## Release verification

Before release, confirm lint, Phase 9 checks, Phase 10 checks, Phase 11 checks, and the Next.js production build pass. Then verify Supabase migration execution, authenticated dashboard access, public booking, email delivery, and cron authorization in the production environment.
