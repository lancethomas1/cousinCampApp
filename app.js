/* ============================================================
   Cousin Camp — app logic (vanilla JS, no build step)
   State is stored in localStorage so it survives reloads.
   ============================================================ */

(function () {
  "use strict";

  const { CAMPERS, SCHEDULE, STORE, PHOTO_ALBUM_URL } = window.CAMP_DATA;
  const view = document.getElementById("view");

  // ---- Storage helpers ----------------------------------------------------
  const LS = {
    me: "cc.me",                 // current camper id (stays local to each device)
    done: "cc.done",             // { camperId: { activityId: true } }
    claims: "cc.claims",         // { rewardId: camperId } — one prize per camper
    pass: "cc.pass",             // remembered family passcode (shared mode)
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
    route: "today",
  };

  // ---- Shared sync (Firebase Firestore) or local fallback -----------------
  // In shared mode the whole camp's `done` + `claims` live in one Firestore
  // doc whose id is derived from the family passcode, and every device gets
  // live updates. In local mode everything stays in this browser.
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
      Sync.ref.onSnapshot(
        (snap) => {
          const d = snap.data() || {};
          state.done = d.done || {};
          state.claims = d.claims || {};
          render();
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
  // `mutate(next)` edits { done, claims } in place; throw to abort.
  async function sharedWrite(mutate) {
    await Sync.db.runTransaction(async (t) => {
      const snap = await t.get(Sync.ref);
      const d = snap.exists ? snap.data() : {};
      const next = { done: d.done || {}, claims: d.claims || {} };
      mutate(next);
      t.set(Sync.ref, next);
    });
  }

  // Persistence layer used by the UI — branches on mode.
  const Store = {
    async toggle(camperId, activityId, on) {
      const dm = { ...(state.done[camperId] || {}) };
      if (on) dm[activityId] = true; else delete dm[activityId];
      state.done = { ...state.done, [camperId]: dm };
      render(); // optimistic
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
        render();
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
        render();
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
        render();
      } else {
        go.disabled = false;
        note.textContent = "Couldn't connect. Check your internet and try again.";
      }
    };
    go.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    setTimeout(() => input.focus(), 80);
  }

  const camperById = (id) => CAMPERS.find((c) => c.id === id) || null;
  const allActivities = () => SCHEDULE.flatMap((d) => d.activities.map((a) => ({ ...a, date: d.date })));

  function doneMap(camperId) {
    return state.done[camperId] || {};
  }
  function isDone(camperId, activityId) {
    return !!doneMap(camperId)[activityId];
  }
  function pointsFor(camperId) {
    const dm = doneMap(camperId);
    return allActivities().reduce((sum, a) => sum + (dm[a.id] ? a.points : 0), 0);
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
  function anyFullDay(camperId) {
    return SCHEDULE.some((d) => completedDay(camperId, d.date));
  }
  function fullDayCount(camperId) {
    return SCHEDULE.filter((d) => completedDay(camperId, d.date)).length;
  }

  // ---- Camp Store / prize claims -----------------------------------------
  const rewardById = (id) => STORE.find((r) => r.id === id) || null;
  // Which camper (if any) has claimed a given reward.
  const claimedBy = (rewardId) => state.claims[rewardId] || null;
  // Which reward (if any) a camper currently holds. One prize per camper.
  function claimOf(camperId) {
    const id = Object.keys(state.claims).find((rid) => state.claims[rid] === camperId);
    return id ? rewardById(id) : null;
  }
  // Points already spent on the camper's claimed prize.
  function spentBy(camperId) {
    const r = claimOf(camperId);
    return r ? r.cost : 0;
  }
  // Spendable balance = points earned minus the prize they're holding.
  function balanceFor(camperId) {
    return pointsFor(camperId) - spentBy(camperId);
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

  // ---- Toggle an activity complete ---------------------------------------
  function toggleActivity(activityId, points, title) {
    if (!state.me) { openCamperModal(); toast("Pick your camper first!"); return; }
    const turningOn = !isDone(state.me, activityId);
    if (turningOn) toast(`+${points} pts — ${title} ✅`);
    Store.toggle(state.me, activityId, turningOn);
  }

  // ---- Activity row markup -----------------------------------------------
  function activityRow(a) {
    const done = state.me && isDone(state.me, a.id);
    const el = document.createElement("div");
    el.className = "activity" + (done ? " done" : "");
    el.innerHTML = `
      <div class="activity-emoji">${a.emoji}</div>
      <div class="activity-body">
        <div class="activity-top">
          <span class="activity-time">${a.time}</span>
          <span class="activity-points">⭐ ${a.points}</span>
        </div>
        <div class="activity-title">${escapeHtml(a.title)}</div>
        <p class="activity-desc">${escapeHtml(a.desc)}</p>
        <div class="activity-loc">📍 ${escapeHtml(a.location)}</div>
      </div>
      <button class="check-btn ${done ? "checked" : ""}" type="button"
              aria-label="Mark ${escapeHtml(a.title)} complete">${done ? "✓" : ""}</button>
    `;
    el.querySelector(".check-btn").addEventListener("click", () =>
      toggleActivity(a.id, a.points, a.title)
    );
    return el;
  }

  // ---- TODAY view ---------------------------------------------------------
  function renderToday() {
    const iso = todayISO();
    const day = SCHEDULE.find((d) => d.date === iso);
    const frag = document.createElement("div");

    const total = day.activities.length;
    const doneN = state.me ? day.activities.filter((a) => isDone(state.me, a.id)).length : 0;
    const pct = total ? Math.round((doneN / total) * 100) : 0;

    const hero = document.createElement("div");
    hero.className = "hero";
    hero.innerHTML = `
      <div class="eyebrow">🕰️ Today at Cousin Camp</div>
      <h2>${escapeHtml(day.title)}</h2>
      <p>${day.era ? escapeHtml(day.era) + " · " : ""}${fmtLong(iso)}</p>
      <div class="hero-progress"><span style="width:${pct}%"></span></div>
      <div class="hero-progress-label">${doneN}/${total} activities done${state.me ? "" : " — pick your traveler to track points"}</div>
    `;
    frag.appendChild(hero);

    day.activities.forEach((a) => frag.appendChild(activityRow({ ...a, date: iso })));
    view.replaceChildren(frag);
  }

  // ---- SCHEDULE view ------------------------------------------------------
  function renderSchedule() {
    const today = todayISO();
    const frag = document.createElement("div");
    const head = document.createElement("div");
    head.innerHTML = `<h2 class="view-title">Journey Through Time 🗓️</h2>
      <p class="view-sub">Seven stops across history with Mimi's time machine.</p>`;
    frag.appendChild(head);

    SCHEDULE.forEach((day) => {
      const block = document.createElement("section");
      block.className = "day-block" + (day.date === today ? " is-today" : "");
      const dh = document.createElement("div");
      dh.className = "day-head";
      dh.innerHTML = `
        <div class="day-badge"><div class="dow">${fmtDow(day.date)}</div><div class="dnum">${dayNum(day.date)}</div></div>
        <div>
          <h3>${escapeHtml(day.title)}</h3>
          <div class="day-theme">${day.era ? escapeHtml(day.era) : day.activities.length + " activities"}</div>
        </div>
        ${day.date === today ? '<span class="today-pill">TODAY</span>' : ""}
      `;
      block.appendChild(dh);
      day.activities.forEach((a) => block.appendChild(activityRow({ ...a, date: day.date })));
      frag.appendChild(block);
    });
    view.replaceChildren(frag);
  }

  // ---- PHOTOS view --------------------------------------------------------
  // Photos live in a shared Google Photos album (set PHOTO_ALBUM_URL in data.js).
  function renderPhotos() {
    const url = (PHOTO_ALBUM_URL || "").trim();
    const frag = document.createElement("div");
    const head = document.createElement("div");
    head.innerHTML = `<h2 class="view-title">Camp Photos 📸</h2>
      <p class="view-sub">All our memories in one shared album.</p>`;
    frag.appendChild(head);

    const card = document.createElement("div");
    card.className = "card album-card";
    if (url) {
      card.innerHTML = `
        <div class="album-emoji">🖼️</div>
        <h3>Cousin Camp Shared Album</h3>
        <p>Add your pictures and see everyone else's in our shared Google Photos album.</p>`;
      const a = document.createElement("a");
      a.className = "btn album-btn";
      a.href = url; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = "📷 Open shared album";
      card.appendChild(a);
      const hint = document.createElement("p");
      hint.className = "album-hint";
      hint.textContent = "Tip: in Google Photos, tap Add photos to upload from your camera roll.";
      card.appendChild(hint);
    } else {
      card.innerHTML = `
        <div class="album-emoji">📷</div>
        <h3>Shared album coming soon</h3>
        <p>Mimi will add the Google Photos album link here so everyone can share pictures.</p>`;
    }
    frag.appendChild(card);
    view.replaceChildren(frag);
  }

  // ---- AWARDS view --------------------------------------------------------
  // Collect, don't compete: every cousin works toward their own badges,
  // claims one unique prize, and earns an Awards Day certificate.
  // Each badge has a `hint` shown while it's still locked.
  const TOTAL_ACTS = allActivities().length;
  const BADGES = [
    { id: "cadet",     emoji: "🚀", label: "Time Cadet",      hint: "Complete your very first activity",     test: (c) => completedCount(c) >= 1 },
    { id: "going",     emoji: "⭐", label: "Getting Going",   hint: "Complete 5 activities",                 test: (c) => completedCount(c) >= 5 },
    { id: "dynamo",    emoji: "🌟", label: "Daily Dynamo",    hint: "Finish every activity in any one day",  test: (c) => anyFullDay(c) },
    { id: "twoday",    emoji: "📅", label: "Two-Day Trekker", hint: "Finish two full days of camp",          test: (c) => fullDayCount(c) >= 2 },
    { id: "halfway",   emoji: "🎯", label: "Time Traveler",   hint: "Complete half of all activities",       test: (c) => completedCount(c) >= Math.ceil(TOTAL_ACTS / 2) },
    { id: "prize",     emoji: "🏆", label: "Prize Winner",    hint: "Claim a prize from the Camp Store",     test: (c) => !!claimOf(c) },
    { id: "champion",  emoji: "👑", label: "Time Champion",   hint: "Complete 16 activities",                test: (c) => completedCount(c) >= 16 },
    { id: "master",    emoji: "🎖️", label: "Master of Time",  hint: "Complete every single activity",        test: (c) => completedCount(c) >= TOTAL_ACTS },
  ];
  const badgesEarned = (camperId) => BADGES.filter((b) => b.test(camperId));

  function renderAwards() {
    const frag = document.createElement("div");
    const head = document.createElement("div");
    head.innerHTML = `<h2 class="view-title">Camp Awards 🏆</h2>
      <p class="view-sub">Everybody wins — collect badges, claim your prize!</p>`;
    frag.appendChild(head);

    if (!state.me) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.innerHTML = `<div class="big">🕰️</div>
        <h3>Pick your traveler</h3>
        <p>Choose who you are to start collecting badges and claim your prize.</p>`;
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.style.marginTop = "14px";
      btn.textContent = "👋 Pick traveler";
      btn.addEventListener("click", openCamperModal);
      empty.appendChild(btn);
      frag.appendChild(empty);
      view.replaceChildren(frag);
      return;
    }

    const me = camperById(state.me);
    const myBadges = badgesEarned(state.me);
    const myReward = claimOf(state.me);

    // --- Camp Card: this camper's personal stats ---------------------------
    const card = document.createElement("div");
    card.className = "camp-card";
    card.style.setProperty("--cc", me.color);
    card.innerHTML = `
      <div class="cc-avatar">${me.emoji}</div>
      <div class="cc-info">
        <div class="cc-name">${escapeHtml(me.name)}</div>
        <div class="cc-sub">Cousin Camp Time Traveler</div>
        <div class="cc-stats">
          <div class="cc-stat"><b>${balanceFor(state.me)}</b><span>points to spend</span></div>
          <div class="cc-stat"><b>${completedCount(state.me)}</b><span>activities</span></div>
          <div class="cc-stat"><b>${myBadges.length}</b><span>badges</span></div>
        </div>
      </div>`;
    frag.appendChild(card);

    // --- Camp Store: nine one-of-a-kind prizes -----------------------------
    const storeSection = document.createElement("div");
    storeSection.innerHTML = `<h3 class="section-title">🏪 Camp Store — Pick Your Prize</h3>
      <p class="section-note">${myReward
        ? `You claimed <b>${myReward.emoji} ${escapeHtml(myReward.name)}</b>. Tap it to switch.`
        : `Each prize can be claimed by only one cousin. Spend your points to claim yours!`}</p>`;
    const storeGrid = document.createElement("div");
    storeGrid.className = "store-grid";
    STORE.forEach((r) => {
      const owner = claimedBy(r.id);
      const ownerCamper = owner ? camperById(owner) : null;
      const mine = owner === state.me;
      const takenByOther = owner && !mine;
      // Claiming swaps your one prize, so affordability is about total points.
      const affordable = pointsFor(state.me) >= r.cost;

      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "store-tile" + (mine ? " mine" : "") + (takenByOther ? " taken" : "");
      tile.disabled = takenByOther;
      tile.innerHTML = `
        <div class="st-emoji">${r.emoji}</div>
        <div class="st-name">${escapeHtml(r.name)}</div>
        <div class="st-desc">${escapeHtml(r.desc)}</div>
        <div class="st-foot">
          ${takenByOther
            ? `<span class="st-owner">${ownerCamper.emoji} ${escapeHtml(ownerCamper.name)}'s</span>`
            : mine
              ? `<span class="st-claimed">✓ Yours — tap to release</span>`
              : `<span class="st-cost ${affordable ? "" : "short"}">⭐ ${r.cost}${affordable ? "" : " (need more)"}</span>`}
        </div>`;
      tile.addEventListener("click", () => mine ? releaseReward(r.id) : claimReward(r.id));
      storeGrid.appendChild(tile);
    });
    storeSection.appendChild(storeGrid);
    frag.appendChild(storeSection);

    // --- Trophy Case: badges -----------------------------------------------
    const trophy = document.createElement("div");
    trophy.innerHTML = `<h3 class="section-title">🏆 ${escapeHtml(me.name)}'s Trophy Case</h3>
      <p class="section-note">${myBadges.length} of ${BADGES.length} badges earned${myBadges.length === BADGES.length ? " — every one! 🎉" : ""}</p>`;
    const tcGrid = document.createElement("div");
    tcGrid.className = "trophy-grid";
    BADGES.forEach((b) => {
      const got = b.test(state.me);
      const t = document.createElement("div");
      t.className = "trophy" + (got ? " got" : " locked");
      t.innerHTML = `
        <div class="tr-emoji">${got ? b.emoji : "🔒"}</div>
        <div class="tr-label">${escapeHtml(b.label)}</div>
        <div class="tr-hint">${got ? "Earned!" : escapeHtml(b.hint)}</div>`;
      tcGrid.appendChild(t);
    });
    trophy.appendChild(tcGrid);
    frag.appendChild(trophy);

    // --- Awards Day certificate --------------------------------------------
    const certWrap = document.createElement("div");
    certWrap.innerHTML = `<h3 class="section-title">📜 Awards Day</h3>
      <p class="section-note">Mimi's official certificate — print it for the ceremony!</p>`;
    certWrap.appendChild(buildCertificate(me));
    const printBtn = document.createElement("button");
    printBtn.className = "btn";
    printBtn.style.marginTop = "12px";
    printBtn.innerHTML = "🖨️ Print certificate";
    printBtn.addEventListener("click", () => window.print());
    certWrap.appendChild(printBtn);
    frag.appendChild(certWrap);

    // --- Camp family roster (non-competitive overview) ---------------------
    const roster = document.createElement("div");
    roster.innerHTML = `<h3 class="section-title">🧑‍🚀 The Time Crew</h3>
      <p class="section-note">Tap a cousin to switch travelers.</p>`;
    CAMPERS.forEach((c) => {
      const r = claimOf(c.id);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "roster-row" + (c.id === state.me ? " me" : "");
      row.innerHTML = `
        <div class="lb-avatar" style="background:${c.color}22">${c.emoji}</div>
        <div class="ros-name">${escapeHtml(c.name)}
          <small>${badgesEarned(c.id).length} badges · ${r ? r.emoji + " " + escapeHtml(r.name) : "no prize yet"}</small></div>
        <div class="ros-pts">⭐ ${pointsFor(c.id)}</div>`;
      row.addEventListener("click", () => {
        state.me = c.id; save(LS.me, c.id); updateWhoami(); render();
      });
      roster.appendChild(row);
    });
    frag.appendChild(roster);

    view.replaceChildren(frag);
  }

  // Build a printable certificate card with a fun superlative.
  function buildCertificate(camper) {
    const badges = badgesEarned(camper.id);
    const reward = claimOf(camper.id);
    const superl = pickSuperlative(camper.id);
    const cert = document.createElement("div");
    cert.className = "certificate";
    cert.innerHTML = `
      <div class="cert-top">🕰️ Cousin Camp 2026 🕰️</div>
      <div class="cert-award">Time Machine Travelers · Official Certificate</div>
      <div class="cert-name">${escapeHtml(camper.name)}</div>
      <div class="cert-title">${superl.emoji} ${escapeHtml(superl.title)}</div>
      <p class="cert-blurb">${escapeHtml(superl.blurb)}</p>
      <div class="cert-stats">
        <span>🎯 ${completedCount(camper.id)} activities</span>
        <span>🏅 ${badges.length} badges</span>
        <span>⭐ ${pointsFor(camper.id)} points</span>
        ${reward ? `<span>${reward.emoji} ${escapeHtml(reward.name)}</span>` : ""}
      </div>
      <div class="cert-sign">With love,<br><span>Mimi 👵</span></div>`;
    return cert;
  }

  // Pick a celebratory superlative based on what the camper did most.
  function pickSuperlative(camperId) {
    const done = completedCount(camperId);
    if (done >= TOTAL_ACTS)        return { emoji: "🎖️", title: "Master of All Time", blurb: "Did every single thing at camp. Mimi is amazed!" };
    if (done >= 16)               return { emoji: "👑", title: "Time Champion", blurb: "A true champion of Cousin Camp." };
    if (fullDayCount(camperId) >= 2) return { emoji: "🌟", title: "All-Day Adventurer", blurb: "Jumped into camp from sunup to sundown." };
    if (done >= Math.ceil(TOTAL_ACTS / 2)) return { emoji: "🚀", title: "Time-Travel All-Star", blurb: "Made the most of the journey all week long." };
    if (done >= 5)                return { emoji: "⭐", title: "Rising Star", blurb: "Off to a fantastic start at camp." };
    return { emoji: "⏳", title: "Time Travelers Graduate", blurb: "A wonderful week of memories with the cousins." };
  }

  // Claim a unique prize (releasing any prize the camper already held).
  function claimReward(rewardId) {
    if (!state.me) { openCamperModal(); return; }
    if (claimedBy(rewardId)) { toast("Already claimed by another cousin!"); return; }
    const r = rewardById(rewardId);
    if (pointsFor(state.me) < r.cost) { toast(`Need ⭐ ${r.cost} — keep earning!`); return; }
    Store.claim(state.me, rewardId);
  }
  function releaseReward(rewardId) {
    Store.release(rewardId);
  }

  // ---- Camper modal -------------------------------------------------------
  const modal = document.getElementById("camper-modal");
  const camperGrid = document.getElementById("camper-grid");

  function buildCamperGrid() {
    camperGrid.replaceChildren();
    CAMPERS.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "camper-pick" + (c.id === state.me ? " active" : "");
      btn.type = "button";
      btn.innerHTML = `<span class="ce">${c.emoji}</span>${escapeHtml(c.name)}`;
      btn.addEventListener("click", () => {
        state.me = c.id;
        save(LS.me, c.id);
        closeCamperModal();
        updateWhoami();
        toast(`Welcome, ${c.name}! ${c.emoji}`);
        render();
      });
      camperGrid.appendChild(btn);
    });
  }
  function openCamperModal() { buildCamperGrid(); modal.hidden = false; }
  function closeCamperModal() { modal.hidden = true; }
  modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeCamperModal));

  function updateWhoami() {
    const btn = document.getElementById("whoami");
    const me = camperById(state.me);
    btn.querySelector(".whoami-emoji").textContent = me ? me.emoji : "👋";
    btn.querySelector(".whoami-name").textContent = me ? me.name : "Pick camper";
  }
  document.getElementById("whoami").addEventListener("click", openCamperModal);

  // ---- Router -------------------------------------------------------------
  const routes = {
    today: renderToday,
    schedule: renderSchedule,
    photos: renderPhotos,
    awards: renderAwards,
  };

  function render() {
    (routes[state.route] || renderToday)();
    document.querySelectorAll(".tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.route === state.route)
    );
    view.scrollTop = 0;
  }

  function go(route) {
    if (!routes[route]) route = "today";
    state.route = route;
    if (location.hash !== "#" + route) location.hash = route;
    render();
  }

  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => go(tab.dataset.route))
  );
  window.addEventListener("hashchange", () => {
    const r = location.hash.replace("#", "");
    if (routes[r] && r !== state.route) { state.route = r; render(); }
  });

  // ---- Utils --------------------------------------------------------------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  // ---- Boot ---------------------------------------------------------------
  updateWhoami();
  const initial = location.hash.replace("#", "");
  state.route = routes[initial] ? initial : "today";
  render();

  // Shared mode if Firebase is configured; otherwise stay local.
  if (firebaseConfigured()) {
    const savedPass = load(LS.pass, null);
    if (savedPass) startShared(savedPass);
    else showPasscodeGate();
  }

  if (!state.me) setTimeout(openCamperModal, 400);
})();
