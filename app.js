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
  const { CAMPERS, SCHEDULE, STORE, KUDOS, PHOTO_ALBUM_URL } = C.data;
  const {
    state, LS, save, Store, Photos, setRender, initShared,
    camperById, allActivities, isDone,
    pointsFor, balanceFor, completedCount, anyFullDay, fullDayCount,
    rewardById, claimedBy, claimOf,
    kudosCountFor, cheersCountFor, giveCheer, parentBadgesFor,
    todayISO, fmtDow, dayNum, fmtLong, toast, escapeHtml, camperFace,
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

    const label = document.createElement("div");
    label.className = "kidrow-label";
    label.textContent = "Who checked in?";
    el.appendChild(label);

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
        <span class="kc-avatar">${camperFace(c, "kc-emoji")}<span class="kc-check">✓</span></span>
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
      <div class="eyebrow">🚂 Today at Cousin Camp</div>
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

  // ---- Import from Google Photos (Picker API) -----------------------------
  // The only sanctioned way to read someone's Google Photos: they pick photos
  // in Google's picker, we download the picks and store them in our gallery.
  // Requires an OAuth Web client id (GOOGLE_PICKER.clientId) + Firebase Storage.
  const PICKER_SCOPE = "https://www.googleapis.com/auth/photospicker.mediaitems.readonly";
  const pickerCfg = () => window.GOOGLE_PICKER || {};
  function pickerAvailable() {
    return Photos.enabled() && !!pickerCfg().clientId &&
      !!(window.google && google.accounts && google.accounts.oauth2);
  }
  function parseSeconds(v) {
    const m = v && String(v).match(/([\d.]+)s/);
    return m ? Math.round(parseFloat(m[1]) * 1000) : 0;
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Get a short-lived access token for the picker scope (popup, user gesture).
  function getPickerToken() {
    return new Promise((resolve, reject) => {
      try {
        const tc = google.accounts.oauth2.initTokenClient({
          client_id: pickerCfg().clientId,
          scope: PICKER_SCOPE,
          callback: (resp) => (resp && resp.access_token) ? resolve(resp.access_token) : reject(new Error("no token")),
          error_callback: (err) => reject(err || new Error("oauth error")),
        });
        tc.requestAccessToken();
      } catch (e) { reject(e); }
    });
  }
  async function pickerApi(path, token, opts) {
    const res = await fetch("https://photospicker.googleapis.com/v1/" + path, {
      method: (opts && opts.method) || "GET",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: (opts && opts.body) ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) throw new Error("Picker API " + res.status);
    return res.status === 204 ? {} : res.json();
  }

  async function importFromGooglePhotos(btn) {
    // Pre-open a tab during the click gesture so the picker isn't popup-blocked.
    const pickerWin = window.open("", "_blank");
    let token;
    try { token = await getPickerToken(); }
    catch (e) { if (pickerWin) pickerWin.close(); toast("Google sign-in cancelled"); return; }

    btn.disabled = true;
    const label = btn.innerHTML;
    try {
      btn.innerHTML = "⏳ Opening Google Photos…";
      const session = await pickerApi("sessions", token, { method: "POST", body: {} });
      if (pickerWin) pickerWin.location.href = session.pickerUri;
      else window.open(session.pickerUri, "_blank");
      toast("Pick your photos in the Google Photos tab…");

      const interval = parseSeconds(session.pollingConfig && session.pollingConfig.pollInterval) || 4000;
      const timeoutMs = parseSeconds(session.pollingConfig && session.pollingConfig.timeoutIn) || 5 * 60 * 1000;
      const start = Date.now();
      let ready = false;
      while (Date.now() - start < timeoutMs) {
        await sleep(Math.max(2000, interval));
        const s = await pickerApi("sessions/" + session.id, token);
        if (s.mediaItemsSet) { ready = true; break; }
      }
      if (!ready) { toast("No photos picked — try again"); return; }

      btn.innerHTML = "⬇️ Importing…";
      const items = [];
      let pageToken = "";
      do {
        const q = "mediaItems?sessionId=" + encodeURIComponent(session.id) + "&pageSize=100" +
          (pageToken ? "&pageToken=" + encodeURIComponent(pageToken) : "");
        const page = await pickerApi(q, token);
        (page.mediaItems || []).forEach((m) => items.push(m));
        pageToken = page.nextPageToken || "";
      } while (pageToken);

      let ok = 0;
      for (const m of items) {
        const mf = m.mediaFile || {};
        if (!mf.baseUrl || (mf.mimeType && !mf.mimeType.startsWith("image/"))) continue;
        try {
          const resp = await fetch(mf.baseUrl + "=d", { headers: { Authorization: "Bearer " + token } });
          if (!resp.ok) throw new Error("download " + resp.status);
          if (await Photos.add(await resp.blob())) ok++;
        } catch (e) { console.error("import item failed (likely CORS — needs a proxy)", e); }
      }
      try { await pickerApi("sessions/" + session.id, token, { method: "DELETE" }); } catch (_) {}
      toast(ok ? `Imported ${ok} photo${ok > 1 ? "s" : ""} 📥` : "Couldn't download picks — see console (may need a proxy)");
    } catch (e) {
      console.error("Google Photos import failed", e);
      toast("Import failed — check setup / console");
    } finally {
      btn.disabled = false; btn.innerHTML = label;
    }
  }

  // ---- PHOTOS view --------------------------------------------------------
  // A live, shared in-app gallery (Firebase Storage). Everyone's photos stream
  // in here. The Google Photos album link stays as a backup.
  function renderPhotos() {
    const url = (PHOTO_ALBUM_URL || "").trim();
    const frag = document.createElement("div");
    const head = document.createElement("div");
    head.innerHTML = `<h2 class="view-title">Snapshots in Time 📸</h2>
      <p class="view-sub">Every moment from our trip through the eras — shared live with the crew.</p>`;
    frag.appendChild(head);

    // Add-photo button (uploads into the shared gallery).
    if (Photos.enabled()) {
      const bar = document.createElement("div");
      bar.className = "photo-toolbar";
      const addBtn = document.createElement("button");
      addBtn.className = "btn album-btn";
      addBtn.innerHTML = "➕ Add photos";
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.hidden = true;
      addBtn.addEventListener("click", () => input.click());
      input.addEventListener("change", async (e) => {
        const files = e.target.files;
        if (!files || !files.length) return;
        addBtn.disabled = true;
        addBtn.innerHTML = "⏳ Uploading…";
        toast(`Uploading ${files.length} photo${files.length > 1 ? "s" : ""}…`);
        await Photos.addMany(files);
        input.value = "";
        addBtn.disabled = false;
        addBtn.innerHTML = "➕ Add photos";
        // gallery refreshes itself via the live snapshot
      });
      bar.append(addBtn, input);

      // Optional: import existing pictures straight from Google Photos.
      if (pickerAvailable()) {
        const importBtn = document.createElement("button");
        importBtn.className = "btn-ghost";
        importBtn.type = "button";
        importBtn.innerHTML = "📥 Import from Google Photos";
        importBtn.addEventListener("click", () => importFromGooglePhotos(importBtn));
        bar.append(importBtn);
      }

      frag.appendChild(bar);
    }

    // The live grid.
    const photos = Photos.list();
    if (photos.length) {
      const grid = document.createElement("div");
      grid.className = "gallery-grid";
      photos.forEach((p) => {
        const cell = document.createElement("div");
        cell.className = "gallery-item";
        cell.innerHTML = `<img src="${p.url}" alt="Camp photo" loading="lazy">`;
        const a = cell.querySelector("img");
        a.addEventListener("click", () => window.open(p.url, "_blank", "noopener"));
        if (Photos.enabled()) {
          const del = document.createElement("button");
          del.className = "gallery-del";
          del.type = "button";
          del.setAttribute("aria-label", "Remove photo");
          del.textContent = "✕";
          del.addEventListener("click", (ev) => {
            ev.stopPropagation();
            if (confirm("Remove this photo for everyone?")) Photos.remove(p);
          });
          cell.appendChild(del);
        }
        grid.appendChild(cell);
      });
      frag.appendChild(grid);
    } else {
      const empty = document.createElement("div");
      empty.className = "card album-card";
      if (Photos.enabled()) {
        empty.innerHTML = `<div class="album-emoji">📷</div>
          <h3>No photos yet</h3>
          <p>Tap <b>Add photos</b> to share the first snapshots — they'll stream in here for the whole crew.</p>`;
      } else {
        empty.innerHTML = `<div class="album-emoji">📷</div>
          <h3>Shared gallery is warming up</h3>
          <p>In-app photo sharing turns on once the camp is connected (and Firebase Storage is enabled). Until then, use the album link below.</p>`;
      }
      frag.appendChild(empty);
    }

    // Google Photos album backup link.
    if (url) {
      const albumWrap = document.createElement("div");
      albumWrap.style.marginTop = "16px";
      albumWrap.style.textAlign = "center";
      const a = document.createElement("a");
      a.className = "btn-ghost";
      a.href = url; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = "🖼️ Open the Google Photos album";
      albumWrap.appendChild(a);
      frag.appendChild(albumWrap);
    }

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
      <p class="view-sub">Tap a prize to claim it · tap a traveler to see their trophies.</p>`;
    frag.appendChild(head);

    // --- Camp Store: tap a prize, then tap who's claiming it ----------------
    const storeSection = document.createElement("div");
    storeSection.innerHTML = `<h3 class="section-title">🏪 Camp Store — Pick Your Prize</h3>
      <p class="section-note">Each prize goes to just one cousin. Tap a prize, then tap whose it is.</p>`;
    const storeGrid = document.createElement("div");
    storeGrid.className = "store-grid";
    STORE.forEach((r) => {
      const owner = claimedBy(r.id);
      const ownerCamper = owner ? camperById(owner) : null;
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "store-tile" + (owner ? " claimed" : "");
      tile.innerHTML = `
        <div class="st-emoji">${r.emoji}</div>
        <div class="st-name">${escapeHtml(r.name)}</div>
        <div class="st-desc">${escapeHtml(r.desc)}</div>
        <div class="st-foot">
          ${owner
            ? `<span class="st-owner">${ownerCamper.emoji} ${escapeHtml(ownerCamper.name)} · tap to release</span>`
            : `<span class="st-cost">⭐ ${r.cost}</span>`}
        </div>`;
      tile.addEventListener("click", () =>
        owner ? openReleaseConfirm(r, ownerCamper) : openClaimPicker(r)
      );
      storeGrid.appendChild(tile);
    });
    storeSection.appendChild(storeGrid);
    frag.appendChild(storeSection);

    // --- Selected cousin's detail (set by tapping the roster below) ---------
    if (state.me && camperById(state.me)) {
      frag.appendChild(buildCousinDetail(camperById(state.me)));
    }

    // --- Camp roster: tap a cousin to view their trophies ------------------
    const roster = document.createElement("div");
    roster.innerHTML = `<h3 class="section-title">🧑‍🚀 The Time Crew</h3>
      <p class="section-note">Tap a cousin to see their trophy case &amp; certificate.</p>`;
    CAMPERS.forEach((c) => {
      const r = claimOf(c.id);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "roster-row" + (c.id === state.me ? " me" : "");
      row.innerHTML = `
        <div class="lb-avatar" style="background:${c.color}22">${camperFace(c)}</div>
        <div class="ros-name">${escapeHtml(c.name)}
          <small>${c.parents ? "👪 " + escapeHtml(c.parents) + " · " : ""}${badgesEarned(c.id).length + parentBadgesFor(c.id).length} badges · ${r ? r.emoji + " " + escapeHtml(r.name) : "no prize yet"}</small></div>
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
          <div class="cc-stat"><b>${balanceFor(me.id)}</b><span>points to spend</span></div>
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
    const reward = claimOf(camper.id);
    const superl = pickSuperlative(camper.id);
    const cert = document.createElement("div");
    cert.className = "certificate";
    cert.innerHTML = `
      <div class="cert-top">🚂 Cousin Camp 2026 🚂</div>
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

  // Kiosk claim: tap a prize, then tap which cousin is claiming it.
  function openClaimPicker(prize) {
    const overlay = document.createElement("div");
    overlay.className = "modal";
    overlay.innerHTML = `
      <div class="modal-backdrop" data-close></div>
      <div class="modal-card" role="dialog" aria-modal="true">
        <h2>${prize.emoji} ${escapeHtml(prize.name)}</h2>
        <p class="modal-sub">Costs ⭐ ${prize.cost} — tap who's claiming it.</p>
        <div class="camper-grid"></div>
        <button class="btn-ghost" type="button" data-close>Close</button>
      </div>`;
    const grid = overlay.querySelector(".camper-grid");
    CAMPERS.forEach((c) => {
      const has = claimOf(c.id);
      const afford = pointsFor(c.id) >= prize.cost;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "camper-pick" + (afford ? "" : " disabled");
      btn.disabled = !afford;
      btn.innerHTML = `${camperFace(c, "ce")}${escapeHtml(c.name)}` +
        `<small class="cp-pts">⭐ ${pointsFor(c.id)}${has ? " · has " + has.emoji : afford ? "" : " · need more"}</small>`;
      if (afford) btn.addEventListener("click", () => { Store.claim(c.id, prize.id); close(); });
      grid.appendChild(btn);
    });
    function close() { overlay.remove(); }
    overlay.querySelectorAll("[data-close]").forEach((e) => e.addEventListener("click", close));
    document.body.appendChild(overlay);
  }

  // Tap a claimed prize to release it back to the store.
  function openReleaseConfirm(prize, ownerCamper) {
    const overlay = document.createElement("div");
    overlay.className = "modal";
    overlay.innerHTML = `
      <div class="modal-backdrop" data-close></div>
      <div class="modal-card" role="dialog" aria-modal="true">
        <h2>${prize.emoji} ${escapeHtml(prize.name)}</h2>
        <p class="modal-sub">Claimed by ${ownerCamper.emoji} ${escapeHtml(ownerCamper.name)}. Release it so another cousin can claim it?</p>
        <button class="btn" type="button" id="rel-go" style="width:100%;justify-content:center">Release prize</button>
        <button class="btn-ghost" type="button" data-close style="margin-top:8px;width:100%">Keep it</button>
      </div>`;
    function close() { overlay.remove(); }
    overlay.querySelector("#rel-go").addEventListener("click", () => { Store.release(prize.id); close(); });
    overlay.querySelectorAll("[data-close]").forEach((e) => e.addEventListener("click", close));
    document.body.appendChild(overlay);
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
    const crewPrizes = CAMPERS.filter((c) => claimOf(c.id)).length;

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
          <div class="cc-stat"><b>${crewPrizes}</b><span>prizes</span></div>
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
          <small>${badges} badges · 👏 ${cheersCountFor(c.id)} cheers</small></div>
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

    view.replaceChildren(frag);
  }

  // Cousin-to-cousin cheer: pick a kudos card to send to `toCamper` from the
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
    KUDOS.forEach((k) => {
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
    photos: renderPhotos,
    cheers: renderCheers,
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
})();
