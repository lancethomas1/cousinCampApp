/* ============================================================
   Cousin Camp — campers' app (vanilla JS, no build step)
   The shared model lives in core.js (window.CampCore); this file
   is just the campers' views: Today, Schedule, Photos, Awards.
   Grown-ups hand out kudos & badges from the separate parents
   app (parent.html) — this app only shows what was earned.
   ============================================================ */

(function () {
  "use strict";

  const C = window.CampCore;
  const { CAMPERS, SCHEDULE, STORE, PHOTO_ALBUM_URL } = C.data;
  const {
    state, LS, save, Store, setRender, initShared,
    camperById, allActivities, isDone,
    pointsFor, balanceFor, completedCount, anyFullDay, fullDayCount,
    rewardById, claimedBy, claimOf,
    kudosCountFor, parentBadgesFor,
    todayISO, fmtDow, dayNum, fmtLong, toast, escapeHtml,
  } = C;
  const view = document.getElementById("view");

  // ---- Activity row markup (shared-iPad kiosk) ---------------------------
  // Each activity shows every cousin's face. A kid taps their own face to
  // check in (tap again to undo) — no "who am I" switching needed, so the
  // whole crew can share one iPad.
  function activityRow(a) {
    const el = document.createElement("div");
    el.className = "activity-card";

    const head = document.createElement("div");
    head.className = "activity-head";
    head.innerHTML = `
      <div class="activity-emoji">${a.emoji}</div>
      <div class="activity-body">
        <div class="activity-top">
          <span class="activity-time">${a.time}</span>
          <span class="activity-points">⭐ ${a.points}</span>
        </div>
        <div class="activity-title">${escapeHtml(a.title)}</div>
        <p class="activity-desc">${escapeHtml(a.desc)}</p>
        <div class="activity-loc">📍 ${escapeHtml(a.location)}</div>
      </div>`;
    el.appendChild(head);

    const kidrow = document.createElement("div");
    kidrow.className = "kidrow";
    CAMPERS.forEach((c) => {
      const done = isDone(c.id, a.id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "kid-check" + (done ? " done" : "");
      btn.style.setProperty("--kc", c.color);
      btn.setAttribute("aria-pressed", done ? "true" : "false");
      btn.setAttribute("aria-label", `Mark ${c.name} ${done ? "not done" : "done"} for ${a.title}`);
      btn.innerHTML = `
        <span class="kc-avatar"><span class="kc-emoji">${c.emoji}</span><span class="kc-check">✓</span></span>
        <span class="kc-name">${escapeHtml(c.name)}</span>`;
      btn.addEventListener("click", () => {
        const turningOn = !isDone(c.id, a.id);
        if (turningOn) toast(`+${a.points} ${c.name} ✅`);
        Store.toggle(c.id, a.id, turningOn);
      });
      kidrow.appendChild(btn);
    });
    el.appendChild(kidrow);
    return el;
  }

  // ---- TODAY view ---------------------------------------------------------
  function renderToday() {
    const iso = todayISO();
    const day = SCHEDULE.find((d) => d.date === iso);
    const frag = document.createElement("div");

    // Camp-wide progress: every cousin's check-off across today's activities.
    const totalChecks = day.activities.length * CAMPERS.length;
    const doneChecks = day.activities.reduce(
      (s, a) => s + CAMPERS.filter((c) => isDone(c.id, a.id)).length, 0
    );
    const pct = totalChecks ? Math.round((doneChecks / totalChecks) * 100) : 0;

    const hero = document.createElement("div");
    hero.className = "hero";
    hero.innerHTML = `
      <div class="eyebrow">🕰️ Today at Cousin Camp</div>
      <h2>${escapeHtml(day.title)}</h2>
      <p>${day.era ? escapeHtml(day.era) + " · " : ""}${fmtLong(iso)}</p>
      <div class="hero-progress"><span style="width:${pct}%"></span></div>
      <div class="hero-progress-label">👇 Tap your face to check in! · ${doneChecks}/${totalChecks} done today</div>
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
      <p class="view-sub">Five days of Cousin Camp — tap your face to check in!</p>`;
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
  // claims one unique prize, and earns an Awards Day certificate. Badges
  // earned from activities are shown alongside special honors handed out by
  // grown-ups from the parents app.
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
    const myParentBadges = parentBadgesFor(state.me);
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
          <div class="cc-stat"><b>${kudosCountFor(state.me)}</b><span>kudos</span></div>
          <div class="cc-stat"><b>${myBadges.length + myParentBadges.length}</b><span>badges</span></div>
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

    // --- Special honors handed out by grown-ups (from the parents app) -----
    if (myParentBadges.length) {
      const honors = document.createElement("div");
      honors.innerHTML = `<h3 class="section-title">🎖️ Special Honors</h3>
        <p class="section-note">Awarded to ${escapeHtml(me.name)} by Mimi &amp; the grown-ups.</p>`;
      const hGrid = document.createElement("div");
      hGrid.className = "trophy-grid";
      myParentBadges.forEach((b) => {
        const t = document.createElement("div");
        t.className = "trophy got";
        t.innerHTML = `
          <div class="tr-emoji">${b.emoji}</div>
          <div class="tr-label">${escapeHtml(b.label)}</div>
          <div class="tr-hint">${escapeHtml(b.desc)}</div>`;
        hGrid.appendChild(t);
      });
      honors.appendChild(hGrid);
      frag.appendChild(honors);
    }

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
          <small>${c.parents ? "👪 " + escapeHtml(c.parents) + " · " : ""}${badgesEarned(c.id).length + parentBadgesFor(c.id).length} badges · ${r ? r.emoji + " " + escapeHtml(r.name) : "no prize yet"}</small></div>
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
    const badgeCount = badgesEarned(camper.id).length + parentBadgesFor(camper.id).length;
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
        <span>🏅 ${badgeCount} badges</span>
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
  function releaseReward(rewardId) { Store.release(rewardId); }

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

  // ---- Boot ---------------------------------------------------------------
  setRender(render);
  updateWhoami();
  const initial = location.hash.replace("#", "");
  state.route = routes[initial] ? initial : "today";
  render();
  initShared();            // join the shared camp (or stay local)
  if (!state.me) setTimeout(openCamperModal, 400);
})();
