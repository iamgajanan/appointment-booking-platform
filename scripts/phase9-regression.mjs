import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";

const checks = [];

function check(name, condition, details) {
  checks.push({ name, condition, details });
}

async function read(path) {
  return readFile(path, "utf8");
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const publicBooking = await read("app/api/public/appointments/route.ts");
const businessAppointments = await read("app/api/businesses/[id]/appointments/route.ts");
const appointmentLifecycle = await read("app/api/businesses/[id]/appointments/[appointmentId]/route.ts");
const reminderCron = await read("app/api/cron/appointment-reminders/route.ts");
const notificationMigration = await read("supabase/migrations/202609240004_notification_reliability.sql");

// Phase 9A: API validation and malformed input.
check("9A validates required public booking fields", /normalizedSlug|normalizedName|isValidDate/.test(publicBooking), "Public booking input normalization and date validation must remain present.");
check("9A validates email and phone input", /isValidEmail|isValidPhone/.test(publicBooking), "Public booking email and phone validation must remain present.");
check("9A rejects invalid appointment status", /Invalid appointment status/.test(businessAppointments) && /allowedStatuses/.test(appointmentLifecycle), "Business appointment APIs must reject unsupported statuses.");
check("9A validates date filter ordering", /from date must be before/.test(businessAppointments), "Appointment list filters must reject an inverted date range.");

// Phase 9B: Appointment lifecycle and rescheduling.
check("9B supports appointment status updates", /updates\.status = status/.test(appointmentLifecycle), "Appointment lifecycle endpoint must support status transitions.");
check("9B protects rescheduling status", /reschedulableStatuses/.test(appointmentLifecycle) && /Only pending or confirmed appointments can be rescheduled/.test(appointmentLifecycle), "Only pending and confirmed appointments may be rescheduled.");
check("9B validates rescheduling time order", /End time must be after start time/.test(appointmentLifecycle), "Rescheduling must reject an end time that is not after the start time.");
check("9B prevents past rescheduling", /Appointments must be scheduled in the future/.test(appointmentLifecycle), "Rescheduling must reject appointments in the past.");

// Phase 9C: Authorization and cross-business isolation.
check("9C authenticates business appointment listing", /supabase\.auth\.getUser/.test(businessAppointments) && /eq\("owner_id", user\.id\)/.test(businessAppointments), "Business appointment listing must require an authenticated owner.");
check("9C scopes appointment lifecycle by business", /eq\("business_id", id\)/.test(appointmentLifecycle), "Appointment updates must be scoped to the requested business.");
check("9C scopes public services to business", /eq\("business_id", business\.id\)/.test(publicBooking), "Public booking must not accept a service belonging to another business.");
check("9C protects cron with a secret", /authorization !== `Bearer \${expected}`/.test(reminderCron), "Cron endpoint must require the configured bearer secret.");

// Phase 9D: Conflict, duration, working-hours, and booking-window enforcement.
check("9D checks public booking conflicts", /\.lt\("start_at", end\.toISOString\(\)\)/.test(publicBooking) && /\.gt\("end_at", start\.toISOString\(\)\)/.test(publicBooking), "Public booking must check overlapping appointments.");
check("9D checks rescheduling conflicts", /This time overlaps another appointment/.test(appointmentLifecycle), "Rescheduling must reject overlapping appointments.");
check("9D maps database scheduling constraints", /outside business hours|duration does not match|booking window/.test(appointmentLifecycle), "Database scheduling constraint errors must be mapped to safe API responses.");
check("9D uses active appointment statuses for reminders", /\.in\("status", \["pending", "confirmed"\]\)/.test(reminderCron), "Reminder selection must exclude cancelled and completed appointments.");

// Phase 9E: Notification and cron idempotency.
check("9E records notification claims", /from\("notification_logs"\)/.test(reminderCron) && /insert\(\{ appointment_id: appointment\.id, notification_type: notificationType \}\)/.test(reminderCron), "Reminder processing must claim a notification before sending.");
check("9E removes failed notification claims", /delete\(\)\.eq\("id", claim\.id\)/.test(reminderCron), "Failed email delivery must release the notification claim for retry.");
check("9E has notification uniqueness protection", /unique.*notification|unique index|unique_idx/i.test(notificationMigration), "Notification claims must have uniqueness protection.");
check("9E uses the notification timestamp column", !/created_at/.test(notificationMigration) && /sent_at/.test(notificationMigration), "Notification migration must use the existing sent_at column.");
check("9E includes reminder lookup index", /appointments_reminder_lookup_idx/.test(notificationMigration), "Reminder processing must have the intended lookup index.");

const failures = checks.filter((item) => !item.condition);
for (const item of checks) {
  console.log(`${item.condition ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.condition) console.log(`  ${item.details}`);
}

if (!(await exists("supabase/migrations/202609240004_notification_reliability.sql"))) {
  failures.push({ name: "Notification reliability migration exists" });
  console.log("FAIL Notification reliability migration exists");
}

console.log(`\nPhase 9 regression checks: ${checks.length - failures.length}/${checks.length} passed`);
if (failures.length > 0) {
  process.exitCode = 1;
}
