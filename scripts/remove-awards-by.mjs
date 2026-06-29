/*
 * Cousin Camp — remove points & kudos given by one grown-up
 * -------------------------------------------------------------
 * Strips every points/kudos award a particular grown-up handed out from the
 * shared Firestore camp doc, leaving everyone else's awards untouched. Awards
 * live in the `awards` map at /camps/{campId}, keyed by cousin id, each an
 * array of award objects tagged with `by` (the giver's first name).
 *
 * By default this removes the two point/kudos-bearing award types — "kudos"
 * and "bonus" — given by the named grown-up. Special badges (0-point) and
 * cousin-to-cousin cheers (which carry no `by`) are left alone. Pass
 * --include-badges to also remove that grown-up's badges. The name match is
 * case-insensitive and trimmed.
 *
 * The camp lives in a single doc at /camps/{campId}, where campId is a
 * SHA-256 hash of the family passcode (see core.js / firestore.rules), so
 * you must pass the SAME passcode everyone signs in with.
 *
 * Usage:
 *   node scripts/remove-awards-by.mjs <passcode> --by Jason
 *   CAMP_PASSCODE=... node scripts/remove-awards-by.mjs --by Jason
 *
 * Add --dry-run to only report what would be removed without changing anything.
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
// 40 hex chars. Must match exactly or we'd touch the wrong (empty) doc.
function passToCampId(passcode) {
  return createHash("sha256")
    .update("cousincamp::" + passcode)
    .digest("hex")
    .slice(0, 40);
}

// ---- args ----
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const includeBadges = args.includes("--include-badges");
const flagVal = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : null;
};
const target = (flagVal("--by") || "Jason").trim();
const passcode = (args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--by")
  || process.env.CAMP_PASSCODE || "").trim();

if (!passcode) {
  console.error("Missing passcode.\n  Usage: node scripts/remove-awards-by.mjs <passcode> --by Jason\n         CAMP_PASSCODE=... node scripts/remove-awards-by.mjs --by Jason");
  process.exit(1);
}

// Award types that count as "points & kudos". Badges (0-point) are kept unless
// --include-badges is passed; cousin cheers carry no `by` so never match anyway.
const REMOVE_TYPES = new Set(includeBadges ? ["kudos", "bonus", "badge"] : ["kudos", "bonus"]);

const { projectId, apiKey } = readFirebaseConfig();
const campId = passToCampId(passcode);
const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/camps/${campId}`;

// True if a single award's Firestore-REST mapValue was given by the target
// grown-up and is one of the types we're removing.
function shouldRemove(awardValue) {
  const f = (awardValue && awardValue.mapValue && awardValue.mapValue.fields) || {};
  const by = (f.by && f.by.stringValue) || "";
  const type = (f.type && f.type.stringValue) || "";
  return by.trim().toLowerCase() === target.toLowerCase() && REMOVE_TYPES.has(type);
}

async function main() {
  console.log(`Project: ${projectId}`);
  console.log(`Camp doc: camps/${campId}`);
  console.log(`Removing ${[...REMOVE_TYPES].join(" + ")} awards given by "${target}".`);

  const getRes = await fetch(`${base}?key=${apiKey}`);
  if (getRes.status === 404) {
    console.log("\nNo camp document exists for that passcode yet — nothing to remove.");
    console.log("(Double-check the passcode if you expected data.)");
    return;
  }
  if (!getRes.ok) {
    throw new Error(`Read failed: ${getRes.status} ${await getRes.text()}`);
  }

  const doc = await getRes.json();
  const awardsMap = (doc.fields && doc.fields.awards && doc.fields.awards.mapValue && doc.fields.awards.mapValue.fields) || {};

  let removed = 0;
  let kept = 0;
  const rebuilt = {};
  for (const [camperId, val] of Object.entries(awardsMap)) {
    const values = (val && val.arrayValue && val.arrayValue.values) || [];
    const keep = values.filter((v) => {
      if (shouldRemove(v)) { removed++; return false; }
      kept++;
      return true;
    });
    // Preserve the camper key with whatever survives (possibly an empty array)
    // so other code paths that read awards[camperId] still see the same shape.
    rebuilt[camperId] = { arrayValue: { values: keep } };
  }

  console.log(`\nFound ${removed} award(s) by "${target}" to remove; ${kept} award(s) stay.`);

  if (removed === 0) {
    console.log("Nothing to do.");
    return;
  }
  if (dryRun) {
    console.log("\n--dry-run: leaving everything as-is.");
    return;
  }

  // PATCH only the awards field; everything else in the doc is left untouched.
  const url = `${base}?key=${apiKey}&updateMask.fieldPaths=awards`;
  const body = { fields: { awards: { mapValue: { fields: rebuilt } } } };
  const patchRes = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!patchRes.ok) {
    throw new Error(`Update failed: ${patchRes.status} ${await patchRes.text()}`);
  }
  console.log(`\n✅ Removed ${removed} award(s) given by "${target}".`);
}

main().catch((e) => {
  console.error("\n❌ " + e.message);
  process.exit(1);
});
