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

  // ---- Storage helpers ----------------------------------------------------
  const LS = {
    me: "cc.me",                 // current camper id (stays local to each device)
    done: "cc.done",             // { camperId: { activityId: true } }
    claims: "cc.claims",         // { rewardId: camperId } — one prize per camper
    awards: "cc.awards",         // { camperId: [ {id,type,refId,emoji,label,points,note,ts} ] }
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
  const Sync = { mode: "local", app: null, db: null, ref: null };

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
      Sync.ref = Sync.db.collection("camps").doc(campId);
      Sync.mode = "shared";
      // Start from a clean slate; live data arrives via the snapshot below.
      state.done = {};
      state.claims = {};
      state.awards = {};
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
        <p>Enter the family camp passcode to join the shared camp.</p>
        <input id="gate-input" type="password" inputmode="text" autocomplete="off" autocapitalize="off" placeholder="Camp passcode" />
        <button id="gate-go" class="btn" type="button">Enter camp 🚀</button>
        <p class="gate-note" id="gate-note">Everyone in the family uses the same passcode.</p>
      </div>`;
    document.body.appendChild(gate);
    const input = gate.querySelector("#gate-input");
    const go = gate.querySelector("#gate-go");
    const note = gate.querySelector("#gate-note");
    const submit = async () => {
      const pass = input.value.trim();
      if (!pass) { input.focus(); return; }
      go.disabled = true; note.textContent = "Connecting…";
      const ok = await startShared(pass);
      if (ok) {
        save(LS.pass, pass);
        gate.remove();
        rerender();
      } else {
        go.disabled = false;
        note.textContent = "Couldn't connect. Check your internet and try again.";
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

  function doneMap(camperId) { return state.done[camperId] || {}; }
  function isDone(camperId, activityId) { return !!doneMap(camperId)[activityId]; }
  // Points from checked-off activities only.
  function activityPointsFor(camperId) {
    const dm = doneMap(camperId);
    return allActivities().reduce((sum, a) => sum + (dm[a.id] ? a.points : 0), 0);
  }
  // Grand total = activity points + everything grown-ups have awarded.
  function pointsFor(camperId) {
    return activityPointsFor(camperId) + awardPointsFor(camperId);
  }
  function completedCount(camperId) {
    const dm = doneMap(camperId);
    return allActivities().filter((a) => dm[a.id]).length;
  }
  // True if the camper finished every activity on a given day.
  function completedDay(camperId, date) {
    const day = SCHEDULE.find((d) => d.date === date);
    return !!day && day.activities.every((a) => isDone(camperId, a.id));
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
  // Special parent badges a camper currently holds.
  function parentBadgesFor(camperId) {
    const held = new Set(awardsFor(camperId).filter((a) => a.type === "badge").map((a) => a.refId));
    return PARENT_BADGES.filter((b) => held.has(b.id));
  }
  function hasParentBadge(camperId, badgeId) {
    return awardsFor(camperId).some((a) => a.type === "badge" && a.refId === badgeId);
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
  // Every distinct grown-up name across all campers, in first-seen order.
  function allParentNames() {
    const out = [], seen = new Set();
    CAMPERS.forEach((c) => camperParents(c).forEach((n) => {
      const k = n.toLowerCase();
      if (!seen.has(k)) { seen.add(k); out.push(n); }
    }));
    return out;
  }
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
    Store.award(c.id, { type: "kudos", refId: k.id, emoji: k.emoji, label: k.label, points: k.points });
  }
  function giveBonus(points, note) {
    const c = targetCamper(); if (!c || blockOwnKid(c)) return;
    const pts = Math.round(Number(points) || 0);
    if (!pts) { toast("Enter some points first"); return; }
    const clean = (note || "").trim();
    toast(`${pts > 0 ? "+" : ""}${pts} for ${c.name}${clean ? " — " + clean : ""}`);
    Store.award(c.id, { type: "bonus", emoji: pts < 0 ? "➖" : "➕", label: "Bonus points", points: pts, note: clean });
  }
  function toggleParentBadge(badgeId) {
    const c = targetCamper(); if (!c || blockOwnKid(c)) return;
    const b = parentBadgeById(badgeId); if (!b) return;
    toast(hasParentBadge(c.id, badgeId) ? `Took back ${b.emoji} ${b.label}` : `${b.emoji} ${b.label} for ${c.name}!`);
    Store.toggleBadge(c.id, { type: "badge", refId: b.id, emoji: b.emoji, label: b.label, points: 0 });
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

  // ---- Public surface -----------------------------------------------------
  window.CampCore = {
    data: { CAMPERS, SCHEDULE, STORE, KUDOS, BONUS_QUICK, PARENT_BADGES, PHOTO_ALBUM_URL },
    state, LS, load, save,
    setRender, initShared, startShared, Store,
    // campers & activities
    camperById, allActivities, doneMap, isDone,
    activityPointsFor, awardPointsFor, pointsFor,
    completedCount, completedDay, anyFullDay, fullDayCount,
    // store
    rewardById, claimedBy, claimOf, spentBy, balanceFor,
    // parent awards
    kudosById, parentBadgeById, awardsFor, kudosCountFor, parentBadgesFor, hasParentBadge,
    targetCamper, setTarget, giveKudos, giveBonus, toggleParentBadge, undoAward,
    // parent identity & fairness rule
    allParentNames, currentParent, ownKidIds, isOwnKid, setParent, clearParent,
    // formatting & utils
    todayISO, fmtDow, dayNum, fmtLong, toast, escapeHtml, uid, timeAgo,
  };
})();
