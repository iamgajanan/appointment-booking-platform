# Backup, Rollback, and Recovery Runbook

This runbook covers application rollback, database recovery, migration failure handling, notification recovery, and incident documentation.

## 1. Before a risky change

- [ ] Confirm the latest CI workflow is green.
- [ ] Confirm the latest Supabase migration job is successful.
- [ ] Record the current production deployment ID or commit SHA.
- [ ] Confirm the previous successful deployment is still available for rollback.
- [ ] Review the migration SQL and identify affected tables, constraints, indexes, and policies.
- [ ] Confirm a current database backup or provider-supported recovery point exists.
- [ ] Record the planned change, expected impact, and rollback/forward-fix plan.

Do not make an untracked production-only schema change in the Supabase dashboard.

## 2. Application-only rollback

Use this procedure when the problem is limited to application code and does not require reverting database schema changes.

1. Stop or pause the affected release process if possible.
2. Identify the last known-good deployment and commit SHA.
3. Roll back to that deployment using the hosting provider.
4. Verify authentication, dashboard access, public booking, availability, appointment management, and email-related routes.
5. Review logs and record the incident.
6. Create a follow-up fix in a focused branch/commit.

Preserve the current database state unless a reviewed database recovery procedure is explicitly required.

## 3. Database migration failure

1. Do not manually delete rows from Supabase migration history.
2. Capture the failed migration name, error message, and deployment commit SHA.
3. Determine whether the migration was applied fully, partially, or not at all.
4. Inspect the current schema before taking corrective action.
5. Prefer a reviewed forward-fix migration that safely brings the schema to the intended state.
6. Run the migration checks in CI before applying the correction.
7. Re-test booking integrity, authorization, RLS, and notification processing.
8. Document the final state and verification evidence.

A rollback migration must only be used when it has been reviewed and tested for compatibility with existing data and application code.

## 4. Database recovery

Use the recovery process supported by the Supabase plan and configured backup/recovery features.

- [ ] Identify the recovery point and its timestamp.
- [ ] Confirm the scope of data affected.
- [ ] Confirm whether recovery will overwrite newer valid data.
- [ ] Obtain the required approval before restoring a production database.
- [ ] Record the restore operation and operator.
- [ ] Re-apply or verify required migrations after recovery.
- [ ] Verify RLS policies and authentication behavior.
- [ ] Verify businesses, services, working hours, appointments, customers, and notification logs.
- [ ] Run the public booking and dashboard smoke tests.

If a point-in-time restore is unavailable, document the available backup options and the expected data-loss window before proceeding.

## 5. Notification failure recovery

1. Check the application logs and Resend delivery status.
2. Identify whether the failure is caused by configuration, sender verification, provider rejection, timeout, or application logic.
3. Confirm failed notification claims are not left in a state that permanently blocks a valid retry.
4. Verify duplicate-prevention behavior before retrying.
5. Retry only the intended notification scope.
6. Confirm the recipient, appointment time, business name, and notification type.
7. Record the failure, correction, and delivery result.

Never expose API keys, service-role credentials, cron secrets, or private customer information in incident notes.

## 6. Post-recovery verification checklist

- [ ] CI lint passes.
- [ ] Phase 9 regression checks pass.
- [ ] Phase 10 responsive/accessibility checks pass.
- [ ] Phase 11 production-readiness checks pass.
- [ ] Next.js production build passes.
- [ ] Supabase migration status is reviewed.
- [ ] Authentication and protected routes work.
- [ ] Cross-business authorization still works.
- [ ] RLS behavior is confirmed.
- [ ] Public booking and availability work.
- [ ] Appointment creation, rescheduling, and cancellation work.
- [ ] Email notifications and reminder idempotency work.
- [ ] Logs do not expose secrets or sensitive data.

## 7. Incident record template

```text
Incident date/time:
Environment:
Affected deployment/commit:
Affected feature:
Observed symptoms:
Customer/business impact:
Initial cause hypothesis:
Actions taken:
Rollback or forward-fix used:
Database recovery point, if applicable:
Verification performed:
Remaining risks:
Follow-up issue/commit:
Owner:
```

## 8. Recovery principles

- Prefer application rollback for application-only regressions.
- Prefer reviewed forward-fix migrations for database problems.
- Do not manually delete production migration history.
- Keep secrets outside source control and incident reports.
- Do not claim recovery is complete until the post-recovery checklist has been verified.
