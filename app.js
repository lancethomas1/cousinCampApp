/* ============================================================
   Cousin Camp — app logic (vanilla JS, no build step)
   State is stored in localStorage so it survives reloads.
   ============================================================ */

(function () {
  "use strict";

  const { CAMPERS, SCHEDULE } = window.CAMP_DATA;
  const view = document.getElementById("view");

  // ---- Storage helpers ----------------------------------------------------
  const LS = {
    me: "cc.me",                 // current camper id
    done: "cc.done",             // { camperId: { activityId: true } }
    photos: "cc.photos",         // [ { id, date, src, camper } ]
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
      <div class="eyebrow">Today at Cousin Camp</div>
      <h2>${escapeHtml(day.title)}</h2>
      <p>${fmtLong(iso)}</p>
      <div class="hero-progress"><span style="width:${pct}%"></span></div>
      <div class="hero-progress-label">${doneN}/${total} activities done${state.me ? "" : " — pick your camper to track points"}</div>
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
    head.innerHTML = `<h2 class="view-title">Camp Schedule 🗓️</h2>
      <p class="view-sub">One week of Mimi's grand adventures.</p>`;
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
          <div class="day-theme">${day.activities.length} activities</div>
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
  const BADGES = [
    { id: "firstday",  emoji: "🌅", label: "Early Bird", test: (c) => isDone(c, "d2-a1") },
    { id: "baker",     emoji: "🍪", label: "Master Baker", test: (c) => isDone(c, "d3-a1") },
    { id: "talent",    emoji: "⭐", label: "Showstopper", test: (c) => isDone(c, "d6-a4") },
    { id: "explorer",  emoji: "🧭", label: "Explorer", test: (c) => isDone(c, "d1-a3") && isDone(c, "d2-a4") },
    { id: "halfway",   emoji: "🎯", label: "Halfway Hero", test: (c) => completedCount(c) >= 14 },
    { id: "champion",  emoji: "👑", label: "Camp Champion", test: (c) => completedCount(c) >= 24 },
  ];

  function renderAwards() {
    const frag = document.createElement("div");
    const head = document.createElement("div");
    head.innerHTML = `<h2 class="view-title">Camp Awards 🏆</h2>
      <p class="view-sub">Earn points by completing activities!</p>`;
    frag.appendChild(head);

    const ranked = CAMPERS
      .map((c) => ({ camper: c, pts: pointsFor(c.id), done: completedCount(c.id) }))
      .sort((a, b) => b.pts - a.pts || b.done - a.done);

    // Podium (top 3) — only meaningful once someone has points.
    if (ranked[0].pts > 0) {
      const podium = document.createElement("div");
      podium.className = "podium";
      const order = [1, 0, 2]; // 2nd, 1st, 3rd visually
      order.forEach((idx) => {
        const r = ranked[idx];
        if (!r) return;
        const step = document.createElement("div");
        step.className = `podium-step rank-${idx + 1}`;
        step.innerHTML = `
          <div class="podium-avatar" style="background:${r.camper.color}22">${r.camper.emoji}</div>
          <div class="podium-name">${escapeHtml(r.camper.name)}</div>
          <div class="podium-pts">${r.pts} pts</div>
          <div class="podium-bar">${idx + 1}</div>
        `;
        podium.appendChild(step);
      });
      frag.appendChild(podium);
    }

    // Full leaderboard
    ranked.forEach((r, i) => {
      const row = document.createElement("div");
      row.className = "leaderboard-row" + (r.camper.id === state.me ? " me" : "");
      row.innerHTML = `
        <div class="lb-rank">${i + 1}</div>
        <div class="lb-avatar" style="background:${r.camper.color}22">${r.camper.emoji}</div>
        <div class="lb-name">${escapeHtml(r.camper.name)}${r.camper.id === state.me ? " <small>that's you!</small>" : `<small>${r.done} activities</small>`}</div>
        <div class="lb-pts">⭐ ${r.pts}</div>
      `;
      frag.appendChild(row);
    });

    // My badges
    const badgeCard = document.createElement("div");
    badgeCard.className = "card";
    if (state.me) {
      const me = camperById(state.me);
      const earned = BADGES.map((b) => ({ ...b, got: b.test(state.me) }));
      badgeCard.innerHTML = `<h3 style="margin-bottom:10px">${me.emoji} ${escapeHtml(me.name)}'s Badges</h3>`;
      const row = document.createElement("div");
      row.className = "badge-row";
      earned.forEach((b) => {
        const span = document.createElement("span");
        span.className = "badge" + (b.got ? "" : " locked");
        span.innerHTML = `${b.got ? b.emoji : "🔒"} ${escapeHtml(b.label)}`;
        row.appendChild(span);
      });
      badgeCard.appendChild(row);
    } else {
      badgeCard.innerHTML = `<h3 style="margin-bottom:6px">🎖️ Earn badges!</h3>
        <p style="color:var(--ink-soft);font-weight:700;margin:0">Pick your camper to start collecting badges and points.</p>`;
    }
    frag.appendChild(badgeCard);
    view.replaceChildren(frag);
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
