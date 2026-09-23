# Release readiness checklist

## Mobile UI

Verify dashboard, business settings, services, working hours, booking settings, appointments, calendar, customers, customer history, notification settings, and public booking at 320px, 375px, 390px, 768px, and desktop widths.

Check for horizontal overflow, clipped buttons, unreadable contrast, keyboard focus, tap targets, modal overflow, date/time input usability, and empty/error states.

## Authorization

For every authenticated business API route, verify:

- Missing session returns 401.
- A valid user cannot read or mutate another owner's business by changing the business ID.
- A valid user cannot update another owner's appointment by changing business or appointment IDs.
- Service, hours, booking settings, notification settings, and business updates enforce ownership.
- Public booking routes expose only public business/service/availability data.
- Cron route rejects missing or incorrect `CRON_SECRET`.
- Service-role credentials are used only server-side and are never exposed to client bundles.

## Supabase

- Run `supabase db push` from CI using repository secrets.
- Confirm all migrations are applied in the target project.
- Verify RLS is enabled on every application table.
- Confirm notification logs cannot be read by unrelated users.
- Confirm appointment timestamps satisfy `end_at > start_at`.
