# Release Readiness Checklist

This checklist separates the completed application evaluation from the postponed production-release tasks.

## 1. Application evaluation — completed

- [x] Review dashboard and business settings UI.
- [x] Review services, working hours, and booking settings UI.
- [x] Review appointments, calendar, customers, and customer history UI.
- [x] Review notification settings and public booking UI.
- [x] Review responsive behavior on mobile, tablet, and desktop widths.
- [x] Review accessibility basics and keyboard/tap usability.
- [x] Test loading, empty, validation, and error states where applicable.
- [x] Test cross-business isolation.
- [x] Test unauthenticated API requests.
- [x] Test invalid and manipulated IDs.
- [x] Test Supabase RLS behavior.
- [x] Test cron authorization with missing and incorrect secrets.
- [x] Test reminder duplicate prevention.
- [x] Verify CI lint, build, regression, accessibility, production-readiness, and migration checks.

## 2. Authorization checklist — completed evidence

For authenticated business API routes, the completed manual review covered:

- [x] Missing session behavior.
- [x] Cross-business read protection.
- [x] Cross-business mutation protection.
- [x] Invalid or manipulated business and appointment IDs.
- [x] Service, working-hours, booking-settings, and business ownership behavior where tested.
- [x] Public routes exposing only intended public booking data.
- [x] Cron route rejecting missing or incorrect `CRON_SECRET`.
- [x] Server-side handling of service-role credentials.

Continue to re-run these checks whenever authorization or database policies change.

## 3. Supabase checklist — completed evaluation

- [x] CI migration job completed successfully.
- [x] Migration workflow and legacy migration repair checks passed.
- [x] Supabase RLS verification completed manually.
- [x] Cross-business data isolation tested.
- [x] Notification processing and duplicate-prevention behavior tested.

## 4. Backup, rollback, and recovery documentation

- [x] Backup and pre-change checklist documented.
- [x] Application-only rollback procedure documented.
- [x] Migration failure and forward-fix procedure documented.
- [x] Database recovery checklist documented.
- [x] Notification failure recovery documented.
- [x] Post-recovery verification checklist documented.

See [`backup-rollback-recovery.md`](./backup-rollback-recovery.md).

## 5. Production release tasks — intentionally postponed

These tasks are not required for the current local/UI evaluation and should be completed before real production launch:

- [ ] Configure production environment variables in the hosting provider.
- [ ] Verify production Supabase project configuration and migrations.
- [ ] Configure and verify the production Resend sender identity.
- [ ] Configure and verify the production appointment-reminder scheduler and secret.
- [ ] Confirm production authentication and redirect URLs.
- [ ] Test public booking and availability using the production URL.
- [ ] Test production email delivery.
- [ ] Review deployment and runtime logs.
- [ ] Confirm backup/recovery capability for the selected hosting and Supabase plans.
- [ ] Keep the previous successful deployment available for rollback.
- [ ] Review Supabase Auth and security advisor settings before launch.
- [ ] Complete final live-environment smoke testing.

## 6. Release gate

The application may be considered ready for a production-release rehearsal after the local evaluation is complete, but it should not be marked production-launched until the postponed production tasks above are verified in the target environment.
