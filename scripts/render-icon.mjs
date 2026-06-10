// One-off: rasterize an SVG icon into the PNG sizes the PWA manifests use.
// Usage: node scripts/render-icon.mjs <svg-path> <out-prefix> [sizes...]
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [, , svgArg, prefixArg, ...sizeArgs] = process.argv;
const svgPath = resolve(root, svgArg ?? "icons/camp.svg");
const prefix = prefixArg ?? "icons/camp";
const sizes = (sizeArgs.length ? sizeArgs : ["32", "180", "192", "512"]).map(Number);

const svg = await readFile(svgPath, "utf8");
const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
try {
  const page = await browser.newPage();
  for (const size of sizes) {
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    const html = `<!doctype html><html><head><meta charset="utf8"><style>
      *{margin:0;padding:0}html,body{width:${size}px;height:${size}px}
      svg{display:block;width:${size}px;height:${size}px}
    </style></head><body>${svg}</body></html>`;
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const el = await page.$("svg");
    const buf = await el.screenshot({ omitBackground: true });
    const out = resolve(root, `${prefix}-${size}.png`);
    await writeFile(out, buf);
    console.log(`wrote ${out} (${size}x${size})`);
  }
} finally {
  await browser.close();
}
