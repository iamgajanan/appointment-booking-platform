import { access, readFile } from "node:fs/promises";

const checks = [];
const check = (name, condition, details) => checks.push({ name, condition, details });
const read = (path) => readFile(path, "utf8");
const exists = async (path) => {
  try { await access(path); return true; } catch { return false; }
};

const dashboard = await read("app/dashboard/dashboard-client.tsx");
const dashboardPage = await read("app/dashboard/page.tsx");
const appointmentList = await read("app/dashboard/business/[id]/appointments/page.tsx");
const calendar = await read("app/dashboard/business/[id]/calendar/page.tsx");
const customers = await read("app/dashboard/business/[id]/customers/page.tsx");
const settings = await read("app/dashboard/business/[id]/settings/page.tsx");
const notifications = await read("app/dashboard/business/[id]/notifications/page.tsx");

// 10A: Responsive dashboard and business navigation coverage.
check("10A dashboard uses responsive layout classes", /sm:|md:|lg:|xl:/.test(dashboard), "Dashboard must include responsive breakpoints.");
check("10A dashboard cards use responsive grid", /grid gap-5 md:grid-cols-2 xl:grid-cols-3/.test(dashboard), "Business cards must collapse and expand across viewport widths.");
check("10A dashboard content has mobile-safe horizontal padding", /px-6/.test(dashboard), "Dashboard content must retain mobile-safe horizontal spacing.");
check("10A dashboard exposes core business routes", ["/settings", "/booking", "/calendar", "/appointments", "/customers", "/notifications"].every((route) => dashboard.includes(route)), "Dashboard must retain links to core business screens.");

// 10B: Responsive coverage for operational screens.
for (const [name, source] of [["appointments", appointmentList], ["calendar", calendar], ["customers", customers], ["settings", settings], ["notifications", notifications]]) {
  check(`10B ${name} screen has responsive styling`, /sm:|md:|lg:|xl:/.test(source), `${name} screen must include responsive breakpoint classes.`);
}
check("10B operational screens preserve error handling", [appointmentList, calendar, customers, settings, notifications].every((source) => /error|Error/.test(source)), "Operational screens must retain visible error handling.");

// 10C: Keyboard and accessibility-oriented source safeguards.
check("10C dashboard uses semantic main landmark", /<main\b/.test(dashboard), "Dashboard must expose a main landmark.");
check("10C dashboard form controls have labels", /<label\b/.test(dashboard) && /<input\b/.test(dashboard) && /<select\b/.test(dashboard), "Form controls must remain associated with visible labels.");
check("10C dashboard actions use native controls", /<button\b/.test(dashboard) && /<Link\b/.test(dashboard), "Interactive actions must use keyboard-accessible native controls or links.");
check("10C async actions expose disabled state", /disabled=\{saving\}/.test(dashboard), "Submit action must expose a disabled state while saving.");
check("10C user-facing errors are rendered", /setupError &&/.test(dashboard) && /error &&/.test(dashboard), "User-facing error messages must remain visible.");

// 10D: Route and file integrity checks for the mobile/accessibility review.
const requiredPaths = [
  "app/dashboard/page.tsx",
  "app/dashboard/dashboard-client.tsx",
  "app/dashboard/business/[id]/appointments/page.tsx",
  "app/dashboard/business/[id]/calendar/page.tsx",
  "app/dashboard/business/[id]/customers/page.tsx",
  "app/dashboard/business/[id]/settings/page.tsx",
  "app/dashboard/business/[id]/notifications/page.tsx",
];
for (const path of requiredPaths) {
  check(`10D required screen exists: ${path}`, await exists(path), "Required dashboard screen must remain present.");
}

const failures = checks.filter((item) => !item.condition);
for (const item of checks) {
  console.log(`${item.condition ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.condition) console.log(`  ${item.details}`);
}
console.log(`\nPhase 10 accessibility/responsive checks: ${checks.length - failures.length}/${checks.length} passed`);
if (failures.length) process.exitCode = 1;
