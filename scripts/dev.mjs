import { existsSync, copyFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";

const rootDir = process.cwd();
const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend");

const processes = [];

function log(message) {
  console.log(`[dev] ${message}`);
}

function ensureFile(target, fallback) {
  if (!existsSync(target)) {
    copyFileSync(fallback, target);
    log(`Created ${path.relative(rootDir, target)} from template.`);
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || rootDir,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, ...(options.env || {}) }
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });

    child.on("error", reject);
  });
}

function runLong(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd || rootDir,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...(options.env || {}) }
  });

  processes.push(child);

  child.on("exit", (code) => {
    if (code && code !== 0) {
      log(`${command} ${args.join(" ")} stopped with code ${code}. Shutting down the rest.`);
      shutdown(code);
    }
  });

  return child;
}

function waitForPort(host, port, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function attempt() {
      const socket = new net.Socket();

      socket.setTimeout(2000);

      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });

      socket.once("timeout", () => {
        socket.destroy();
        retry();
      });

      socket.once("error", () => {
        socket.destroy();
        retry();
      });

      socket.connect(port, host);
    }

    function retry() {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timed out waiting for ${host}:${port}`));
        return;
      }

      setTimeout(attempt, 1500);
    }

    attempt();
  });
}

let shuttingDown = false;

async function shutdown(code = 0) {
  if (shuttingDown) {
    process.exit(code);
  }

  shuttingDown = true;

  for (const child of processes) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  try {
    await run("docker", ["compose", "stop", "postgres"]);
  } catch (error) {
    log(`Postgres stop skipped: ${error.message}`);
  }

  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function main() {
  ensureFile(path.join(backendDir, ".env"), path.join(backendDir, ".env.example"));
  ensureFile(path.join(frontendDir, ".env.local"), path.join(frontendDir, ".env.example"));

  log("Starting local Postgres with Docker Compose...");
  await run("docker", ["compose", "up", "-d", "postgres"]);

  log("Waiting for Postgres on localhost:5432...");
  await waitForPort("127.0.0.1", 5432);

  log("Generating Prisma client...");
  await run("npx", ["prisma", "generate"], { cwd: backendDir });

  log("Applying Prisma migrations to local Postgres...");
  await run("npx", ["prisma", "migrate", "deploy"], { cwd: backendDir });

  log("Seeding local demo data...");
  await run("npm", ["run", "seed"], { cwd: backendDir });

  log("Starting backend on http://localhost:5000 and frontend on http://localhost:3000...");
  runLong("npm", ["run", "dev"], { cwd: backendDir });
  runLong("npm", ["run", "dev"], { cwd: frontendDir });
}

main().catch(async (error) => {
  console.error(`[dev] ${error.message}`);
  await shutdown(1);
});
