/* ============================================================
   Cousin Camp — shared core (vanilla JS, no build step)
   The "model" shared by BOTH apps:
     • index.html / app.js  — the campers' app
     • parent.html / parent.js — the grown-ups' award app
   It owns app state, the Firestore shared-sync layer, the
   persistence Store, and all the points/awards/prize helpers.
   Each app loads this first, registers a render callback with
   CampCore.setRender(), then draws its own views on top.
   Exposed as window.CampCore.
   ============================================================ */

(function () {
  "use strict";

  const { CAMPERS, SCHEDULE, STORE, PHOTO_ALBUM_URL, KUDOS, BONUS_QUICK, PARENT_BADGES } = window.CAMP_DATA;
  const GROWNUPS = window.CAMP_DATA.GROWNUPS || [];

  // ---- Storage helpers ----------------------------------------------------
  const LS = {
    me: "cc.me",                 // current camper id (stays local to each device)
    done: "cc.done",             // { camperId: { activityId: true } }
    claims: "cc.claims",         // { rewardId: camperId } — one prize per camper
    awards: "cc.awards",         // { camperId: [ {id,type,refId,emoji,label,points,note,by,ts} ] }
    pass: "cc.pass",             // remembered family passcode (shared mode)
    target: "cc.target",         // camper a grown-up is awarding to (stays local)
    parent: "cc.parent",         // grown-up's first name in the parents app (local)
  };
  const load = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
    catch { return fallback; }
  };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // ---- App state ----------------------------------------------------------
  const state = {
    me: load(LS.me, null),
    done: load(LS.done, {}),
    claims: load(LS.claims, {}),
    awards: load(LS.awards, {}),
    photos: [],                      // shared gallery (Firebase Storage), live
    route: "today",
    target: load(LS.target, null),  // who the grown-up is awarding to
    parent: load(LS.parent, null),  // signed-in grown-up's first name (parents app)
  };

  // ---- Render wiring ------------------------------------------------------
  // Each app registers its own render(); the core calls it whenever shared
  // data changes or a mutation lands, so both apps stay live.
  let renderFn = function () {};
  function setRender(fn) { renderFn = (typeof fn === "function") ? fn : function () {}; }
  function rerender() { renderFn(); }

  // ---- Shared sync (Firebase Firestore) or local fallback -----------------
  // In shared mode the whole camp's `done` + `claims` + `awards` live in one
  // Firestore doc whose id is derived from the family passcode, and every
  // device gets live updates. In local mode everything stays in this browser.
  const Sync = { mode: "local", app: null, db: null, ref: null, storage: null, campId: null };

  const firebaseConfigured = () => {
    const c = window.FIREBASE_CONFIG;
    return !!(c && c.apiKey && c.projectId && window.firebase);
  };

  async function passToCampId(passcode) {
    const data = new TextEncoder().encode("cousincamp::" + passcode);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
  }

  // Connect to the shared camp for a passcode. Returns true once subscribed.
  async function startShared(passcode) {
    if (!firebaseConfigured()) return false;
    try {
      if (!Sync.app) Sync.app = firebase.initializeApp(window.FIREBASE_CONFIG);
      Sync.db = firebase.firestore();
      const campId = await passToCampId(passcode);
      Sync.campId = campId;
      Sync.ref = Sync.db.collection("camps").doc(campId);
      Sync.storage = (typeof firebase.storage === "function") ? firebase.storage() : null;
      Sync.mode = "shared";
      // Start from a clean slate; live data arrives via the snapshot below.
      state.done = {};
      state.claims = {};
      state.awards = {};
      state.photos = [];
      Sync.ref.onSnapshot(
        (snap) => {
          const d = snap.data() || {};
          state.done = d.done || {};
          state.claims = d.claims || {};
          state.awards = d.awards || {};
          rerender();
        },
        (err) => { console.error("sync error", err); toast("Sync error — check connection"); }
      );
      // Live shared photo gallery (own subcollection, newest first).
      Sync.ref.collection("photos").orderBy("ts", "desc").onSnapshot(
        (snap) => { state.photos = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })); rerender(); },
        (err) => { console.error("photos sync error", err); }
      );
      return true;
    } catch (e) {
      console.error("startShared failed", e);
      return false;
    }
  }

  // Run a mutation against the shared doc atomically (read-modify-write).
  // `mutate(next)` edits { done, claims, awards } in place; throw to abort.
  async function sharedWrite(mutate) {
    await Sync.db.runTransaction(async (t) => {
      const snap = await t.get(Sync.ref);
      const d = snap.exists ? snap.data() : {};
      const next = { done: d.done || {}, claims: d.claims || {}, awards: d.awards || {} };
      mutate(next);
      t.set(Sync.ref, next);
    });
  }

  // Persistence layer used by both apps — branches on mode.
  const Store = {
    async toggle(camperId, activityId, on) {
      const dm = { ...(state.done[camperId] || {}) };
      if (on) dm[activityId] = true; else delete dm[activityId];
      state.done = { ...state.done, [camperId]: dm };
      rerender(); // optimistic
      if (Sync.mode === "shared") {
        try {
          await sharedWrite((n) => {
            const m = { ...(n.done[camperId] || {}) };
            if (on) m[activityId] = true; else delete m[activityId];
            n.done[camperId] = m;
          });
        } catch (e) { toast("Couldn't save — try again"); }
      } else {
        save(LS.done, state.done);
      }
    },
    async claim(camperId, rewardId) {
      const r = rewardById(rewardId);
      if (Sync.mode === "shared") {
        try {
          await sharedWrite((n) => {
            const owner = n.claims[rewardId];
            if (owner && owner !== camperId) throw new Error("taken");
            for (const rid of Object.keys(n.claims)) if (n.claims[rid] === camperId) delete n.claims[rid];
            n.claims[rewardId] = camperId;
          });
          toast(`Claimed ${r.emoji} ${r.name}!`);
        } catch (e) {
          toast(e.message === "taken" ? "Already claimed by another cousin!" : "Couldn't save — try again");
        }
      } else {
        const prev = claimOf(camperId);
        const claims = { ...state.claims };
        if (prev) delete claims[prev.id];
        claims[rewardId] = camperId;
        state.claims = claims;
        save(LS.claims, state.claims);
        toast(`Claimed ${r.emoji} ${r.name}!`);
        rerender();
      }
    },
    async release(rewardId) {
      if (Sync.mode === "shared") {
        try { await sharedWrite((n) => { delete n.claims[rewardId]; }); toast("Prize released — pick another!"); }
        catch (e) { toast("Couldn't save — try again"); }
      } else {
        const claims = { ...state.claims };
        delete claims[rewardId];
        state.claims = claims;
        save(LS.claims, state.claims);
        toast("Prize released — pick another!");
        rerender();
      }
    },
    // Append a parent award (kudos / bonus / badge) to a camper's log.
    async award(camperId, award) {
      const entry = { id: uid(), ts: Date.now(), ...award };
      if (Sync.mode === "shared") {
        try { await sharedWrite((n) => { n.awards[camperId] = (n.awards[camperId] || []).concat(entry); }); }
        catch (e) { toast("Couldn't save — try again"); }
      } else {
        state.awards = { ...state.awards, [camperId]: (state.awards[camperId] || []).concat(entry) };
        save(LS.awards, state.awards);
        rerender();
      }
    },
    // Remove a single award from a camper's log (kudos / bonus undo).
    async removeAward(camperId, awardId) {
      const drop = (list) => (list || []).filter((a) => a.id !== awardId);
      if (Sync.mode === "shared") {
        try { await sharedWrite((n) => { n.awards[camperId] = drop(n.awards[camperId]); }); }
        catch (e) { toast("Couldn't save — try again"); }
      } else {
        state.awards = { ...state.awards, [camperId]: drop(state.awards[camperId]) };
        save(LS.awards, state.awards);
        rerender();
      }
    },
    // Grant a special badge if absent, or take it back if already held.
    async toggleBadge(camperId, badge) {
      const isBadge = (a) => a.type === "badge" && a.refId === badge.refId;
      const apply = (list) => (list || []).some(isBadge)
        ? (list || []).filter((a) => !isBadge(a))
        : (list || []).concat({ id: uid(), ts: Date.now(), ...badge });
      if (Sync.mode === "shared") {
        try { await sharedWrite((n) => { n.awards[camperId] = apply(n.awards[camperId]); }); }
        catch (e) { toast("Couldn't save — try again"); }
      } else {
        state.awards = { ...state.awards, [camperId]: apply(state.awards[camperId]) };
        save(LS.awards, state.awards);
        rerender();
      }
    },
  };

  // Full-screen passcode gate shown in shared mode before joining.
  function showPasscodeGate() {
    const gate = document.createElement("div");
    gate.className = "gate";
    gate.innerHTML = `
      <div class="gate-card">
        <div class="gate-emoji">🕰️🔒</div>
        <h2>Cousin Camp</h2>
        <p>Enter the family passcode to board the time machine.</p>
        <input id="gate-input" type="password" inputmode="text" autocomplete="off" autocapitalize="off" placeholder="Camp passcode" />
        <button id="gate-go" class="btn" type="button">Board the time machine 🚀</button>
        <p class="gate-note" id="gate-note">Everyone in the family uses the same passcode.</p>
      </div>`;
    document.body.appendChild(gate);
    const input = gate.querySelector("#gate-input");
    const go = gate.querySelector("#gate-go");
    const note = gate.querySelector("#gate-note");
    const submit = async () => {
      const pass = input.value.trim();
      if (!pass) { input.focus(); return; }
      go.disabled = true; note.textContent = "Powering up the time machine…";
      const ok = await startShared(pass);
      if (ok) {
        save(LS.pass, pass);
        gate.remove();
        rerender();
      } else {
        go.disabled = false;
        note.textContent = "Time machine stalled — check your internet and try again.";
      }
    };
    go.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    setTimeout(() => input.focus(), 80);
  }

  // Join shared mode (or stay local). Call once at boot after first render.
  function initShared() {
    if (!firebaseConfigured()) return;
    const savedPass = load(LS.pass, null);
    if (savedPass) startShared(savedPass);
    else showPasscodeGate();
  }

  // ---- Campers & activities ----------------------------------------------
  const camperById = (id) => CAMPERS.find((c) => c.id === id) || null;
  const allActivities = () => SCHEDULE.flatMap((d) => d.activities.map((a) => ({ ...a, date: d.date })));
  // Only points-earning activities — informational slots (a.info) are excluded
  // from scoring, progress, and badge math; kids can't check them in.
  const scoringActivities = () => allActivities().filter((a) => !a.info);

  function doneMap(camperId) { return state.done[camperId] || {}; }
  function isDone(camperId, activityId) { return !!doneMap(camperId)[activityId]; }
  // Points from checked-off activities only (informational slots don't score).
  function activityPointsFor(camperId) {
    const dm = doneMap(camperId);
    return scoringActivities().reduce((sum, a) => sum + (dm[a.id] ? a.points : 0), 0);
  }
  // Grand total = activity points + everything grown-ups have awarded.
  function pointsFor(camperId) {
    return activityPointsFor(camperId) + awardPointsFor(camperId);
  }
  function completedCount(camperId) {
    const dm = doneMap(camperId);
    return scoringActivities().filter((a) => dm[a.id]).length;
  }
  // True if the camper finished every points-earning activity on a given day.
  // Informational slots (a.info) don't need checking, so they're skipped.
  function completedDay(camperId, date) {
    const day = SCHEDULE.find((d) => d.date === date);
    if (!day) return false;
    const todo = day.activities.filter((a) => !a.info);
    return todo.length > 0 && todo.every((a) => isDone(camperId, a.id));
  }
  function anyFullDay(camperId) { return SCHEDULE.some((d) => completedDay(camperId, d.date)); }
  function fullDayCount(camperId) { return SCHEDULE.filter((d) => completedDay(camperId, d.date)).length; }

  // ---- Camp Store / prize claims -----------------------------------------
  const rewardById = (id) => STORE.find((r) => r.id === id) || null;
  const claimedBy = (rewardId) => state.claims[rewardId] || null;
  // Which reward (if any) a camper currently holds. One prize per camper.
  function claimOf(camperId) {
    const id = Object.keys(state.claims).find((rid) => state.claims[rid] === camperId);
    return id ? rewardById(id) : null;
  }
  function spentBy(camperId) {
    const r = claimOf(camperId);
    return r ? r.cost : 0;
  }
  // Spendable balance = points earned minus the prize they're holding.
  function balanceFor(camperId) { return pointsFor(camperId) - spentBy(camperId); }

  // ---- Parent awards (kudos, bonus points, special badges) ----------------
  const kudosById = (id) => KUDOS.find((k) => k.id === id) || null;
  const parentBadgeById = (id) => PARENT_BADGES.find((b) => b.id === id) || null;
  function awardsFor(camperId) { return state.awards[camperId] || []; }
  // Bonus points a camper has been awarded by grown-ups (kudos + bonus).
  function awardPointsFor(camperId) {
    return awardsFor(camperId).reduce((sum, a) => sum + (a.points || 0), 0);
  }
  function kudosCountFor(camperId) {
    return awardsFor(camperId).filter((a) => a.type === "kudos").length;
  }
  // Cousin-to-cousin cheers a camper has received (recognition only, 0 points).
  function cheersCountFor(camperId) {
    return awardsFor(camperId).filter((a) => a.type === "cheer").length;
  }
  // Special parent badges a camper currently holds.
  function parentBadgesFor(camperId) {
    const held = new Set(awardsFor(camperId).filter((a) => a.type === "badge").map((a) => a.refId));
    return PARENT_BADGES.filter((b) => held.has(b.id));
  }
  function hasParentBadge(camperId, badgeId) {
    return awardsFor(camperId).some((a) => a.type === "badge" && a.refId === badgeId);
  }
  // Leaderboard of grown-ups by how much recognition they've handed out.
  // Tallies every award tagged with a `by` name across all campers (cousin
  // cheers carry no `by`, so they're naturally excluded). Returns rows of
  // { name, awards, kudos, points } sorted most-generous first — by total
  // awards given, then points, then name.
  function awarderTally() {
    const rows = new Map();
    CAMPERS.forEach((c) => awardsFor(c.id).forEach((a) => {
      if (!a.by) return;
      const key = String(a.by).toLowerCase();
      const row = rows.get(key) || { name: a.by, awards: 0, kudos: 0, points: 0 };
      row.awards += 1;
      if (a.type === "kudos") row.kudos += 1;
      row.points += a.points || 0;
      rows.set(key, row);
    }));
    return [...rows.values()].sort((x, y) =>
      y.awards - x.awards || y.points - x.points || x.name.localeCompare(y.name));
  }
  // The camper a grown-up is currently awarding to in the parents app.
  function targetCamper() {
    return camperById(state.target) || camperById(state.me) || CAMPERS[0] || null;
  }
  function setTarget(camperId) {
    state.target = camperId;
    save(LS.target, camperId);
    rerender();
  }

  // ---- Parent identity & fairness rule ------------------------------------
  // A grown-up signs in with their first name in the parents app. The parent →
  // kids link is derived from each camper's `parents` field in data.js (e.g.
  // "Lance & Betsy"), so a parent can't give awards to their own kids.
  function sameName(a, b) { return String(a).trim().toLowerCase() === String(b).trim().toLowerCase(); }
  // Parse a camper's `parents` string ("Lance & Betsy") into first names.
  function camperParents(c) {
    return String((c && c.parents) || "").split(/[,&]|\band\b/i).map((s) => s.trim()).filter(Boolean);
  }
  // The full grown-up roster for the parents' app sign-in: every parent derived
  // from the campers, plus the extra GROWNUPS (grandparents, etc.). Each entry
  // has the `name` they sign in with and a `label` shown on the sign-in chip.
  // Grown-ups with no kids of their own can award any cousin.
  function grownupRoster() {
    const out = [], seen = new Set();
    const add = (name, label) => {
      const k = name.toLowerCase();
      if (!seen.has(k)) { seen.add(k); out.push({ name, label: label || name }); }
    };
    CAMPERS.forEach((c) => camperParents(c).forEach((n) => add(n)));
    GROWNUPS.forEach((g) => add(g.name, g.nickname ? `${g.nickname} (${g.name})` : g.name));
    return out;
  }
  // Every distinct grown-up name (parents + extra grown-ups), in first-seen order.
  function allParentNames() { return grownupRoster().map((g) => g.name); }
  // Is the signed-in name a recognized parent? Returns the name, or null.
  function currentParent() {
    const name = state.parent;
    return name && allParentNames().some((n) => sameName(n, name)) ? name : null;
  }
  // The signed-in grown-up's own kids (camper ids).
  function ownKidIds() {
    const name = state.parent;
    if (!name) return [];
    return CAMPERS.filter((c) => camperParents(c).some((n) => sameName(n, name))).map((c) => c.id);
  }
  function isOwnKid(camperId) { return ownKidIds().includes(camperId); }
  function setParent(name) {
    state.parent = String(name || "").trim() || null;
    save(LS.parent, state.parent);
    rerender();
  }
  function clearParent() {
    state.parent = null;
    save(LS.parent, null);
    rerender();
  }
  // Returns true (and warns) if the signed-in parent may not award this camper.
  function blockOwnKid(c) {
    if (isOwnKid(c.id)) {
      toast(`${c.name} is your kid — let another grown-up award them 🙂`);
      return true;
    }
    return false;
  }

  // Award actions — persist through Store so they sync in shared mode.
  function giveKudos(kudosId) {
    const c = targetCamper(); if (!c || blockOwnKid(c)) return;
    const k = kudosById(kudosId); if (!k) return;
    toast(`${k.emoji} ${k.label} for ${c.name} +${k.points}`);
    Store.award(c.id, { type: "kudos", refId: k.id, emoji: k.emoji, label: k.label, points: k.points, by: state.parent || null });
  }
  // A cousin-to-cousin cheer from the campers' app. Recognition only — worth
  // 0 points so kids can't trade points to game the leaderboard. Recorded as
  // a "cheer" award on the recipient, tagged with who sent it. Returns whether
  // the cheer was sent (false if it was a no-op, e.g. cheering yourself).
  function giveCheer(fromId, toId, kudosId) {
    const from = camperById(fromId), to = camperById(toId), k = kudosById(kudosId);
    if (!from || !to || !k) return false;
    if (from.id === to.id) { toast("Pick a different cousin to cheer! 😊"); return false; }
    toast(`${k.emoji} ${from.name} cheered ${to.name}!`);
    Store.award(to.id, {
      type: "cheer", refId: k.id, emoji: k.emoji, label: k.label, points: 0,
      from: from.id, note: `cheer from ${from.name}`,
    });
    return true;
  }
  function giveBonus(points, note) {
    const c = targetCamper(); if (!c || blockOwnKid(c)) return;
    const pts = Math.round(Number(points) || 0);
    if (!pts) { toast("Enter some points first"); return; }
    const clean = (note || "").trim();
    toast(`${pts > 0 ? "+" : ""}${pts} for ${c.name}${clean ? " — " + clean : ""}`);
    Store.award(c.id, { type: "bonus", emoji: pts < 0 ? "➖" : "➕", label: "Bonus points", points: pts, note: clean, by: state.parent || null });
  }
  function toggleParentBadge(badgeId) {
    const c = targetCamper(); if (!c || blockOwnKid(c)) return;
    const b = parentBadgeById(badgeId); if (!b) return;
    toast(hasParentBadge(c.id, badgeId) ? `Took back ${b.emoji} ${b.label}` : `${b.emoji} ${b.label} for ${c.name}!`);
    Store.toggleBadge(c.id, { type: "badge", refId: b.id, emoji: b.emoji, label: b.label, points: 0, by: state.parent || null });
  }
  function undoAward(camperId, awardId) {
    toast("Award removed");
    Store.removeAward(camperId, awardId);
  }

  // ---- Date helpers -------------------------------------------------------
  // "Today" within the camp week. If the real date isn't in the camp range,
  // fall back to the first camp day so the app is always useful to demo.
  function todayISO() {
    const real = new Date();
    const iso = `${real.getFullYear()}-${String(real.getMonth() + 1).padStart(2, "0")}-${String(real.getDate()).padStart(2, "0")}`;
    return SCHEDULE.some((d) => d.date === iso) ? iso : SCHEDULE[0].date;
  }
  function fmtDow(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" });
  }
  function dayNum(iso) { return Number(iso.split("-")[2]); }
  function fmtLong(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }

  // ---- Toast --------------------------------------------------------------
  let toastTimer;
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  // ---- Utils --------------------------------------------------------------
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  // Short "time ago" label for the award feed.
  function timeAgo(ts) {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return "just now";
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} hr ago`;
    const d = Math.round(h / 24);
    return `${d} day${d > 1 ? "s" : ""} ago`;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }
  // A cousin's "face" for avatars: their real photo if they have one, otherwise
  // their emoji. `emojiClass` keeps each spot's existing styling — it's applied
  // to both the emoji span and the photo <img> so the same CSS hooks work.
  function camperFace(c, emojiClass) {
    if (c && c.photo) {
      const cls = emojiClass ? `${emojiClass} avatar-photo` : "avatar-photo";
      return `<img class="${cls}" src="${escapeHtml(c.photo)}" alt="${escapeHtml(c.name)}" loading="lazy">`;
    }
    const e = c ? c.emoji : "";
    return emojiClass ? `<span class="${emojiClass}">${e}</span>` : e;
  }

  // ---- Shared photo gallery (Firebase Storage + Firestore) ----------------
  // Photos upload to Storage at camps/{campId}/photos and their metadata to a
  // Firestore subcollection, so every device sees the same gallery live.
  // Images are downscaled in the browser first to stay well within free tier.
  function downscaleImage(file, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
          else if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("encode failed")), "image/jpeg", quality);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const Photos = {
    // True when uploads/live gallery are available (shared mode + Storage SDK).
    enabled() { return Sync.mode === "shared" && !!Sync.storage; },
    list() { return state.photos; },
    // Upload one image file: downscale → Storage → Firestore metadata.
    async add(file, meta) {
      if (!Photos.enabled()) { toast("Photo sharing needs the shared camp"); return false; }
      if (!file || !file.type || !file.type.startsWith("image/")) return false;
      try {
        const blob = await downscaleImage(file, 1280, 0.72);
        const id = uid();
        const path = `camps/${Sync.campId}/photos/${id}.jpg`;
        const ref = Sync.storage.ref().child(path);
        await ref.put(blob, { contentType: "image/jpeg" });
        const url = await ref.getDownloadURL();
        await Sync.ref.collection("photos").doc(id).set({
          url, path, ts: Date.now(), by: (meta && meta.by) || null,
        });
        return true;
      } catch (e) { console.error("photo upload failed", e); toast("Upload failed — try again"); return false; }
    },
    // Upload several files; returns how many succeeded.
    async addMany(files) {
      let ok = 0;
      for (const f of Array.from(files || [])) { if (await Photos.add(f)) ok++; }
      if (ok) toast(`${ok} photo${ok > 1 ? "s" : ""} added 📸`);
      return ok;
    },
    async remove(photo) {
      try {
        await Sync.ref.collection("photos").doc(photo.id).delete();
        if (photo.path && Sync.storage) { try { await Sync.storage.ref().child(photo.path).delete(); } catch (_) {} }
        toast("Photo removed");
      } catch (e) { console.error(e); toast("Couldn't remove photo"); }
    },
  };

  // ---- Pull to refresh ----------------------------------------------------
  // A custom pull-down gesture, since standalone (home-screen) PWAs have no
  // browser chrome and therefore no built-in pull-to-refresh. Only engages
  // when the page is scrolled to the very top and the swipe is mostly vertical,
  // so horizontal scrollers (face rows, prize tiles) and taps still work.
  function initPullToRefresh(onRefresh) {
    if (!("ontouchstart" in window)) return;        // touch devices only
    const refresh = typeof onRefresh === "function" ? onRefresh : () => location.reload();
    const THRESHOLD = 70;   // px of pull needed to trigger
    const MAX = 110;        // max visual travel
    const DAMP = 0.5;       // rubber-band factor

    const ind = document.createElement("div");
    ind.className = "ptr";
    ind.innerHTML = `<div class="ptr-circle"><span class="ptr-icon">↻</span></div>`;
    document.body.appendChild(ind);
    const icon = ind.querySelector(".ptr-icon");

    const atTop = () => (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    let startX = 0, startY = 0, active = false, decided = false, committed = false,
        ready = false, refreshing = false;

    const place = (pull) => {
      ind.style.transform = `translateY(${pull}px)`;
      ind.style.opacity = Math.min(pull / THRESHOLD, 1);
      icon.style.transform = `rotate(${pull * 2.6}deg)`;
    };
    const snapBack = () => {
      ind.style.transition = "transform .25s ease, opacity .25s ease";
      ind.style.transform = "translateY(0)";
      ind.style.opacity = "0";
      ind.classList.remove("ready");
    };

    window.addEventListener("touchstart", (e) => {
      if (refreshing || e.touches.length !== 1 || !atTop()) { active = false; return; }
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      active = true; decided = false; committed = false; ready = false;
      ind.style.transition = "none";
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (!active || refreshing) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!decided) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          decided = true;
          committed = dy > 0 && dy > Math.abs(dx) && atTop();   // mostly-vertical pull at top
          if (!committed) active = false;
        }
        if (!committed) return;
      }
      if (!atTop()) { active = false; snapBack(); return; }
      e.preventDefault();                                       // stop native overscroll
      const pull = Math.min(dy * DAMP, MAX);
      place(pull);
      ready = pull >= THRESHOLD;
      ind.classList.toggle("ready", ready);
    }, { passive: false });

    const end = () => {
      if (!committed || refreshing) { active = false; return; }
      active = false;
      ind.style.transition = "transform .25s ease, opacity .25s ease";
      if (ready) {
        refreshing = true;
        icon.style.transform = "";
        ind.classList.add("spin");
        ind.style.transform = "translateY(58px)";
        ind.style.opacity = "1";
        setTimeout(refresh, 450);                               // let the spinner show
      } else {
        snapBack();
      }
    };
    window.addEventListener("touchend", end, { passive: true });
    window.addEventListener("touchcancel", end, { passive: true });
  }

  // ---- Public surface -----------------------------------------------------
  window.CampCore = {
    data: { CAMPERS, GROWNUPS, SCHEDULE, STORE, KUDOS, BONUS_QUICK, PARENT_BADGES, PHOTO_ALBUM_URL },
    state, LS, load, save,
    setRender, initShared, startShared, Store, Photos,
    // campers & activities
    camperById, allActivities, scoringActivities, doneMap, isDone,
    activityPointsFor, awardPointsFor, pointsFor,
    completedCount, completedDay, anyFullDay, fullDayCount,
    // store
    rewardById, claimedBy, claimOf, spentBy, balanceFor,
    // parent awards
    kudosById, parentBadgeById, awardsFor, kudosCountFor, cheersCountFor, parentBadgesFor, hasParentBadge, awarderTally,
    targetCamper, setTarget, giveKudos, giveCheer, giveBonus, toggleParentBadge, undoAward,
    // parent identity & fairness rule
    allParentNames, grownupRoster, currentParent, ownKidIds, isOwnKid, setParent, clearParent,
    // formatting & utils
    todayISO, fmtDow, dayNum, fmtLong, toast, escapeHtml, camperFace, uid, timeAgo,
    initPullToRefresh,
  };

  // Both apps get pull-to-refresh automatically (reloads the page, which
  // reconnects the shared camp and redraws everything).
  initPullToRefresh();
})();
