import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tsxCli = resolve(root, "node_modules", "tsx", "dist", "cli.mjs");
const child = spawn(process.execPath, [tsxCli, "prisma/seed.ts"], {
  cwd: root,
  env: { ...process.env, COLLEGEPATH_DATA_SEED: "true" },
  stdio: "inherit",
});

child.on("error", error => {
  console.error("Could not start the database seed process:", error);
  process.exitCode = 1;
});
child.on("exit", code => {
  process.exitCode = code ?? 1;
});
