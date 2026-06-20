// End-to-end suite runner. Starts the production server against the in-process
// database and runs the committed journeys in tests/e2e against it, then exits
// non-zero if any journey fails. Assumes the app is already built (pnpm build).
// Used by the CI e2e job and locally via `pnpm e2e`.
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = process.env.PORT ?? "3000";
const BASE = `http://localhost:${PORT}`;
const JOURNEYS = ["tests/e2e/admin.mjs", "tests/e2e/content.mjs", "tests/e2e/news.mjs"];

const serverEnv = {
  ...process.env,
  DATABASE_URL: "",
  EMAIL_API_KEY: "",
  NODE_ENV: "production",
  IP_HASH_SALT: "ci-e2e-salt",
  ADMIN_BOOTSTRAP_SECRET: "test-bootstrap-secret",
  SITE_INDEXABLE: "true",
  NEXT_PUBLIC_SITE_URL: BASE,
  PORT,
};

function run(cmd, args, env) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { env: env ?? process.env, stdio: "inherit" });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function waitForServer(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/no`);
      if (r.ok) return true;
    } catch {
      // not up yet
    }
    await sleep(1000);
  }
  return false;
}

async function main() {
  const server = spawn("pnpm", ["start"], { env: serverEnv, stdio: "inherit" });
  let failures = 0;
  try {
    if (!(await waitForServer())) {
      console.error("E2E: server did not become ready");
      process.exitCode = 1;
      return;
    }
    for (const journey of JOURNEYS) {
      console.log(`\n=== E2E: ${journey} ===`);
      const code = await run("node", [journey], { ...process.env, E2E_BASE_URL: BASE });
      if (code !== 0) failures++;
    }
  } finally {
    server.kill("SIGKILL");
  }
  console.log(failures === 0 ? "\nALL E2E JOURNEYS PASSED" : `\n${failures} E2E JOURNEY(S) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main();
