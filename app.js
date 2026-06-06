/* ============================================================
   Cousin Camp — app logic (vanilla JS, no build step)
   State is stored in localStorage so it survives reloads.
   ============================================================ */

(function () {
  "use strict";

  const { CAMPERS, SCHEDULE, STORE } = window.CAMP_DATA;
  const view = document.getElementById("view");

  // ---- Storage helpers ----------------------------------------------------
  const LS = {
    me: "cc.me",                 // current camper id
    done: "cc.done",             // { camperId: { activityId: true } }
    photos: "cc.photos",         // [ { id, date, src, camper } ]
    claims: "cc.claims",         // { rewardId: camperId } — one prize per camper
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
    photos: load(LS.photos, []),
    claims: load(LS.claims, {}),
    route: "today",
    photoFilter: "all",
  };

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
    const dm = { ...doneMap(state.me) };
    if (dm[activityId]) {
      delete dm[activityId];
    } else {
      dm[activityId] = true;
      toast(`+${points} pts — ${title} ✅`);
    }
    state.done = { ...state.done, [state.me]: dm };
    save(LS.done, state.done);
    render();
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
      <div class="eyebrow">🕰️ Today the machine lands in…</div>
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
  function renderPhotos() {
    const frag = document.createElement("div");
    const head = document.createElement("div");
    head.innerHTML = `<h2 class="view-title">Camp Photos 📸</h2>
      <p class="view-sub">Share the memories from each day.</p>`;
    frag.appendChild(head);

    // Toolbar: add + filter
    const toolbar = document.createElement("div");
    toolbar.className = "photo-toolbar";

    const addBtn = document.createElement("button");
    addBtn.className = "btn";
    addBtn.innerHTML = "➕ Add photos";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = true;
    fileInput.hidden = true;
    addBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => handlePhotoFiles(e.target.files));

    const filter = document.createElement("select");
    filter.className = "day-filter";
    filter.innerHTML =
      `<option value="all">All days</option>` +
      SCHEDULE.map((d) => `<option value="${d.date}" ${state.photoFilter === d.date ? "selected" : ""}>${fmtDow(d.date)} ${dayNum(d.date)} — ${escapeHtml(d.title)}</option>`).join("");
    filter.value = state.photoFilter;
    filter.addEventListener("change", (e) => { state.photoFilter = e.target.value; render(); });

    toolbar.append(addBtn, fileInput, filter);
    frag.appendChild(toolbar);

    // Grid
    const shown = state.photos
      .filter((p) => state.photoFilter === "all" || p.date === state.photoFilter)
      .slice()
      .reverse();

    if (shown.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.innerHTML = `<div class="big">📷</div>
        <h3>No photos yet</h3>
        <p>Tap “Add photos” to share your camp memories.</p>`;
      frag.appendChild(empty);
    } else {
      const grid = document.createElement("div");
      grid.className = "photo-grid";
      shown.forEach((p) => {
        const item = document.createElement("div");
        item.className = "photo-item";
        const dayTitle = SCHEDULE.find((d) => d.date === p.date)?.title || "";
        item.innerHTML = `
          <img src="${p.src}" alt="Camp photo from ${escapeHtml(dayTitle)}" loading="lazy" />
          <span class="photo-tag">${fmtDow(p.date)} ${dayNum(p.date)}</span>
          <button class="photo-del" type="button" aria-label="Delete photo">✕</button>
        `;
        item.querySelector(".photo-del").addEventListener("click", () => deletePhoto(p.id));
        grid.appendChild(item);
      });
      frag.appendChild(grid);
    }
    view.replaceChildren(frag);
  }

  function handlePhotoFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const date = state.photoFilter === "all" ? todayISO() : state.photoFilter;
    let pending = files.length;
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) { pending--; return; }
      downscaleImage(file, 1024, (src) => {
        state.photos.push({ id: uid(), date, src, camper: state.me });
        if (--pending === 0) {
          try {
            save(LS.photos, state.photos);
            toast(`${files.length} photo${files.length > 1 ? "s" : ""} added 📸`);
          } catch (err) {
            toast("Storage full — try fewer photos.");
          }
          render();
        }
      });
    });
  }

  function deletePhoto(id) {
    state.photos = state.photos.filter((p) => p.id !== id);
    save(LS.photos, state.photos);
    toast("Photo removed");
    render();
  }

  // Downscale + compress to keep localStorage happy.
  function downscaleImage(file, maxDim, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        cb(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => cb(reader.result);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // ---- AWARDS view --------------------------------------------------------
  // Collect, don't compete: every cousin works toward their own badges,
  // claims one unique prize, and earns an Awards Day certificate.
  // Each badge has a `hint` shown while it's still locked.
  const BADGES = [
    { id: "cadet",     emoji: "🚀", label: "Time Cadet",      hint: "Build your time-travel gear on Launch Day", test: (c) => isDone(c, "d1-a2") },
    { id: "mapdecoder", emoji: "🗺️", label: "Map Decoder",    hint: "Decode the Time Map scavenger hunt",        test: (c) => isDone(c, "d1-a3") },
    { id: "fossil",    emoji: "🦴", label: "Fossil Hunter",   hint: "Dig up fossils in the Prehistoric Age",     test: (c) => isDone(c, "d2-a2") },
    { id: "scientist", emoji: "🌋", label: "Mad Scientist",   hint: "Erupt the prehistoric volcano",             test: (c) => isDone(c, "d2-a4") },
    { id: "dinodays",  emoji: "🦖", label: "Dino Days",       hint: "Complete every Dinosaur Days activity",     test: (c) => completedDay(c, "2026-06-07") },
    { id: "pyramid",   emoji: "🔺", label: "Pyramid Builder", hint: "Build the Great Pyramid in Ancient Egypt",  test: (c) => isDone(c, "d3-a1") },
    { id: "baker",     emoji: "🍪", label: "Master Baker",    hint: "Decorate the mummy cookies",                test: (c) => isDone(c, "d3-a2") },
    { id: "scribe",    emoji: "📜", label: "Royal Scribe",    hint: "Write your hieroglyphic name scroll",       test: (c) => isDone(c, "d3-a3") },
    { id: "castle",    emoji: "🏰", label: "Castle Keeper",   hint: "Build the cardboard castle",                test: (c) => isDone(c, "d4-a1") },
    { id: "knight",    emoji: "⚔️", label: "Brave Knight",    hint: "Complete every Knights & Castles activity", test: (c) => completedDay(c, "2026-06-09") },
    { id: "sealegs",   emoji: "🏴‍☠️", label: "Sea Legs",       hint: "Complete every Pirate Seas activity",       test: (c) => completedDay(c, "2026-06-10") },
    { id: "treasure",  emoji: "🪙", label: "Treasure Hunter", hint: "Find the buried pirate treasure",           test: (c) => isDone(c, "d5-a2") },
    { id: "showstop",  emoji: "⭐", label: "Showstopper",     hint: "Perform in the Wild West Hoedown Show",     test: (c) => isDone(c, "d6-a4") },
    { id: "dynamo",    emoji: "🌟", label: "Daily Dynamo",    hint: "Finish all 4 activities in any one era",    test: (c) => anyFullDay(c) },
    { id: "halfway",   emoji: "🎯", label: "Time Traveler",   hint: "Complete 14 activities",                    test: (c) => completedCount(c) >= 14 },
    { id: "champion",  emoji: "👑", label: "Time Champion",   hint: "Complete 24 activities",                    test: (c) => completedCount(c) >= 24 },
    { id: "master",    emoji: "🎖️", label: "Master of Time",  hint: "Complete every activity across all eras",   test: (c) => completedCount(c) >= allActivities().length },
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
        <div class="cc-name">${escapeHtml(me.name)} ${escapeHtml(me.last)}</div>
        <div class="cc-sub">Time Traveler · age ${me.age}</div>
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
        <div class="ros-name">${escapeHtml(c.name)} ${escapeHtml(c.last)}
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
      <div class="cert-name">${escapeHtml(camper.name)} ${escapeHtml(camper.last)}</div>
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
    const has = (id) => badgesEarned(camperId).some((b) => b.id === id);
    if (completedCount(camperId) >= allActivities().length) return { emoji: "🎖️", title: "Master of All Time", blurb: "Traveled to every era and did it all. Mimi is amazed!" };
    if (has("showstop")) return { emoji: "⭐", title: "Wild West Superstar", blurb: "Stole the show at the Hoedown Talent Show." };
    if (has("sealegs"))  return { emoji: "🏴‍☠️", title: "Fearless Pirate Captain", blurb: "Ruled the seas in the Age of Sail." };
    if (has("knight"))   return { emoji: "⚔️", title: "Bravest Knight", blurb: "Defended Camp Castle through the Middle Ages." };
    if (has("dinodays")) return { emoji: "🦖", title: "Dino Wrangler", blurb: "Tracked dinosaurs across the Prehistoric Age." };
    if (has("pyramid"))  return { emoji: "🔺", title: "Pyramid Architect", blurb: "Built wonders in Ancient Egypt." };
    if (has("baker"))    return { emoji: "🍪", title: "Royal Pastry Chef", blurb: "Master of Mimi's secret family recipes." };
    if (completedCount(camperId) >= 8) return { emoji: "🌟", title: "Time-Travel All-Star", blurb: "Jumped into every era with both feet." };
    return { emoji: "⏳", title: "Time Travelers Graduate", blurb: "A wonderful trip through time with the cousins." };
  }

  // Claim a unique prize (releasing any prize the camper already held).
  function claimReward(rewardId) {
    if (!state.me) { openCamperModal(); return; }
    if (claimedBy(rewardId)) { toast("Already claimed by another cousin!"); return; }
    const r = rewardById(rewardId);
    if (pointsFor(state.me) < r.cost) { toast(`Need ⭐ ${r.cost} — keep earning!`); return; }
    // Release any reward this camper currently holds (one prize per camper).
    const prev = claimOf(state.me);
    const claims = { ...state.claims };
    if (prev) delete claims[prev.id];
    claims[rewardId] = state.me;
    state.claims = claims;
    save(LS.claims, state.claims);
    toast(`Claimed ${r.emoji} ${r.name}!`);
    render();
  }
  function releaseReward(rewardId) {
    const claims = { ...state.claims };
    delete claims[rewardId];
    state.claims = claims;
    save(LS.claims, state.claims);
    toast("Prize released — pick another!");
    render();
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
      btn.innerHTML = `<span class="ce">${c.emoji}</span>${escapeHtml(c.name)}<small class="cp-age">age ${c.age}</small>`;
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
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
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
  if (!state.me) setTimeout(openCamperModal, 400);
})();
