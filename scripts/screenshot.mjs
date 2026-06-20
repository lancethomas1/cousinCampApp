// Screenshot the Cousin Camp app with headless Chrome (Puppeteer).
//
// The app is a static, mobile-first site with hash routing (#today,
// #schedule, #cheers, #awards). This script serves the repo over a
// tiny local HTTP server, opens a route in a phone-sized viewport, waits for
// the view to render, and writes a PNG.
//
// Usage:
//   node scripts/screenshot.mjs [route] [outfile] [--device=<name>]
//   node scripts/screenshot.mjs schedule screenshots/schedule.png
//   node scripts/screenshot.mjs today --device=ipad
//
// Defaults: route "today", device "phone", outfile
// "screenshots/<route>[.<device>].png" (the device suffix is added for
// anything other than the phone so iPad shots don't clobber phone ones).
// Firebase/Google CDNs may be blocked by the network policy — that's fine, the
// app falls back to local mode and still renders from its bundled schedule.

import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Viewports we can capture. The iPad sizes are CSS-point dimensions (the app is
// laid out in points), matching an 11" iPad's portrait/landscape.
const DEVICES = {
  phone:           { width: 390,  height: 844,  deviceScaleFactor: 2, isMobile: true },
  ipad:            { width: 834,  height: 1194, deviceScaleFactor: 2, isMobile: true },
  "ipad-landscape":{ width: 1194, height: 834,  deviceScaleFactor: 2, isMobile: true },
};

// Pull a `--device=<name>` / `-d <name>` flag out, leaving positional args.
const args = process.argv.slice(2);
let device = "phone";
const positional = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith("--device=")) device = a.slice("--device=".length);
  else if (a === "--device" || a === "-d") device = args[++i];
  else positional.push(a);
}
if (!DEVICES[device]) {
  console.error(`Unknown device "${device}". Options: ${Object.keys(DEVICES).join(", ")}`);
  process.exit(1);
}

const route = (positional[0] || "today").replace(/^#/, "");
const suffix = device === "phone" ? "" : `.${device}`;
const outfile = positional[1] || `screenshots/${route}${suffix}.png`;

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webmanifest": "application/manifest+json", ".ico": "image/x-icon",
};

// Minimal static file server rooted at the repo (no external deps).
const server = http.createServer(async (req, res) => {
  try {
    let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (rel === "/") rel = "/index.html";
    const filePath = path.join(ROOT, path.normalize(rel));
    if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
      res.writeHead(404); res.end("not found"); return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(500); res.end("error");
  }
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/index.html#${route}`;

// Key element that proves a given route has rendered.
const READY = {
  today: ".hero",
  schedule: ".daybar",
  cheers: ".view-title",
  awards: ".view-title",
};

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.setViewport(DEVICES[device]);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  // Wait for the route's content; fall back to "any view children".
  await page.waitForSelector(READY[route] || "#view > *", { timeout: 15000 })
    .catch(() => page.waitForFunction(() => document.querySelector("#view")?.children.length > 0, { timeout: 5000 }));
  await new Promise((r) => setTimeout(r, 400)); // let fonts/transitions settle

  const abs = path.resolve(ROOT, outfile);
  await mkdir(path.dirname(abs), { recursive: true });
  await page.screenshot({ path: abs, fullPage: true });
  console.log(`📸 ${route} (${device}) → ${path.relative(ROOT, abs)}`);
} finally {
  await browser.close();
  server.close();
}
