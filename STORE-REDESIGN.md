# Camp Store Redesign — Daily-Rotating Shop

**Status:** Design (not built)
**Authors:** Lance + Claude (design session)
**Date:** 2026-06-06

This document captures the agreed design for turning the Camp Store from a
one-of-a-kind weekly draft into a **daily-rotating shop with turn-taking**.
It is a spec, not an implementation — nothing here has been built yet. The
goal is to make the rules fair enough that no single eager cousin (the
"Laila always grabs Shotgun" problem) can monopolize the good prizes.

---

## 1. Why change anything?

### What the store is today

From `data.js` and `core.js`, the store is currently a **one-of-a-kind draft**:

- There are nine prizes and nine cousins. Each prize is claimed by **exactly
  one** cousin for the **whole week** (`state.claims = { rewardId: camperId }`).
- Each cousin holds **exactly one** prize total — claiming a new prize
  releases the old one (`core.js` `Store.claim`, which deletes any reward the
  camper already holds).
- There is **no concept of a day** in claims. A claim persists until released.
- The stated design goal is *"every cousin ends the week with their own
  different prize."* It prevents competition by guaranteeing scarcity.

### The problem

Several prizes are *naturally daily/repeatable* and don't fit "own it all week":

- 🍦 Dessert Captain ("...all day"), 🌙 Stay-Up-Late Pass, 🍫 S'more Master
  ("next bonfire"), 🛸 Time Machine Co-Pilot / Shotgun ("next outing").

And the real-world complaint is fairness: the most eager / earliest-awake
cousin grabs the best perks. The weekly draft sidesteps this by making
everything unique, but that also means a prize a kid loves is gone for the
whole week once someone else takes it.

### The decision

Replace the weekly draft with a **shop that resets every day**, where
**turn-taking** (not just speed or points) decides who gets the marquee
prizes. This was an explicit, knowing replacement of the "one unique prize
each" concept — the prize descriptions and the `data.js` narrative comment
will need rewriting to match.

---

## 2. Design decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Fairness mechanism for contested prizes | **Rotation / take turns** |
| 2 | Reset scope | **All prizes reset daily** |
| 3 | What happens to points at reset | **Cumulative points; only the prize claims reset** |
| 4 | New-day trigger | **Automatic at midnight, local time** |
| 5 | How widely rotation applies | **Wide — turn-taking on every prize** |
| 6 | A cousin whose turn it is but who doesn't want the prize | **Skip them** (don't stall) |
| 7 | Prizes a single cousin can hold per day | **Many** (a true daily shop) |
| 8 | The "one unique prize each" draft | **Replaced** |

### Two clocks, by design

- **Claims reset nightly** (decision 2 + 4): every prize is open again each
  morning.
- **Rotation resets per-cycle** (decision 1 + 5): the turn ledger survives the
  midnight wipe; it only recycles once everyone who wants a turn has had one.

These are intentionally on different clocks.

---

## 3. How it works

### 3.1 The daily cycle

- At **local midnight**, all of the day's claims are cleared. Every prize
  returns to **unclaimed / available**.
- **Points are NOT cleared.** Activity points and grown-up awards keep
  accumulating across the whole week. Claiming a prize "costs" points only for
  *that day*; the cost is refunded at the nightly reset, so each morning a
  cousin's spendable balance returns to their full cumulative total.
- Because points are cumulative, the eager cousin always has the most to
  spend — which is exactly why turn-taking (not points alone) gates the prizes.

### 3.2 Many prizes per day

A cousin may claim **every prize they can afford** in a given day (Dessert
Captain *and* Co-Pilot *and* …), subject to:

1. **Affordability** — their spendable balance that day covers the cost.
2. **Their turn** — rotation must permit them to claim that specific prize
   today (see 3.3).

This is the biggest departure from today's "one prize per camper" rule.

### 3.3 Rotation — "back of the line" per prize

Each prize has its own **turn line** (a persistent, ordered ledger of who has
recently claimed it). The rule, in kid-legible terms:

> *When you claim a prize, you go to the back of that prize's line. Each day
> the prize is offered to whoever is nearest the front of the line and wants
> it. Once everyone who wants a turn has had one, the line starts fresh.*

Concretely:

- A cousin is **eligible** to claim prize *X* today if no other cousin who
  *wants* *X* is ahead of them in *X*'s line (i.e., has waited longer for a
  turn).
- When a cousin claims *X*, append them to the back of *X*'s ledger.
- **Skip on pass (decision 6):** if the cousin at the front doesn't claim *X*
  on a given day, they don't block anyone — the next cousin in line becomes
  eligible the following day. No hard locks, so the line never stalls on a kid
  who's absent or uninterested.
- The ledger **persists across nightly resets** and only fully recycles once
  the cycle completes.

This naturally solves the "Laila always gets Shotgun" problem: once she's had
🛸 Co-Pilot, she goes to the back of its line and the cousins ahead of her get
their turn before she can claim it again — even though it reopens every day
and even though she has the most points.

### 3.4 Ties

When two equally-eligible cousins both want the same prize on the same day
(e.g. day one, when everyone is fresh and nobody is ahead in line),
**first-tap wins** — matching the existing optimistic claim logic in
`core.js` (the second claimer gets the "Already claimed by another cousin!"
toast). A grown-up can release and re-assign from the parent app if needed.

---

## 4. Data model changes

Current shared document (Firestore + local fallback):

```js
{ done, claims, awards }
// claims: { rewardId: camperId }   — one prize per camper, no day dimension
```

Proposed:

```js
{
  done,                 // unchanged
  awards,               // unchanged (points stay cumulative)

  // Claims become per-day and allow many cousins / many prizes.
  // Keyed by local date so the nightly reset is just "today != stored day".
  day: "2026-06-22",    // the local date the current claims belong to
  claims: {             // claims for `day` only; cleared when the date rolls
    "r-copilot": ["laila"],
    "r-dessert": ["william", "samuel"],
    // a cousin can appear under several prizes (many-per-day)
  },

  // Rotation ledgers — survive the nightly reset, recycle per cycle.
  turns: {
    "r-copilot": ["laila", "william"],  // order = who has had a turn this cycle
    // ...
  }
}
```

Notes:

- **Reset = compare dates, not a timer.** On load / on each write, if
  `day !== localToday()`, clear `claims` and set `day = localToday()`. This
  makes "auto at midnight" robust without a background job, and handles the app
  being closed overnight.
- `turns` is **not** cleared by the date roll; it only resets per-prize when
  that prize's cycle completes.

---

## 5. Derived values

These helpers in `core.js` change meaning:

| Helper | Today | After |
|--------|-------|-------|
| `spentBy(camperId)` | cost of the one held prize | **sum** of costs of all prizes the cousin holds **today** |
| `balanceFor(camperId)` | `pointsFor - spentBy` | same formula, new `spentBy`; resets each morning as `claims` clears |
| `claimOf(camperId)` | the one prize held | a **list** of prizes held today |
| `claimedBy(rewardId)` | the one owner | the **list** of today's claimers (many-per-day) |
| `pointsFor(camperId)` | cumulative | **unchanged** (cumulative all week) |

New helpers needed:

- `localToday()` → `"YYYY-MM-DD"` in the device's local zone.
- `rolloverIfNewDay()` → clears `claims` + sets `day` when the date changed.
- `canClaim(camperId, rewardId)` → affordability **and** rotation eligibility.
- `nextInLine(rewardId)` → who rotation currently favors (for UI hints).

---

## 6. File-by-file impact

- **`data.js`** — Rewrite the `STORE` block narrative (the "nine one-of-a-kind
  rewards … everyone ends the week with their own" comment) to describe a
  daily shop. Consider per-prize metadata if some prizes should opt out of
  rotation later (not needed for the locked "rotation on everything" design,
  but cheap to leave room for).
- **`core.js`** — The bulk of the work:
  - New `day` / `turns` state + `localToday()` / `rolloverIfNewDay()`.
  - `Store.claim` / `Store.release` updated for many-per-day + ledger updates.
  - `spentBy` / `balanceFor` / `claimOf` / `claimedBy` updated per §5.
  - `canClaim` / rotation logic.
  - Shared-write (`sharedWrite`) and the Firestore subscribe path must carry
    `day` + `turns` alongside `done` / `claims` / `awards`.
- **`app.js`** (campers) — Store grid shows availability + "your turn / had it,
  next is …" hints instead of a single owner. Claim picker allows multiple
  claimers. The `claimOf`-based bits (roster line, certificate, "Prize Winner"
  badge) move from "the prize" to "a list / count of prizes."
- **`parent.js`** (grown-ups) — The store section just added here gets the same
  multi-claim treatment, plus optionally a **"Start a new day"** override
  button (manual reset) even though the default is auto-at-midnight, for
  travel-day edge cases.
- **`firestore.rules`** — Allow the new `day` / `turns` fields on the shared
  doc.

---

## 7. Edge cases & open questions

Resolved by the locked decisions, but worth restating for the build:

- **App closed overnight / across days off:** handled by date-compare reset, so
  no background timer is required. Multiple missed days still just reset to
  today and leave the ledgers intact.
- **Time zones / travel days:** auto reset is **local** midnight. A manual
  "Start a new day" button (parent app) is the escape hatch if a family
  crosses zones or wants to flip the day early/late.
- **Late-night gaming (claim at 11:59pm):** accepted as a minor risk of the
  auto-midnight choice. The manual override mitigates it if it becomes a
  problem.

Still open (safe to default during build):

1. **Cycle completion when not everyone wants a prize.** "Skip on pass" keeps
   the line moving, but define precisely when a prize's `turns` ledger fully
   recycles — e.g. *"once every cousin in the ledger has had a turn"* vs
   *"once no cousin without a turn has tried to claim it for N days."* Default
   suggestion: recycle a prize's line once it contains every cousin who has
   claimed it at least once this cycle and no new cousin claims it for a full
   day.
2. **Should grown-ups be exempt from rotation when assigning prizes?** i.e. can
   a parent in the parent app override the line for fairness/special occasions?
   Suggested default: yes — grown-up claims bypass rotation but still record in
   the ledger.
3. **Prize descriptions** that imply one-time use (🎟️ Mystery from the Future,
   🎬 Movie Pick) need rewording for a daily context, or a future opt-out flag.

---

## 8. Migration

- Existing `claims` shaped as `{ rewardId: camperId }` should be treated as
  "yesterday's" and cleared on first load under the new model (set
  `day = localToday()`, `claims = {}`, `turns = {}`). No long-term data is
  lost because points (the durable value) live in `done` + `awards`, which are
  unchanged.

---

## 9. Summary

A daily shop where **points decide what you can afford** and **turn-taking
decides whose turn it is**, resetting every night so nobody owns a perk for
the week, with a persistent rotation ledger so the eager cousin can't sweep
the good prizes day after day. Cumulative points keep the season-long
motivation to do activities; rotation keeps it fair.
