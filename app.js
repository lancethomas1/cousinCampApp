/* ============================================================
   Cousin Camp — campers' app (vanilla JS, no build step)
   The shared model lives in core.js (window.CampCore); this file
   is just the campers' views: Today, Schedule, Cheers, Awards.
   Grown-ups hand out kudos & badges from the separate parents
   app (parent.html) — this app only shows what was earned.
   ============================================================ */

(function () {
  "use strict";

  const C = window.CampCore;
  const { CAMPERS, SCHEDULE, KUDOS, CHEERS } = C.data;
  const {
    state, LS, save, Store, setRender, initShared,
    camperById, allActivities, prepActivities, hasPrep, prepKey, prepDoneCount, isPrepared, isDone,
    pointsFor, completedCount, anyFullDay, fullDayCount,
    kudosCountFor, cheersCountFor, cheersGivenBy, recentCheers, giveCheer, parentBadgesFor,
    todayISO, fmtDow, dayNum, fmtLong, toast, escapeHtml, camperFace, timeAgo,
  } = C;
  const view = document.getElementById("view");

  // ---- Activity row markup (shared-iPad kiosk) ---------------------------
  // Every cousin does every activity, so there's no per-kid "check in." Some
  // activities need prep (a.prep) — those become "Get Prepared" cards: each prep
  // item shows a row of cousin faces, and a cousin earns the activity's points
  // once they've ticked every item on their own list. Activities without prep
  // are reference-only (a.info ones render as muted "heads up" cards).
  function activityRow(a, interactive = true) {
    const el = document.createElement("div");
    const prepCard = hasPrep(a);
    el.className = "activity-card" + (prepCard ? " prep" : (a.info ? " info" : ""));

    // Prep cards show the points you can earn; routine slots show a quiet FYI
    // tag; plain reference activities show neither.
    const tag = prepCard
      ? `<span class="activity-points">⭐ ${a.points}</span>`
      : (a.info ? `<span class="activity-info-tag">ℹ️ Heads up</span>` : "");

    const head = document.createElement("div");
    head.className = "activity-head";
    head.innerHTML = `
      <div class="activity-emoji">${a.emoji}</div>
      <div class="activity-body">
        <div class="activity-top">
          <span class="activity-time">${a.time}</span>
          ${tag}
        </div>
        <div class="activity-title">${escapeHtml(a.title)}</div>
        <p class="activity-desc">${escapeHtml(a.desc)}</p>
        <div class="activity-loc">📍 ${escapeHtml(a.location)}</div>
      </div>`;
    el.appendChild(head);

    if (!prepCard) return el;
    // On the Schedule tab cards are read-only — show the prep list as a preview
    // so kids know what to pack ahead of time. Today gets the tappable faces.
    if (!interactive) { el.appendChild(prepPreview(a)); return el; }

    a.prep.forEach((item, i) => {
      const key = prepKey(a.id, i);
      const label = document.createElement("div");
      label.className = "kidrow-label prep-item-label";
      label.textContent = item;
      el.appendChild(label);

      const kidrow = document.createElement("div");
      kidrow.className = "kidrow";
      CAMPERS.forEach((c) => {
        const done = isDone(c.id, key);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "kid-check" + (done ? " done" : "");
        btn.style.setProperty("--kc", c.color);
        btn.setAttribute("aria-pressed", done ? "true" : "false");
        btn.setAttribute("aria-label", `${c.name} — ${item} — ${done ? "not done" : "done"}`);
        btn.innerHTML = `
          <span class="kc-avatar">${camperFace(c, "kc-emoji")}<span class="kc-check">✓</span></span>
          <span class="kc-name">${escapeHtml(c.name)}</span>`;
        btn.addEventListener("click", () => {
          const turningOn = !isDone(c.id, key);
          if (turningOn) {
            // Did this tick finish the whole checklist for this cousin?
            const allReady = a.prep.every((_, j) => j === i || isDone(c.id, prepKey(a.id, j)));
            toast(allReady ? `🎒 ${c.name} is ready! +${a.points}` : `✓ ${c.name}: ${item}`);
          }
          Store.toggle(c.id, key, turningOn);
        });
        kidrow.appendChild(btn);
      });
      el.appendChild(kidrow);
    });
    return el;
  }

  // Read-only prep list shown under prepared cards on the Schedule tab.
  function prepPreview(a) {
    const box = document.createElement("div");
    box.className = "prep-preview";
    box.innerHTML = `<div class="prep-preview-head">🎒 Get prepared</div>` +
      a.prep.map((item) => `<div class="prep-preview-item">▢ ${escapeHtml(item)}</div>`).join("");
    return box;
  }

  // ---- TODAY view ---------------------------------------------------------
  function renderToday() {
    const iso = todayISO();
    const day = SCHEDULE.find((d) => d.date === iso);
    const frag = document.createElement("div");

    // Camp-wide progress: how many cousins are fully prepared across today's
    // prep activities (the ones that earn points). Days with no prep show 0/0.
    const prepToday = day.activities.filter(hasPrep);
    const totalChecks = prepToday.length * CAMPERS.length;
    const doneChecks = prepToday.reduce(
      (s, a) => s + CAMPERS.filter((c) => isPrepared(c.id, a)).length, 0
    );
    const pct = totalChecks ? Math.round((doneChecks / totalChecks) * 100) : 0;

    const hero = document.createElement("div");
    // Start in the correct state for the current scroll position. Setting the
    // class before the hero is inserted means no collapse animation fires on
    // re-renders (e.g. each check-in) — only on an actual scroll past the line.
    hero.className = "hero" + (heroShouldCompact() ? " compact" : "");
    hero.innerHTML = `
      <div class="eyebrow">🚗 Today at Cousin Camp</div>
      <h2>${escapeHtml(day.title)}</h2>
      <p>${day.era ? escapeHtml(day.era) + " · " : ""}${fmtLong(iso)}</p>
      <div class="hero-progress"><span style="width:${pct}%"></span></div>
      <div class="hero-progress-label">${totalChecks
        ? `🎒 Tap your face as you get ready! · ${doneChecks}/${totalChecks} prepped today`
        : `🎉 No prep needed today — just have fun!`}</div>
    `;
    frag.appendChild(hero);

    day.activities.forEach((a) => frag.appendChild(activityRow({ ...a, date: iso })));
    view.replaceChildren(frag);
  }

  // ---- SCHEDULE view ------------------------------------------------------
  // Set while the Schedule view is on screen so the global scroll listener can
  // keep the active day-pill in sync. Other views clear it (the bar detaches).
  let daybar = null; // { bar, pills: Map<iso, el>, blocks: Map<iso, el> }

  function renderSchedule() {
    const today = todayISO();
    const frag = document.createElement("div");
    const head = document.createElement("div");
    head.innerHTML = `<h2 class="view-title">Journey Through Time 🗓️</h2>
      <p class="view-sub">Five days of Cousin Camp — tap a day to jump there.</p>`;
    frag.appendChild(head);

    // Sticky day-pill navigator — one pill per camp day; tap to jump straight
    // to it instead of scrolling past every activity in between.
    const bar = document.createElement("div");
    bar.className = "daybar";
    const pills = new Map();
    const blocks = new Map();
    frag.appendChild(bar);

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
      day.activities.forEach((a) => block.appendChild(activityRow({ ...a, date: day.date }, false)));
      frag.appendChild(block);
      blocks.set(day.date, block);

      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "daypill" + (day.date === today ? " is-today" : "");
      pill.setAttribute("aria-label", fmtLong(day.date));
      pill.innerHTML = `<span class="dp-dow">${fmtDow(day.date)}</span><span class="dp-num">${dayNum(day.date)}</span>`;
      pill.addEventListener("click", () => jumpToDay(day.date));
      bar.appendChild(pill);
      pills.set(day.date, pill);
    });

    view.replaceChildren(frag);
    daybar = { bar, pills, blocks };
    // The bar is now laid out — publish its height so day headers can stick
    // just beneath it (see --daybar-h in styles.css), then mark today active.
    document.documentElement.style.setProperty("--daybar-h", bar.offsetHeight + "px");
    syncActivePill();
  }

  // How far down the viewport the sticky app header + day-pill bar reach.
  function stickyTop() {
    const cs = getComputedStyle(document.documentElement);
    const headerH = parseInt(cs.getPropertyValue("--header-h"), 10) || 64;
    return headerH + (daybar ? daybar.bar.offsetHeight : 0);
  }

  // Tap a pill → scroll so that day's header lands just under the pill bar.
  function jumpToDay(iso) {
    const block = daybar && daybar.blocks.get(iso);
    if (!block) return;
    const top = block.getBoundingClientRect().top + window.scrollY - stickyTop() + 1;
    window.scrollTo({ top, behavior: "smooth" });
  }

  // Highlight the pill for whichever day is currently under the sticky bar.
  function syncActivePill() {
    if (!daybar || !document.body.contains(daybar.bar)) { daybar = null; return; }
    const line = stickyTop() + 8;
    // Default to the first day so there's always an active pill, even at the
    // very top where day one's block still sits below the sticky bar.
    let current = daybar.blocks.keys().next().value;
    daybar.blocks.forEach((block, iso) => {
      if (block.getBoundingClientRect().top <= line) current = iso;
    });
    daybar.pills.forEach((pill, iso) => {
      const on = iso === current;
      pill.classList.toggle("active", on);
      if (on) pill.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  // ---- AWARDS view --------------------------------------------------------
  // Collect, don't compete: every cousin works toward their own badges,
  // claims one unique prize, and earns an Awards Day certificate. Badges
  // earned from activities are shown alongside special honors handed out by
  // grown-ups from the parents app.
  const TOTAL_ACTS = prepActivities().length;
  const BADGES = [
    { id: "cadet",     emoji: "🚀", label: "Time Cadet",      hint: "Get ready for your first activity",          test: (c) => completedCount(c) >= 1 },
    { id: "going",     emoji: "⭐", label: "Getting Going",   hint: "Get ready for 3 activities",                 test: (c) => completedCount(c) >= 3 },
    { id: "dynamo",    emoji: "🌟", label: "Daily Dynamo",    hint: "Get fully prepped for a whole day",          test: (c) => anyFullDay(c) },
    { id: "twoday",    emoji: "📅", label: "Two-Day Trekker", hint: "Get fully prepped for two whole days",       test: (c) => fullDayCount(c) >= 2 },
    { id: "halfway",   emoji: "🎯", label: "Time Traveler",   hint: "Get ready for half the activities",          test: (c) => completedCount(c) >= Math.ceil(TOTAL_ACTS / 2) },
    { id: "champion",  emoji: "👑", label: "Time Champion",   hint: "Get ready for 10 activities",                test: (c) => completedCount(c) >= 10 },
    { id: "master",    emoji: "🎖️", label: "Master of Time",  hint: "Get ready for every single activity",        test: (c) => completedCount(c) >= TOTAL_ACTS },
  ];
  const badgesEarned = (camperId) => BADGES.filter((b) => b.test(camperId));

  function renderAwards() {
    const frag = document.createElement("div");
    const head = document.createElement("div");
    head.innerHTML = `<h2 class="view-title">Camp Awards 🏆</h2>
      <p class="view-sub">Tap a traveler to see their trophies.</p>`;
    frag.appendChild(head);

    // --- Selected cousin's detail (set by tapping the roster below) ---------
    if (state.me && camperById(state.me)) {
      frag.appendChild(buildCousinDetail(camperById(state.me)));
    }

    // --- Camp roster: tap a cousin to view their trophies ------------------
    const roster = document.createElement("div");
    roster.innerHTML = `<h3 class="section-title">🧑‍🚀 The Time Crew</h3>
      <p class="section-note">Tap a cousin to see their trophy case &amp; certificate.</p>`;
    CAMPERS.forEach((c) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "roster-row" + (c.id === state.me ? " me" : "");
      row.innerHTML = `
        <div class="lb-avatar" style="background:${c.color}22">${camperFace(c)}</div>
        <div class="ros-name">${escapeHtml(c.name)}
          <small>${c.parents ? "👪 " + escapeHtml(c.parents) + " · " : ""}${badgesEarned(c.id).length + parentBadgesFor(c.id).length} badges</small></div>
        <div class="ros-pts">⭐ ${pointsFor(c.id)}</div>`;
      row.addEventListener("click", () => {
        state.me = c.id; save(LS.me, c.id); updateWhoami(); render();
        requestAnimationFrame(() =>
          document.getElementById("cousin-detail")?.scrollIntoView({ behavior: "smooth", block: "start" })
        );
      });
      roster.appendChild(row);
    });
    frag.appendChild(roster);

    view.replaceChildren(frag);
  }

  // The per-cousin detail shown when a cousin is tapped in the roster.
  function buildCousinDetail(me) {
    const wrap = document.createElement("div");
    wrap.id = "cousin-detail";
    const myBadges = badgesEarned(me.id);
    const myParentBadges = parentBadgesFor(me.id);

    const card = document.createElement("div");
    card.className = "camp-card";
    card.style.setProperty("--cc", me.color);
    card.innerHTML = `
      <div class="cc-avatar">${camperFace(me)}</div>
      <div class="cc-info">
        <div class="cc-name">${escapeHtml(me.name)}</div>
        <div class="cc-sub">Cousin Camp Time Traveler</div>
        <div class="cc-stats">
          <div class="cc-stat"><b>${pointsFor(me.id)}</b><span>points</span></div>
          <div class="cc-stat"><b>${kudosCountFor(me.id)}</b><span>kudos</span></div>
          <div class="cc-stat"><b>${myBadges.length + myParentBadges.length}</b><span>badges</span></div>
        </div>
      </div>`;
    wrap.appendChild(card);

    const trophy = document.createElement("div");
    trophy.innerHTML = `<h3 class="section-title">🏆 ${escapeHtml(me.name)}'s Trophy Case</h3>
      <p class="section-note">${myBadges.length} of ${BADGES.length} badges earned${myBadges.length === BADGES.length ? " — every one! 🎉" : ""}</p>`;
    const tcGrid = document.createElement("div");
    tcGrid.className = "trophy-grid";
    BADGES.forEach((b) => {
      const got = b.test(me.id);
      const t = document.createElement("div");
      t.className = "trophy" + (got ? " got" : " locked");
      t.innerHTML = `
        <div class="tr-emoji">${got ? b.emoji : "🔒"}</div>
        <div class="tr-label">${escapeHtml(b.label)}</div>
        <div class="tr-hint">${got ? "Earned!" : escapeHtml(b.hint)}</div>`;
      tcGrid.appendChild(t);
    });
    trophy.appendChild(tcGrid);
    wrap.appendChild(trophy);

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
      wrap.appendChild(honors);
    }

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
    wrap.appendChild(certWrap);

    return wrap;
  }

  // Build a printable certificate card with a fun superlative.
  function buildCertificate(camper) {
    const badgeCount = badgesEarned(camper.id).length + parentBadgesFor(camper.id).length;
    const superl = pickSuperlative(camper.id);
    const cert = document.createElement("div");
    cert.className = "certificate";
    cert.innerHTML = `
      <div class="cert-top">🚗 Cousin Camp 2026 🚗</div>
      <div class="cert-award">Time Machine Travelers · Official Certificate</div>
      <div class="cert-name">${escapeHtml(camper.name)}</div>
      <div class="cert-title">${superl.emoji} ${escapeHtml(superl.title)}</div>
      <p class="cert-blurb">${escapeHtml(superl.blurb)}</p>
      <div class="cert-stats">
        <span>🎯 ${completedCount(camper.id)} prepped</span>
        <span>🏅 ${badgeCount} badges</span>
        <span>⭐ ${pointsFor(camper.id)} points</span>
      </div>
      <div class="cert-sign">With love,<br><span>Mimi 👵</span></div>`;
    return cert;
  }

  // Pick a celebratory superlative based on what the camper did most.
  function pickSuperlative(camperId) {
    const done = completedCount(camperId);
    if (done >= TOTAL_ACTS)        return { emoji: "🎖️", title: "Master of All Time", blurb: "Got ready for every single thing at camp. Mimi is amazed!" };
    if (done >= 10)               return { emoji: "👑", title: "Time Champion", blurb: "A true champion of Cousin Camp." };
    if (fullDayCount(camperId) >= 2) return { emoji: "🌟", title: "All-Day Adventurer", blurb: "Jumped into camp from sunup to sundown." };
    if (done >= Math.ceil(TOTAL_ACTS / 2)) return { emoji: "🚀", title: "Time-Travel All-Star", blurb: "Made the most of the journey all week long." };
    if (done >= 3)                return { emoji: "⭐", title: "Rising Star", blurb: "Off to a fantastic start at camp." };
    return { emoji: "⏳", title: "Time Travelers Graduate", blurb: "A wonderful week of memories with the cousins." };
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
      btn.innerHTML = `${camperFace(c, "ce")}${escapeHtml(c.name)}`;
      btn.addEventListener("click", () => {
        state.me = c.id;
        save(LS.me, c.id);
        closeCamperModal();
        updateWhoami();
        toast(`Welcome aboard, ${c.name}! ${c.emoji}`);
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
    btn.querySelector(".whoami-emoji").innerHTML = me ? camperFace(me) : "👋";
    btn.querySelector(".whoami-name").textContent = me ? me.name : "Pick traveler";
  }
  document.getElementById("whoami").addEventListener("click", openCamperModal);

  // ---- CAMP CHEERS view (a friendly, non-competitive crew board) ----------
  // A "leaderboard" that doesn't rank anyone: it celebrates the whole crew's
  // progress together, then shows each traveler's stats side by side, ranked
  // by points from highest to lowest.
  function renderCheers() {
    const frag = document.createElement("div");
    const head = document.createElement("div");
    head.innerHTML = `<h2 class="view-title">Crew Cheers 🎉</h2>
      <p class="view-sub">Cheering on every traveler across the timeline — the whole crew counts!</p>`;
    frag.appendChild(head);

    // Crew totals — what we've all done together this week.
    const crewPoints = CAMPERS.reduce((s, c) => s + pointsFor(c.id), 0);
    const crewBadges = CAMPERS.reduce((s, c) => s + badgesEarned(c.id).length + parentBadgesFor(c.id).length, 0);
    const crewCheers = CAMPERS.reduce((s, c) => s + cheersCountFor(c.id), 0);

    const totals = document.createElement("div");
    totals.className = "camp-card";
    totals.innerHTML = `
      <div class="cc-avatar">🚀</div>
      <div class="cc-info">
        <div class="cc-name">The Whole Crew</div>
        <div class="cc-sub">${CAMPERS.length} time travelers, all in it together</div>
        <div class="cc-stats">
          <div class="cc-stat"><b>${crewPoints}</b><span>points earned</span></div>
          <div class="cc-stat"><b>${crewBadges}</b><span>badges</span></div>
          <div class="cc-stat"><b>${crewCheers}</b><span>cheers 👏</span></div>
        </div>
      </div>`;
    frag.appendChild(totals);

    // Everyone's board — ranked by points, highest to lowest (ties broken by name).
    const me = camperById(state.me);
    const board = document.createElement("div");
    board.innerHTML = `<h3 class="section-title">🌟 Our Time Travelers</h3>
      <p class="section-note">${me
        ? `Tap a cousin to send them a cheer 👏 — tap your own row to switch travelers.`
        : `Tap your face up top to pick your traveler, then cheer on your cousins! 👏`}</p>`;
    [...CAMPERS].sort((a, b) => pointsFor(b.id) - pointsFor(a.id) || a.name.localeCompare(b.name)).forEach((c) => {
      const badges = badgesEarned(c.id).length + parentBadgesFor(c.id).length;
      const isMe = c.id === state.me;
      const row = document.createElement("button");
      row.type = "button";
      row.className = "roster-row" + (isMe ? " me" : "");
      row.innerHTML = `
        <div class="lb-avatar" style="background:${c.color}22">${camperFace(c)}</div>
        <div class="ros-name">${escapeHtml(c.name)}${isMe ? ` <span class="ros-you">you</span>` : ""}
          <small>${badges} badges · 👏 ${cheersCountFor(c.id)} got · ${cheersGivenBy(c.id)} gave</small></div>
        <div class="ros-pts">⭐ ${pointsFor(c.id)}</div>`;
      // Tap a cousin to cheer them; tap yourself (or with no traveler set) to
      // open the traveler picker instead.
      row.addEventListener("click", () => {
        if (isMe || !me) { openCamperModal(); return; }
        openCheerPicker(c);
      });
      board.appendChild(row);
    });
    frag.appendChild(board);

    // Recent cheers — who's been cheering whom across camp (newest first).
    const feedWrap = document.createElement("div");
    feedWrap.innerHTML = `<h3 class="section-title">👏 Recent Cheers</h3>`;
    const cheers = recentCheers(15);
    if (cheers.length === 0) {
      feedWrap.innerHTML += `<p class="section-note">No cheers yet — tap a cousin above to send the first one! 🎉</p>`;
    } else {
      const list = document.createElement("div");
      list.className = "award-feed";
      cheers.forEach((ch) => {
        const from = camperById(ch.from), to = camperById(ch.to);
        if (!from || !to) return;
        const row = document.createElement("div");
        row.className = "feed-row";
        row.innerHTML = `
          ${camperFace(from, "fr-emoji")}
          <div class="fr-body">
            <div class="fr-label">${escapeHtml(from.name)} cheered ${escapeHtml(to.name)} ${ch.emoji}${ch.reason ? ` — "${escapeHtml(ch.reason)}"` : ""}</div>
            <div class="fr-time">${escapeHtml(ch.label)} · ${timeAgo(ch.ts)}</div>
          </div>`;
        list.appendChild(row);
      });
      feedWrap.appendChild(list);
    }
    frag.appendChild(feedWrap);

    view.replaceChildren(frag);
  }

  // Cousin-to-cousin cheer: pick a cheer card to send to `toCamper` from the
  // active traveler. Cheers are recognition only — they add 0 points — so the
  // cards show no point value here.
  function openCheerPicker(toCamper) {
    const me = camperById(state.me);
    if (!me) { toast("Pick your traveler first! 👆"); openCamperModal(); return; }
    if (me.id === toCamper.id) { openCamperModal(); return; }
    const overlay = document.createElement("div");
    overlay.className = "modal";
    overlay.innerHTML = `
      <div class="modal-backdrop" data-close></div>
      <div class="modal-card" role="dialog" aria-modal="true">
        <h2>${toCamper.emoji} Cheer ${escapeHtml(toCamper.name)}!</h2>
        <p class="modal-sub">From ${escapeHtml(me.name)} — tap a cheer to send it. Cheers are just for fun, no points. 🎉</p>
        <div class="kudos-grid"></div>
        <button class="btn-ghost" type="button" data-close>Close</button>
      </div>`;
    const grid = overlay.querySelector(".kudos-grid");
    // The full deck — playful cheers first, then the kudos cards — so cousins
    // can send any of them (always as 0-point recognition).
    CHEERS.concat(KUDOS).forEach((k) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "kudos-tile";
      tile.innerHTML = `
        <div class="kt-emoji">${k.emoji}</div>
        <div class="kt-label">${escapeHtml(k.label)}</div>
        <div class="kt-desc">${escapeHtml(k.desc)}</div>`;
      tile.addEventListener("click", () => { giveCheer(me.id, toCamper.id, k.id); close(); });
      grid.appendChild(tile);
    });
    function close() { overlay.remove(); }
    overlay.querySelectorAll("[data-close]").forEach((e) => e.addEventListener("click", close));
    document.body.appendChild(overlay);
  }

  // ---- Router -------------------------------------------------------------
  const routes = {
    today: renderToday,
    schedule: renderSchedule,
    cheers: renderCheers,
    awards: renderAwards,
  };

  function render() {
    (routes[state.route] || renderToday)();
    document.querySelectorAll(".tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.route === state.route)
    );
    // Note: don't reset scroll here — render() also runs on data updates
    // (e.g. checking in a kid), and we want to stay put on the tapped item.
    // Scroll-to-top happens only on route changes (see go()/hashchange).
    syncStickyHero();
  }

  // Jump back to the top and re-evaluate the sticky hero — used on route
  // changes so a new tab always starts at the top with the hero expanded.
  function resetScroll() {
    view.scrollTop = 0;
    window.scrollTo(0, 0);
    syncStickyHero();
    syncActivePill();
  }

  // ---- Sticky "Today" hero ------------------------------------------------
  // The hero ("Today at Cousin Camp") is pinned beneath the app header via
  // CSS. We feed it the header's live height and, once the page scrolls,
  // collapse it so the prep-progress bar becomes the primary element on top.
  const appHeader = document.querySelector(".app-header");
  function syncHeaderHeight() {
    if (appHeader) {
      document.documentElement.style.setProperty("--header-h", appHeader.offsetHeight + "px");
    }
  }
  // True once the page has scrolled far enough to collapse the hero down to
  // its prep-progress bar.
  function heroShouldCompact() { return window.scrollY > 24; }
  function syncStickyHero() {
    const hero = view.querySelector(".hero");
    if (hero) hero.classList.toggle("compact", heroShouldCompact());
  }

  function go(route) {
    if (!routes[route]) route = "today";
    state.route = route;
    if (location.hash !== "#" + route) location.hash = route;
    render();
    resetScroll();
  }

  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => go(tab.dataset.route))
  );
  window.addEventListener("hashchange", () => {
    const r = location.hash.replace("#", "");
    if (routes[r] && r !== state.route) { state.route = r; render(); resetScroll(); }
  });

  // ---- Boot ---------------------------------------------------------------
  window.addEventListener("scroll", () => { syncStickyHero(); syncActivePill(); }, { passive: true });
  window.addEventListener("resize", () => {
    syncHeaderHeight();
    syncStickyHero();
    if (daybar) document.documentElement.style.setProperty("--daybar-h", daybar.bar.offsetHeight + "px");
    syncActivePill();
  });
  syncHeaderHeight();

  setRender(render);
  updateWhoami();
  const initial = location.hash.replace("#", "");
  state.route = routes[initial] ? initial : "today";
  render();
  initShared();            // join the shared camp (or stay local)
})();
