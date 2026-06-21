/* ============================================================
   Cousin Camp — parents' app (vanilla JS, no build step)
   A separate, grown-ups-only screen for handing out recognition:
   kudos cards, bonus points, and special badges. Shares the same
   model/state as the campers' app via core.js, so awards sync to
   every device (shared mode) and show up in the campers' Awards tab.
   ============================================================ */

(function () {
  "use strict";

  const C = window.CampCore;
  const { CAMPERS, KUDOS, CHEERS, BONUS_QUICK, PARENT_BADGES, SCHEDULE } = C.data;
  const {
    state, setRender, initShared, Store,
    pointsFor, kudosCountFor, parentBadgesFor, hasParentBadge, awardsFor, awarderTally,
    camperById,
    targetCamper, setTarget, giveKudos, giveBonus, toggleParentBadge, undoAward,
    allParentNames, grownupRoster, currentParent, ownKidIds, isOwnKid, setParent, clearParent,
    assignmentsFor, isParentSupervised,
    hasPrep, prepKey, isDone, todayISO, chronoBurst,
    toast, escapeHtml, camperFace, timeAgo, fmtDow, dayNum, fmtLong,
  } = C;
  const view = document.getElementById("view");

  const firstAwardable = () => CAMPERS.find((c) => !isOwnKid(c.id)) || null;

  // ---- Sign-in gate: enter your first name --------------------------------
  function renderGate() {
    const frag = document.createElement("div");
    const card = document.createElement("div");
    card.className = "card name-gate";
    card.innerHTML = `
      <div class="ng-emoji">👋</div>
      <h2>Who's awarding?</h2>
      <p class="ng-sub">Enter your first name to give kudos &amp; points. Parents can't
        award their own kids, so the cousins' scores stay fair.</p>`;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "bonus-note ng-input";
    input.placeholder = "Your first name";
    input.autocomplete = "off";
    input.setAttribute("autocapitalize", "words");
    const go = document.createElement("button");
    go.type = "button";
    go.className = "btn ng-go";
    go.textContent = "Start awarding 🎖️";
    const submit = () => {
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      enterAs(name);
    };
    go.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    card.append(input, go);

    // Quick-pick buttons for the grown-ups we already know about (parents plus
    // grandparents & other helpers). The chip shows a friendly label but signs
    // in under the grown-up's name.
    const known = grownupRoster();
    if (known.length) {
      const quick = document.createElement("div");
      quick.className = "name-quick";
      known.forEach(({ name, label }) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn-ghost name-chip";
        b.textContent = label;
        b.addEventListener("click", () => enterAs(name));
        quick.appendChild(b);
      });
      const lbl = document.createElement("p");
      lbl.className = "ng-or";
      lbl.textContent = "…or tap your name:";
      card.append(lbl, quick);
    }
    frag.appendChild(card);
    view.replaceChildren(frag);
    setTimeout(() => input.focus(), 60);
  }

  // Sign in, then make sure the selected cousin isn't one of this parent's kids.
  function enterAs(name) {
    setParent(name);              // re-renders
    const t = targetCamper();
    if (t && isOwnKid(t.id)) {
      const alt = firstAwardable();
      if (alt) setTarget(alt.id); // re-renders onto an awardable cousin
    }
    toast(`Hi, ${name}! 👋`);
  }

  // ---- Router -------------------------------------------------------------
  // The parents app now navigates like the campers' app: a bottom tab bar with
  // three jobs kept apart instead of one long scroll —
  //   📋 Assignments → what you're on the hook for (cook/lead schedule)
  //   🎖️ Award       → the core loop (pick a cousin, hand out kudos/points/badges)
  //   🏆 Standings    → who's leading, who's most generous
  // Assignments is the leftmost (home) tab; it's hidden for grown-ups with no
  // duties, in which case Award becomes home.
  const ROUTES = { duties: renderDuties, award: renderAward, standings: renderStandings };
  const tabbar = document.getElementById("parent-tabs");
  const dutyTab = tabbar.querySelector('[data-route="duties"]');

  function render() {
    // Gate first: no name yet → ask for it (and hide the nav while gated).
    if (!state.parent) { tabbar.hidden = true; renderGate(); return; }

    // Never sit on one of this parent's own kids — hop to an awardable cousin.
    const me = targetCamper();
    if (me && isOwnKid(me.id)) {
      const alt = firstAwardable();
      if (alt) { setTarget(alt.id); return; }  // re-renders with an allowed target
    }

    // The Assignments tab is always available — it hosts today's prep tasks for
    // everyone, plus this grown-up's cook/lead duties when they have any.
    tabbar.hidden = false;
    dutyTab.hidden = false;

    // Resolve the active route, falling back sensibly. core.js seeds state.route
    // with "today" (a campers' route), so the first render lands on Assignments.
    let route = ROUTES[state.route] ? state.route : "duties";
    state.route = route;

    const frag = document.createElement("div");
    frag.appendChild(buildIdBar());
    ROUTES[route](frag);
    view.replaceChildren(frag);

    tabbar.querySelectorAll(".tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.route === route));
  }

  // Switch tabs: update the hash (so refresh/back keep your place) and scroll
  // back to the top, matching the campers' app router.
  function go(route) {
    if (!ROUTES[route]) route = "award";
    state.route = route;
    if (location.hash !== "#" + route) location.hash = route;
    render();
    view.scrollTop = 0; window.scrollTo(0, 0);
  }

  // --- Signed-in bar (shown on every tab) ----------------------------------
  function buildIdBar() {
    const idBar = document.createElement("div");
    idBar.className = "parent-id";
    const who = currentParent();
    idBar.innerHTML = `<span>👋 Signed in as <b>${escapeHtml(state.parent)}</b>${
      who && ownKidIds().length ? ` · can't award your own kids` : ""}</span>`;
    const switchBtn = document.createElement("button");
    switchBtn.type = "button";
    switchBtn.className = "pid-switch";
    switchBtn.textContent = "Switch";
    switchBtn.addEventListener("click", clearParent);
    idBar.appendChild(switchBtn);
    return idBar;
  }

  // ---- 📋 Assignments tab -------------------------------------------------
  // One combined timeline: every cook/lead duty across the whole camp plus
  // today's prep, in chronological order. Duties already done collapse to a
  // minimal, inactive card; the soonest upcoming one leads as the primary
  // focus; and today's prep stays tappable right inside its own card.
  function renderDuties(frag) {
    const head = document.createElement("div");
    head.innerHTML = `<h2 class="view-title">Your Assignments 📋</h2>
      <p class="view-sub">Everything you're on the hook for, in order — meals to cook, activities to lead, and getting the cousins prepped. Done duties tuck away so your next one stays front and center.</p>`;
    frag.appendChild(head);

    buildAssignmentsTimeline(frag);
  }

  // Build the single chronological list of duty cards for the signed-in grown-up.
  function buildAssignmentsTimeline(frag) {
    const duties = assignmentsFor(state.parent).slice();
    if (!duties.length) {
      const none = document.createElement("div");
      none.className = "empty";
      none.innerHTML = `<div class="big">🎉</div><h3>No assignments</h3>
        <p>You're not on the hook for any meals or activities — just enjoy camp!</p>`;
      frag.appendChild(none);
      return;
    }

    // Chronological across the whole camp (ISO dates sort lexicographically),
    // then split past from upcoming against the *real* clock. The first duty
    // that hasn't started yet is the soonest upcoming — the primary focus; if
    // every duty is done, spotlight the most recent so there's always one live
    // card. (We compare full date+time timestamps, not a clamped todayISO(),
    // so before camp nothing is "past" and the whole first day stays live.)
    duties.sort((a, b) => a.date.localeCompare(b.date) || prepStartMin(a) - prepStartMin(b));
    const nowTs = Date.now();
    let primaryIdx = duties.findIndex((d) => dutyStartTs(d) >= nowTs);
    if (primaryIdx === -1) primaryIdx = duties.length - 1;

    duties.forEach((d, i) => {
      const opts = { past: i < primaryIdx, primary: i === primaryIdx, duty: d };
      // A lead activity with a prep checklist hosts the interactive check-in
      // inline — on any day, each keyed to its own activity id so a recurring
      // task (e.g. daily Capoeira) keeps its day's state. Cook duties and
      // prep-less leads render as plain cards.
      const act = d.role === "lead" ? activityForDuty(d) : null;
      frag.appendChild(act && hasPrep(act) ? buildPrepCard(act, opts) : buildDutyCard(d, opts));
    });
  }

  // Parse a schedule time label ("8:15 AM") into minutes since midnight, used to
  // order the timeline and tell which duties have already started.
  function prepStartMin(a) {
    const m = String(a.time || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return 0;
    let h = parseInt(m[1], 10) % 12;
    if (m[3] && /PM/i.test(m[3])) h += 12;
    return h * 60 + parseInt(m[2], 10);
  }

  // A duty's start as a real timestamp (its calendar date + start time), so the
  // past/upcoming split tracks the actual clock across the whole camp.
  function dutyStartTs(d) {
    const [y, mo, da] = d.date.split("-").map(Number);
    const min = prepStartMin(d);
    return new Date(y, mo - 1, da, Math.floor(min / 60), min % 60).getTime();
  }

  // The full schedule activity (with id + prep) backing a duty, matched within
  // the duty's own day so per-day prep state stays distinct.
  function activityForDuty(d) {
    const day = SCHEDULE.find((x) => x.date === d.date);
    return day ? day.activities.find((a) => a.time === d.time && a.title === d.title) || null : null;
  }

  // A plain (non-prep) duty card — a meal to cook or an activity with no prep
  // checklist. Shares the .activity-card look so it sits in the same timeline as
  // the interactive prep cards, tagged Cook or Lead with its date and time.
  function buildDutyCard(d, opts = {}) {
    const isCook = d.role === "cook";
    const el = document.createElement("div");
    el.className = "activity-card duty" +
      (opts.past ? " assign-past" : "") +
      (opts.primary ? " assign-primary" : "");
    const [, mo, da] = d.date.split("-").map(Number);
    // A "supervised" lead (pool/swim, field trips naming several families) is a
    // mind-your-own-kids duty, not a real single leader — tag it accordingly.
    const isWatch = d.role === "lead" && d.supervised;
    const roleClass = isCook ? "cook" : isWatch ? "watch" : "lead";
    const roleText = isCook ? "👨‍🍳 Cook" : isWatch ? "👪 Your kids" : "🎤 Lead";
    const roleBadge = `<span class="cd-role ${roleClass}">${roleText}</span>`;
    // Surface the cook crew / co-leads when the duty names more than just you.
    // Skip it for "your kids" duties — the whole parent roster isn't a co-lead.
    const partners = !isWatch && /[&,]|\band\b/i.test(d.who || "")
      ? `<span class="cd-with">${escapeHtml(d.who)}</span>` : "";
    const head = document.createElement("div");
    head.className = "activity-head";
    head.innerHTML = `
      <div class="activity-emoji">${d.emoji || (isCook ? "🍽️" : "⭐")}</div>
      <div class="activity-body">
        <div class="activity-top">
          <span class="activity-when">${escapeHtml(fmtDow(d.date))} ${mo}/${da}</span>
          <span class="activity-time">${escapeHtml(d.time)}</span>
          ${roleBadge}
        </div>
        <div class="activity-title">${escapeHtml(d.title)}</div>
        ${partners ? `<div class="cd-tags">${partners}</div>` : ""}
      </div>`;
    el.appendChild(head);
    return el;
  }

  // Which cousins' faces show on a prep card for the signed-in grown-up.
  // Normally everyone — the facilitator runs the activity for all the cousins.
  // But some tasks (pool/swim, get-dressed) are assigned to the campers' parents
  // as a group; on those, a parent is only responsible for their own kids, so we
  // narrow the row to them. isParentSupervised() treats a task as "parents handle
  // their own" when its lead names parents from more than one family.
  function prepCampersFor(a) {
    if (isParentSupervised(a) && ownKidIds().length) {
      const ids = new Set(ownKidIds());
      return CAMPERS.filter((c) => ids.has(c.id));
    }
    return CAMPERS;
  }

  // One prep activity card: a row of tappable cousin faces per task, plus an
  // "Everyone" pill. Shares the campers' app markup/classes for a consistent look.
  function buildPrepCard(a, opts = {}) {
    const campers = prepCampersFor(a);
    const el = document.createElement("div");
    el.className = "activity-card prep" +
      (opts.past ? " assign-past" : "") +
      (opts.primary ? " assign-primary" : "");
    // Date + role tag so a prep card carries the same when/role metadata as the
    // plain duty cards it sits among in the timeline. A supervised "your kids"
    // activity (pool/swim, field trips) is tagged like its duty-card counterpart.
    let whenHtml = "";
    if (opts.duty) {
      const [, mo, da] = opts.duty.date.split("-").map(Number);
      whenHtml = `<span class="activity-when">${escapeHtml(fmtDow(opts.duty.date))} ${mo}/${da}</span>`;
    }
    const isWatch = opts.duty ? opts.duty.supervised : isParentSupervised(a);
    const roleBadge = isWatch
      ? `<span class="cd-role watch">👪 Your kids</span>`
      : `<span class="cd-role lead">🎤 Lead</span>`;
    const head = document.createElement("div");
    head.className = "activity-head";
    head.innerHTML = `
      <div class="activity-emoji">${a.emoji}</div>
      <div class="activity-body">
        <div class="activity-top">
          ${whenHtml}
          <span class="activity-time">${a.time}</span>
          ${roleBadge}
        </div>
        <div class="activity-title">${escapeHtml(a.title)}</div>
        <p class="activity-desc">${escapeHtml(a.desc)}</p>
        <div class="activity-loc">📍 ${escapeHtml(a.location)}</div>
      </div>`;
    el.appendChild(head);

    // A past task is collapsed and inactive by default. Summarize its readiness
    // in the header and let a tap expand it, so a missed item can still be ticked
    // off without it competing with the soonest task for attention.
    if (opts.past) {
      let total = 0, done = 0;
      a.prep.forEach((item, i) => {
        const key = prepKey(a.id, i);
        campers.forEach((c) => { total++; if (isDone(c.id, key)) done++; });
      });
      const ready = total > 0 && done === total;
      const status = document.createElement("div");
      status.className = "prep-past-status";
      status.innerHTML = ready
        ? `<span class="prep-status-pill ready">✓ Ready</span>`
        : `<span class="prep-status-pill">${total - done} left</span>`;
      status.insertAdjacentHTML("beforeend", `<span class="prep-past-chev" aria-hidden="true">▾</span>`);
      head.appendChild(status);

      head.setAttribute("role", "button");
      head.setAttribute("tabindex", "0");
      head.setAttribute("aria-expanded", "false");
      const toggle = () => {
        const open = el.classList.toggle("expanded");
        head.setAttribute("aria-expanded", open ? "true" : "false");
      };
      head.addEventListener("click", toggle);
      head.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    }

    a.prep.forEach((item, i) => {
      const key = prepKey(a.id, i);
      const label = document.createElement("div");
      label.className = "kidrow-label prep-item-label";
      label.textContent = item;
      el.appendChild(label);

      const kidrow = document.createElement("div");
      kidrow.className = "kidrow";
      campers.forEach((c) => {
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
            const av = btn.querySelector(".kc-avatar") || btn;
            const r = av.getBoundingClientRect();
            chronoBurst(r.left + r.width / 2, r.top + r.height / 2);
            toast(`✓ ${c.name}: ${item}`);
          }
          Store.toggle(c.id, key, turningOn);
        });
        kidrow.appendChild(btn);
      });
      el.appendChild(kidrow);

      // Per-task "everyone" shortcut: set this one item for all shown cousins.
      const allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = "prep-all-btn";
      const allReady = campers.every((c) => isDone(c.id, key));
      allBtn.classList.toggle("ready", allReady);
      allBtn.setAttribute("aria-pressed", allReady ? "true" : "false");
      allBtn.textContent = allReady ? "↩︎ Undo everyone" : "✅ Everyone";
      allBtn.addEventListener("click", () => {
        const turningOn = !campers.every((c) => isDone(c.id, key));
        if (turningOn) {
          // Pop from the button itself, not every cousin's face.
          const r = allBtn.getBoundingClientRect();
          chronoBurst(r.left + r.width / 2, r.top + r.height / 2);
          toast(`🎒 Everyone: ${item}`);
        }
        Store.setPrepItem(a.id, i, campers.map((c) => c.id), turningOn);
      });
      el.appendChild(allBtn);
    });
    return el;
  }

  // ---- 🏆 Standings tab ---------------------------------------------------
  function renderStandings(frag) {
    const head = document.createElement("div");
    head.innerHTML = `<h2 class="view-title">Standings 🏆</h2>
      <p class="view-sub">Which grown-ups are handing out the most love, and how the cousins stack up.</p>`;
    frag.appendChild(head);
    frag.appendChild(buildAwarderLeaderboard());
    frag.appendChild(buildCousinStandings());
  }

  // ---- 🎖️ Award tab (Mission Control) ------------------------------------
  function renderAward(frag) {
    let me = targetCamper();
    if (me && isOwnKid(me.id)) me = null;  // render() already tried to hop off

    // --- Who am I awarding? (sticky target picker) -------------------------
    const pickerHead = document.createElement("div");
    pickerHead.innerHTML = `<h2 class="view-title">Mission Control 🎖️</h2>
      <p class="view-sub">Power the time machine — pick a traveler, then hand out points, kudos &amp; badges.</p>`;
    frag.appendChild(pickerHead);

    // Pin the picker beneath the header so re-targeting a cousin is one tap —
    // no scrolling back up past the kudos/bonus/badge sections.
    const pickerWrap = document.createElement("div");
    pickerWrap.className = "picker-sticky";
    const picker = document.createElement("div");
    picker.className = "target-picker";
    CAMPERS.forEach((c) => {
      const mine = isOwnKid(c.id);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "target-pick" + (me && c.id === me.id ? " active" : "") + (mine ? " locked" : "");
      b.style.setProperty("--cc", c.color);
      b.disabled = mine;
      b.innerHTML = `${camperFace(c, "tp-emoji")}<span class="tp-name">${escapeHtml(c.name)}</span>` +
        (mine ? `<span class="tp-lock">🙅 your kid</span>` : `<span class="tp-pts">⭐ ${pointsFor(c.id)}</span>`);
      if (!mine) b.addEventListener("click", () => setTarget(c.id));
      picker.appendChild(b);
    });
    pickerWrap.appendChild(picker);
    frag.appendChild(pickerWrap);

    if (!me) {
      const none = document.createElement("div");
      none.className = "empty";
      none.innerHTML = `<div class="big">🙂</div><h3>No cousins to award</h3>
        <p>Everyone shown is one of your own kids. Another grown-up can award them.</p>`;
      frag.appendChild(none);
      return;
    }

    // --- Selected camper banner -------------------------------------------
    const banner = document.createElement("div");
    banner.className = "award-banner";
    banner.style.setProperty("--cc", me.color);
    banner.innerHTML = `
      <div class="ab-avatar">${camperFace(me)}</div>
      <div class="ab-info">
        <div class="ab-name">Awarding <b>${escapeHtml(me.name)}</b></div>
        <div class="ab-stats">
          <span><b>${pointsFor(me.id)}</b> points</span>
          <span><b>${kudosCountFor(me.id)}</b> kudos</span>
          <span><b>${parentBadgesFor(me.id).length}</b> badges</span>
        </div>
      </div>`;
    frag.appendChild(banner);

    // --- Kudos board -------------------------------------------------------
    const kudosWrap = document.createElement("div");
    kudosWrap.innerHTML = `<h3 class="section-title">🙌 Give Kudos</h3>
      <p class="section-note">Tap a card to award it to ${escapeHtml(me.name)}.</p>`;
    const kGrid = document.createElement("div");
    kGrid.className = "kudos-grid";
    // Point-bearing kudos first, then the playful 0-point cheer cards. The pts
    // chip only shows when a card actually awards points (cheers say "cheer").
    KUDOS.concat(CHEERS).forEach((k) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "kudos-tile";
      tile.innerHTML = `
        <div class="kt-emoji">${k.emoji}</div>
        <div class="kt-label">${escapeHtml(k.label)}</div>
        <div class="kt-desc">${escapeHtml(k.desc)}</div>
        <div class="kt-pts">${k.points ? `+${k.points}` : "👏 cheer"}</div>`;
      tile.addEventListener("click", () => giveKudos(k.id));
      kGrid.appendChild(tile);
    });
    kudosWrap.appendChild(kGrid);
    frag.appendChild(kudosWrap);

    // --- Bonus points ------------------------------------------------------
    const bonusWrap = document.createElement("div");
    bonusWrap.innerHTML = `<h3 class="section-title">➕ Bonus Points</h3>
      <p class="section-note">Add a custom amount with an optional note.</p>`;
    const bonusCard = document.createElement("div");
    bonusCard.className = "bonus-card";
    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.className = "bonus-note";
    noteInput.placeholder = "What's it for? (optional)";
    noteInput.maxLength = 60;
    const quickRow = document.createElement("div");
    quickRow.className = "bonus-quick";
    BONUS_QUICK.forEach((n) => {
      const qb = document.createElement("button");
      qb.type = "button";
      qb.className = "bonus-btn";
      qb.textContent = `+${n}`;
      qb.addEventListener("click", () => { giveBonus(n, noteInput.value); noteInput.value = ""; });
      quickRow.appendChild(qb);
    });
    const customRow = document.createElement("div");
    customRow.className = "bonus-custom";
    const amtInput = document.createElement("input");
    amtInput.type = "number";
    amtInput.className = "bonus-amt";
    amtInput.placeholder = "Custom";
    amtInput.step = "1";
    const giveBtn = document.createElement("button");
    giveBtn.type = "button";
    giveBtn.className = "btn";
    giveBtn.textContent = "Give";
    giveBtn.addEventListener("click", () => {
      giveBonus(amtInput.value, noteInput.value);
      amtInput.value = ""; noteInput.value = "";
    });
    customRow.append(amtInput, giveBtn);
    bonusCard.append(noteInput, quickRow, customRow);
    bonusWrap.appendChild(bonusCard);
    frag.appendChild(bonusWrap);

    // --- Special badges ----------------------------------------------------
    const badgeWrap = document.createElement("div");
    badgeWrap.innerHTML = `<h3 class="section-title">🏅 Special Badges</h3>
      <p class="section-note">Tap to grant a one-of-a-kind honor; tap again to take it back.</p>`;
    const pbGrid = document.createElement("div");
    pbGrid.className = "trophy-grid";
    PARENT_BADGES.forEach((b) => {
      const got = hasParentBadge(me.id, b.id);
      const t = document.createElement("button");
      t.type = "button";
      t.className = "trophy pb-toggle" + (got ? " got" : " locked");
      t.innerHTML = `
        <div class="tr-emoji">${got ? b.emoji : "➕"}</div>
        <div class="tr-label">${escapeHtml(b.label)}</div>
        <div class="tr-hint">${got ? "Granted — tap to remove" : escapeHtml(b.desc)}</div>`;
      t.addEventListener("click", () => toggleParentBadge(b.id));
      pbGrid.appendChild(t);
    });
    badgeWrap.appendChild(pbGrid);
    frag.appendChild(badgeWrap);

    // --- Recent recognition feed ------------------------------------------
    const feedWrap = document.createElement("div");
    feedWrap.innerHTML = `<h3 class="section-title">🧾 ${escapeHtml(me.name)}'s Recent Awards</h3>`;
    const feed = awardsFor(me.id).slice().reverse();
    if (feed.length === 0) {
      feedWrap.innerHTML += `<p class="section-note">No awards yet — tap a kudos card above to start! 🌟</p>`;
    } else {
      const list = document.createElement("div");
      list.className = "award-feed";
      feed.forEach((a) => {
        const row = document.createElement("div");
        row.className = "feed-row";
        const pts = a.points ? `<span class="fr-pts ${a.points < 0 ? "neg" : ""}">${a.points > 0 ? "+" : ""}${a.points}</span>` : "";
        // Who handed out this award: the grown-up's name for parent awards, or
        // the cousin's for a cheer. Older awards predate tracking, so fall back.
        const by = a.by || (a.type === "cheer" && a.from ? (camperById(a.from) || {}).name : "");
        row.innerHTML = `
          <div class="fr-emoji">${a.emoji}</div>
          <div class="fr-body">
            <div class="fr-label">${escapeHtml(a.label)}${a.note ? ` — ${escapeHtml(a.note)}` : ""}</div>
            <div class="fr-time">${timeAgo(a.ts)}${by ? ` · by ${escapeHtml(by)}` : ""}</div>
          </div>
          ${pts}
          <button class="fr-undo" type="button" aria-label="Remove award">✕</button>`;
        row.querySelector(".fr-undo").addEventListener("click", () => undoAward(me.id, a.id));
        list.appendChild(row);
      });
      feedWrap.appendChild(list);
    }
    frag.appendChild(feedWrap);
  }

  // ---- Leaderboard: most generous grown-ups -------------------------------
  // A friendly, all-cousins tally of who's handed out the most kudos & points,
  // built from the `by` tag on each award. The signed-in grown-up is highlighted.
  function buildAwarderLeaderboard() {
    const wrap = document.createElement("div");
    wrap.className = "awarder-board";
    wrap.innerHTML = `<h3 class="section-title">🏆 Most Generous Grown-ups</h3>
      <p class="section-note">Who's handed out the most kudos &amp; points across all the cousins.</p>`;
    const rows = awarderTally();
    if (rows.length === 0) {
      wrap.innerHTML += `<p class="section-note">No awards handed out yet — give some kudos to get on the board! 🌟</p>`;
      return wrap;
    }
    const medals = ["🥇", "🥈", "🥉"];
    const here = (state.parent || "").trim().toLowerCase();
    rows.forEach((r, i) => {
      const isMe = !!here && r.name.toLowerCase() === here;
      const row = document.createElement("div");
      row.className = "roster-row" + (isMe ? " me" : "");
      const medal = medals[i] || `#${i + 1}`;
      row.innerHTML = `
        <div class="lb-avatar" style="background:rgba(255,206,77,.18)">${medal}</div>
        <div class="ros-name">${escapeHtml(r.name)}${isMe ? ` <span class="ros-you">you</span>` : ""}
          <small>${r.kudos} kudos · ⭐ ${r.points} pts given</small></div>
        <div class="ros-pts">${r.awards} award${r.awards === 1 ? "" : "s"}</div>`;
      wrap.appendChild(row);
    });
    return wrap;
  }

  // ---- Standings: cousins by points ---------------------------------------
  // A quick, at-a-glance ranking of every traveler by total points, so a
  // grown-up can see who could use a little encouragement before awarding.
  function buildCousinStandings() {
    const wrap = document.createElement("div");
    wrap.className = "awarder-board";
    wrap.innerHTML = `<h3 class="section-title">⭐ Cousins' Points</h3>
      <p class="section-note">Where every traveler stands right now.</p>`;
    const medals = ["🥇", "🥈", "🥉"];
    const ranked = CAMPERS.slice().sort((a, b) => pointsFor(b.id) - pointsFor(a.id));
    ranked.forEach((c, i) => {
      const row = document.createElement("div");
      row.className = "roster-row";
      row.style.setProperty("--cc", c.color);
      const medal = medals[i] || `#${i + 1}`;
      row.innerHTML = `
        <div class="lb-avatar">${camperFace(c)}</div>
        <div class="ros-name">${escapeHtml(c.name)}
          <small>${kudosCountFor(c.id)} kudos · ${parentBadgesFor(c.id).length} badges</small></div>
        <div class="ros-pts">${medal} · ⭐ ${pointsFor(c.id)}</div>`;
      wrap.appendChild(row);
    });
    return wrap;
  }

  // ---- Boot ---------------------------------------------------------------
  // Measure the sticky header so the pinned cousin picker lands just beneath it
  // (mirrors the campers' app). Re-measure on resize.
  const appHeader = document.querySelector(".app-header");
  function syncHeaderHeight() {
    if (appHeader) {
      document.documentElement.style.setProperty("--header-h", appHeader.offsetHeight + "px");
    }
  }
  window.addEventListener("resize", syncHeaderHeight);
  syncHeaderHeight();

  // Bottom-tab navigation + hash routing.
  tabbar.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => go(tab.dataset.route)));
  window.addEventListener("hashchange", () => {
    const r = location.hash.replace("#", "");
    if (ROUTES[r] && r !== state.route) { state.route = r; render(); window.scrollTo(0, 0); }
  });
  const initial = location.hash.replace("#", "");
  if (ROUTES[initial]) state.route = initial;

  setRender(render);
  render();
  initShared();  // join the same shared camp as the campers' app
})();
