import { readFile, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer";
const root = "/home/user/cousinCampApp";
const b64 = (await readFile(root + "/icons/delorean-source.jpg")).toString("base64");
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox","--disable-setuid-sandbox"] });
const page = await browser.newPage();
const TW = 660; // target width
const out = await page.evaluate(async (src, tw) => {
  const img = new Image();
  await new Promise(r => { img.onload = r; img.src = src; });
  const th = Math.round(tw * img.naturalHeight / img.naturalWidth);
  const c = document.createElement("canvas"); c.width = tw; c.height = th;
  const x = c.getContext("2d"); x.imageSmoothingQuality = "high";
  x.drawImage(img, 0, 0, tw, th);
  return c.toDataURL("image/jpeg", 0.82);
}, "data:image/jpeg;base64," + b64, TW);
await browser.close();
const data = Buffer.from(out.split(",")[1], "base64");
await writeFile(root + "/icons/delorean-icon.jpg", data);
console.log("wrote icons/delorean-icon.jpg", data.length, "bytes");
