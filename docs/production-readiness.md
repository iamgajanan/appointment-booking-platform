# Production Readiness Runbook

## Current evaluation scope

The project is currently being evaluated locally and through CI. Production hosting, production environment variables, live cron scheduling, and live deployment verification are intentionally postponed until the release stage.

The following have been reported as completed and should be retained as release evidence:

- Core booking and appointment management flows
- Mobile UI review
- Accessibility review
- Cross-business authorization tests
- Unauthenticated API tests
- Invalid/manipulated ID tests
- Supabase RLS verification
- Final cron authentication test
- Notification delivery and duplicate-prevention tests
- CI build, lint, regression, accessibility, production-readiness, and migration checks

## Environment variables — release stage

Configure production values in the hosting provider's encrypted environment settings, never in source control. Required values should be verified only when preparing production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` where server-side operations require it
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`

Public browser variables may use the `NEXT_PUBLIC_` prefix. Service credentials, Resend credentials, database credentials, and cron secrets must remain server-side or in CI secrets.

## API and logging

Return structured JSON errors without exposing tokens, passwords, provider responses containing secrets, SQL details, or internal stack traces. Review logs before release and use request identifiers when troubleshooting production failures.

## Cron

The appointment-reminder endpoint must reject missing or invalid authorization. Configure the production scheduler only during the release stage, and confirm its timezone, timeout, retry behavior, interval, and duplicate-prevention behavior before enabling it.

## Migration

Every schema change must be committed as a timestamped Supabase migration. CI runs the build, repairs known legacy migration history when configured, and runs `supabase db push`. Review migration output before considering a schema release successful.

## Backup, rollback, and recovery

Use the companion runbook: [`backup-rollback-recovery.md`](./backup-rollback-recovery.md).

Before a risky production change:

- [ ] Confirm CI and migration checks are green.
- [ ] Record the deployed commit SHA.
- [ ] Confirm a previous successful deployment is available.
- [ ] Confirm an available database backup or recovery point.
- [ ] Review the migration and forward-fix/rollback strategy.

For application-only regressions, roll back to the previous deployment while preserving database state. For database problems, prefer a reviewed forward-fix migration. Do not manually delete production migration history.

## Release verification checklist

Complete these only when preparing the production release:

- [ ] Verify production environment variables in the hosting provider.
- [ ] Verify the production Supabase project and applied migrations.
- [ ] Verify the Resend sender identity and delivery.
- [ ] Verify cron scheduling and secret configuration.
- [ ] Verify production authentication and redirect URLs.
- [ ] Verify public booking and availability using the production URL.
- [ ] Verify dashboard and API behavior in the deployed environment.
- [ ] Review deployment and runtime logs.
- [ ] Confirm backup and rollback procedures are available.
- [ ] Confirm the final CI and Phase 11 workflow runs are successful.

## Related documentation

- [`release-readiness.md`](./release-readiness.md)
- [`backup-rollback-recovery.md`](./backup-rollback-recovery.md)
