import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const host = process.env.HOSTNAME || "0.0.0.0";

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "start", "--hostname", host, "--port", port],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env
  }
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
