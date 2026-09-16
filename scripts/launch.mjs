import { spawn, exec } from "child_process";
import http from "http";

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;

function isServerReady() {
  return new Promise((resolve) => {
    const req = http.get(URL, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function openBrowser(targetUrl) {
  const platform = process.platform;
  console.log(`[launch] Opening browser at ${targetUrl}...`);
  if (platform === "win32") {
    exec(`start "" "${targetUrl}"`);
  } else if (platform === "darwin") {
    exec(`open "${targetUrl}"`);
  } else {
    exec(`xdg-open "${targetUrl}"`);
  }
}

async function main() {
  console.log("==================================================");
  console.log(" 🚀 SaaS Opportunity Radar - Local Launch");
  console.log("==================================================");

  const alreadyRunning = await isServerReady();

  if (alreadyRunning) {
    console.log(`[launch] Server is already active at ${URL}`);
    openBrowser(URL);
    return;
  }

  console.log(`[launch] Starting Next.js local server on port ${PORT}...`);

  const isWindows = process.platform === "win32";
  const npmCmd = isWindows ? "npm.cmd" : "npm";

  const child = spawn(npmCmd, ["run", "dev"], {
    stdio: "inherit",
    shell: true,
  });

  child.on("error", (err) => {
    console.error("[launch] Failed to start server child process:", err);
  });

  // Poll until ready
  let attempts = 0;
  const maxAttempts = 60; // 30 seconds

  const interval = setInterval(async () => {
    attempts++;
    const ready = await isServerReady();
    if (ready) {
      clearInterval(interval);
      console.log(`[launch] Server is ready at ${URL}!`);
      openBrowser(URL);
    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
      console.warn(`[launch] Server took longer than 30s to respond. Opening browser anyway...`);
      openBrowser(URL);
    }
  }, 500);
}

main();
