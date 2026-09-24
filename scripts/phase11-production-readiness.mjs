import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const read = (relativePath) => readFileSync(join(root, relativePath), "utf8");
const walk = (directory) => {
  const absolute = join(root, directory);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = join(directory, entry.name);
    return entry.isDirectory() ? walk(relative) : [relative];
  });
};

// 11A: environment and secret-handling safeguards.
const gitignore = read(".gitignore");
const workflow = read(".github/workflows/ci.yml");
check(gitignore.includes(".env*"), "Environment files must remain ignored by git.");
check(gitignore.includes("*.pem"), "Private key files must remain ignored by git.");
check(workflow.includes("secrets.NEXT_PUBLIC_SUPABASE_URL"), "CI must source the public Supabase URL from GitHub secrets with a CI fallback.");
check(workflow.includes("secrets.SUPABASE_ACCESS_TOKEN"), "Migration CI must use the Supabase access token secret.");
check(workflow.includes("secrets.SUPABASE_DB_PASSWORD"), "Migration CI must use the Supabase database password secret.");
check(!/sk-[A-Za-z0-9]{20,}|re_[A-Za-z0-9]{20,}|SUPABASE_ACCESS_TOKEN\s*[:=]\s*["'][^$]/.test(workflow), "CI must not contain hardcoded service secrets.");

// 11B: API error and sensitive-data hygiene checks.
const apiFiles = walk("app/api").filter((file) => file.endsWith(".ts"));
check(apiFiles.length > 0, "API route files must be present for the production audit.");
let routeSource = "";
for (const file of apiFiles) {
  const source = read(file);
  routeSource += `\n${source}`;
  check(!/console\.log\s*\([^)]*(?:token|secret|password|authorization|api[_-]?key)/i.test(source), `${file} must not log secrets or authorization values.`);
  check(!/(?:sk-|re_)[A-Za-z0-9]{20,}/.test(source), `${file} must not contain hardcoded provider secrets.`);
}
check(routeSource.includes("NextResponse.json"), "API routes must return structured JSON responses.");
check(routeSource.includes("status: 400") || routeSource.includes("status: 401") || routeSource.includes("status: 403"), "API routes must expose explicit client/auth error statuses.");

// 11C: reproducible CI and migration verification contract.
check(workflow.includes("npm run lint"), "CI must run lint.");
check(workflow.includes("npm run test:phase9"), "CI must run Phase 9 regression checks.");
check(workflow.includes("npm run test:phase10"), "CI must run Phase 10 checks.");
check(workflow.includes("npm run build"), "CI must run the production build.");
check(workflow.includes("supabase db push"), "CI must apply Supabase migrations.");
check(workflow.includes("supabase migration repair"), "CI must retain legacy migration-history repair handling.");

// 11D: deployment, cron, and rollback documentation contract.
const productionDoc = "docs/production-readiness.md";
check(existsSync(join(root, productionDoc)), "Production-readiness deployment and rollback documentation must exist.");
if (existsSync(join(root, productionDoc))) {
  const documentation = read(productionDoc);
  for (const requiredTopic of ["Environment variables", "Cron", "Rollback", "Migration", "RESEND_API_KEY", "RESEND_FROM_EMAIL"]) {
    check(documentation.includes(requiredTopic), `Production documentation must cover: ${requiredTopic}.`);
  }
}

if (failures.length) {
  console.error("Phase 11 production readiness checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Phase 11 production readiness checks passed (${apiFiles.length} API route files audited).`);
