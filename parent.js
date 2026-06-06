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
  const { CAMPERS, KUDOS, BONUS_QUICK, PARENT_BADGES, STORE } = C.data;
  const {
    state, setRender, initShared, Store,
    pointsFor, kudosCountFor, parentBadgesFor, hasParentBadge, awardsFor,
    camperById, claimedBy, claimOf,
    targetCamper, setTarget, giveKudos, giveBonus, toggleParentBadge, undoAward,
    allParentNames, grownupRoster, currentParent, ownKidIds, isOwnKid, setParent, clearParent,
    toast, escapeHtml, camperFace, timeAgo,
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

  // ---- Award Center view --------------------------------------------------
  function render() {
    // Gate first: no name yet → ask for it.
    if (!state.parent) { renderGate(); return; }

    const frag = document.createElement("div");
    let me = targetCamper();
    if (!me) { view.replaceChildren(frag); return; }
    // Never sit on one of this parent's own kids — hop to an awardable cousin.
    if (isOwnKid(me.id)) {
      const alt = firstAwardable();
      if (alt) { setTarget(alt.id); return; }  // re-renders with an allowed target
      me = null;
    }

    // --- Signed-in bar -----------------------------------------------------
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
    frag.appendChild(idBar);

    // --- Who am I awarding? (target picker) --------------------------------
    const pickerHead = document.createElement("div");
    pickerHead.innerHTML = `<h2 class="view-title">Mission Control 🎖️</h2>
      <p class="view-sub">Power the time machine — pick a traveler, then hand out points, kudos &amp; badges.</p>`;
    frag.appendChild(pickerHead);

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
    frag.appendChild(picker);

    if (!me) {
      const none = document.createElement("div");
      none.className = "empty";
      none.innerHTML = `<div class="big">🙂</div><h3>No cousins to award</h3>
        <p>Everyone shown is one of your own kids. Another grown-up can award them.</p>`;
      frag.appendChild(none);
      frag.appendChild(buildStoreSection());
      view.replaceChildren(frag);
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
    KUDOS.forEach((k) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "kudos-tile";
      tile.innerHTML = `
        <div class="kt-emoji">${k.emoji}</div>
        <div class="kt-label">${escapeHtml(k.label)}</div>
        <div class="kt-desc">${escapeHtml(k.desc)}</div>
        <div class="kt-pts">+${k.points}</div>`;
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

    // --- Camp Store: claim or release prizes on a cousin's behalf -----------
    frag.appendChild(buildStoreSection());

    view.replaceChildren(frag);
  }

  // ---- Camp Store (grown-up kiosk) ----------------------------------------
  // A camper-agnostic board: tap a prize, then tap which cousin is claiming
  // it. Tap a claimed prize to release it. Mirrors the campers' Awards tab so
  // a grown-up can run the store from Mission Control. Claims sync to every
  // device through the same Store the campers' app uses.
  function buildStoreSection() {
    const section = document.createElement("div");
    section.className = "store-section";
    section.innerHTML = `<h3 class="section-title">🏪 Camp Store — Manage Prizes</h3>
      <p class="section-note">Tap a prize, then tap which cousin is claiming it. Tap a claimed prize to release it.</p>`;
    const grid = document.createElement("div");
    grid.className = "store-grid";
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
      grid.appendChild(tile);
    });
    section.appendChild(grid);
    return section;
  }

  // Kiosk claim: tap a prize, then tap which cousin is claiming it. Only
  // cousins who can afford the prize are tappable.
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

  // ---- Boot ---------------------------------------------------------------
  setRender(render);
  render();
  initShared();  // join the same shared camp as the campers' app
})();
