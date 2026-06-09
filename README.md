# Cousin Camp 🕰️ — Time Machine Travelers

A mobile-friendly web app for **Cousin Camp** — the family reunion where William's
grandmother, **Mimi**, runs a week of daily activities for all the cousins.

**2026 theme: Time Machine Travelers.** Camp runs **June 22–26, 2026**. The
per-day themes are off for now — the schedule is a clean 5-day skeleton with
placeholder activities ready for Mimi to fill in (edit `data.js`).

## Two apps, two links

**Live links** (GitHub Pages):

| App | Who it's for | Link |
|-----|--------------|------|
| 🕰️ Campers' app | the cousins | https://lancethomas1.github.io/cousinCampApp/ |
| 🎖️ Grown-ups' app | the parents | https://lancethomas1.github.io/cousinCampApp/parent.html |

The project ships as **two separate apps that share the same camp data**:

- **Campers' app — [`index.html`](./index.html)** (the link the kids use, built for
  a shared iPad — no per-device login)
  - **📅 Today / 🗓️ Schedule** — each activity shows every cousin's face; a kid taps
    their **own face** to check in (tap again to undo), so the whole crew can share
    one iPad without switching profiles.
  - **🎉 Cheers** — *Crew Cheers*, a friendly crew board. Shows the whole crew's
    combined progress, then every traveler's stats side by side, ranked by points
    from highest to lowest. Tap a cousin to send them a cheer 👏 — and add an
    optional free-form reason for why; each row shows cheers **got** and **gave**,
    and a **Recent Cheers** feed lists who cheered whom across camp (with the
    reason, when one was given).
  - **🏆 Awards** — tap any cousin to see their trophy case (badges earned *and*
    parent-granted) and print their Awards Day certificate.
- **Grown-ups' app — [`parent.html`](./parent.html)** (a separate link for parents)
  - **Lite sign-in:** grown-ups enter their **first name** to start (remembered on
    that device; tap **Switch** to change).
  - **Fairness rule:** a parent can give kudos/points/badges to every cousin
    **except their own kids** — those are locked in the picker, so nobody can pad
    their own kids' scores. Grown-ups who aren't listed as a parent (Mimi, aunts,
    uncles) can award everyone.
  - **Mission Control** (the award center): pick a cousin and tap to hand out
    **kudos cards** (kindness, helping, good sport…), **bonus points** with a note,
    or **special badges** (Camper of the Day, Mimi's Helper…), with a
    recent-recognition feed.

Both links point at the same folder — the parents' app is just `parent.html`
next to the campers' `index.html`. If you host somewhere other than GitHub Pages,
append `/parent.html` to your base URL (e.g. `https://example.com/parent.html`).
Both apps read and write the **same** camp, so an award handed out by a parent
instantly shows up in that cousin's points and trophy case in the campers' app.

> **The parents app has no separate password by design** — any grown-up who has
> the link (and the family passcode in shared mode) can hand out awards quickly.
> It runs on the honor system.

## Shared vs. local

Both apps work two ways:

- **Local mode (default):** everything stays on each device. No setup.
- **Shared mode:** points, badges, and parent awards sync live
  across all phones via Firebase, gated by a family passcode. See
  **[SETUP.md](./SETUP.md)** to turn it on (paste your Firebase config into
  `firebase-config.js`).

## Run it

It's a static site — no build step, no server, no dependencies.

```bash
# from the project folder, any of these work:
python3 -m http.server 8000      # then open http://localhost:8000
# or just open index.html directly in a browser
```

To put it online for the family, host the folder on **GitHub Pages**, Netlify,
or any static host.

## How data is stored

- **Local mode:** your camper and completed activities are saved in
  your browser's `localStorage`, on your own device.
- **Shared mode:** completions and parent awards live in one
  Firestore document (keyed by a hash of the family passcode), so every device
  stays in sync.

## Customize the camp

All the camp content lives in [`data.js`](./data.js):

- **`CAMPERS`** — the list of cousins (name, emoji, color, `parents`). The
  `parents` string (e.g. `"Lance & Betsy"`) also powers the parents app: a
  grown-up who signs in with one of those first names can't award that cousin.
  Add an optional `photo` (e.g. `"photos/ava.jpg"`) to show a real headshot in
  place of the emoji — square photos in the [`photos/`](./photos) folder look
  best, and any cousin without one simply falls back to their emoji.
- **`SCHEDULE`** — each day's title and activities
  (time, title, emoji, location, point value, description).
- **`KUDOS`** — the kudos cards grown-ups can award (emoji, label, point value).
- **`CHEERS`** — the playful cheer cards (emoji, label, description). They show
  up in **both** apps — cousins send them on the Crew Cheers board and grown-ups
  can hand them out from Mission Control — and are recognition only (0 points).
- **`BONUS_QUICK`** — the quick-tap bonus point amounts in the parents app.
- **`PARENT_BADGES`** — the special badges grown-ups can grant or take back.

The parents app's fairness rule needs no extra config — it reads the `parents`
field on each camper above. Edit those to match your real reunion — dates are
ISO `YYYY-MM-DD`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Campers' app shell — header, tab bar, camper picker |
| `parent.html` | Grown-ups' app shell — the separate Award Center link |
| `styles.css` | Shared theme, mobile-first layout, print styles |
| `core.js` | Shared model — state, Firestore sync, persistence, points/awards |
| `app.js` | Campers' views — Today, Schedule, Cheers, Awards |
| `parent.js` | Grown-ups' view — kudos, bonus points & special badges |
| `data.js` | Camp schedule, campers, kudos & badges (edit me!) |
| `firebase-config.js` | Your Firebase project config (for shared mode) |
| `firestore.rules` | Security rules for the shared database |
| `icons/` | App icons (clock for campers, medal for grown-ups) — favicons, iOS home-screen, PWA |
| `site.webmanifest` / `parent.webmanifest` | PWA manifests so each app installs to the home screen with its own icon |
| `SETUP.md` | How to turn on the shared camp |
