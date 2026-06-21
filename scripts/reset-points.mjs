/*
 * Cousin Camp — reset all points
 * -------------------------------------------------------------
 * Wipes the whole camp's earned points back to zero so you can start
 * fresh (e.g. the morning camp begins). "Points" come from two maps in
 * the shared Firestore camp doc:
 *   • done   — each cousin's ticked prep checklist items (activity points)
 *   • awards — kudos, bonus points, and badges grown-ups handed out
 * This sets both back to empty, which zeroes every leaderboard total.
 * The schedule, campers, kudos deck, etc. (all in data.js) are untouched.
 *
 * The camp lives in a single doc at /camps/{campId}, where campId is a
 * SHA-256 hash of the family passcode (see core.js / firestore.rules), so
 * you must pass the SAME passcode everyone signs in with.
 *
 * Usage:
 *   node scripts/reset-points.mjs <passcode>
 *   CAMP_PASSCODE=... node scripts/reset-points.mjs
 *
 * Add --dry-run to only report the current totals without clearing them.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Pull the Firebase project + apiKey straight from firebase-config.js so this
// script always targets the same project the app does (no duplicated config).
function readFirebaseConfig() {
  const src = readFileSync(join(__dirname, "..", "firebase-config.js"), "utf8");
  const grab = (key) => {
    const m = src.match(new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`));
    return m ? m[1] : null;
  };
  const projectId = grab("projectId");
  const apiKey = grab("apiKey");
  if (!projectId || !apiKey) {
    throw new Error("Couldn't read projectId/apiKey from firebase-config.js");
  }
  return { projectId, apiKey };
}

// Mirror of core.js passToCampId(): SHA-256("cousincamp::" + passcode), first
// 40 hex chars. Must match exactly or we'd reset the wrong (empty) doc.
function passToCampId(passcode) {
  return createHash("sha256")
    .update("cousincamp::" + passcode)
    .digest("hex")
    .slice(0, 40);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const passcode = (args.find((a) => !a.startsWith("--")) || process.env.CAMP_PASSCODE || "").trim();

if (!passcode) {
  console.error("Missing passcode.\n  Usage: node scripts/reset-points.mjs <passcode>\n         CAMP_PASSCODE=... node scripts/reset-points.mjs");
  process.exit(1);
}

const { projectId, apiKey } = readFirebaseConfig();
const campId = passToCampId(passcode);
const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/camps/${campId}`;

// Count points in a Firestore doc's REST representation so we can report what
// we're about to clear (and confirm the passcode actually found a real camp).
function summarize(doc) {
  const fields = (doc && doc.fields) || {};
  const mapEntries = (v) => Object.entries((v && v.mapValue && v.mapValue.fields) || {});
  const done = mapEntries(fields.done);
  const awards = mapEntries(fields.awards);
  const ticks = done.reduce((n, [, v]) => n + mapEntries(v).length, 0);
  const awardCount = awards.reduce((n, [, v]) => {
    const arr = (v && v.arrayValue && v.arrayValue.values) || [];
    return n + arr.length;
  }, 0);
  return { campers: done.length, ticks, awardedCampers: awards.length, awardCount };
}

async function main() {
  console.log(`Project: ${projectId}`);
  console.log(`Camp doc: camps/${campId}`);

  const getRes = await fetch(`${base}?key=${apiKey}`);
  if (getRes.status === 404) {
    console.log("\nNo camp document exists for that passcode yet — nothing to reset.");
    console.log("(Points are already at zero. Double-check the passcode if you expected data.)");
    return;
  }
  if (!getRes.ok) {
    throw new Error(`Read failed: ${getRes.status} ${await getRes.text()}`);
  }
  const before = summarize(await getRes.json());
  console.log(`\nCurrent data: ${before.ticks} prep ticks across ${before.campers} cousin(s), ` +
    `${before.awardCount} award(s) across ${before.awardedCampers} cousin(s).`);

  if (dryRun) {
    console.log("\n--dry-run: leaving everything as-is.");
    return;
  }

  // PATCH with an updateMask covering only done + awards, set to empty maps.
  // Everything else in the doc (if anything) is left alone.
  const url = `${base}?key=${apiKey}&updateMask.fieldPaths=done&updateMask.fieldPaths=awards`;
  const body = {
    fields: {
      done: { mapValue: { fields: {} } },
      awards: { mapValue: { fields: {} } },
    },
  };
  const patchRes = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!patchRes.ok) {
    throw new Error(`Reset failed: ${patchRes.status} ${await patchRes.text()}`);
  }
  const after = summarize(await patchRes.json());
  console.log(`\n✅ Reset complete — every cousin is back to 0 points.`);
  console.log(`   After: ${after.ticks} prep ticks, ${after.awardCount} award(s).`);
}

main().catch((e) => {
  console.error("\n❌ " + e.message);
  process.exit(1);
});
