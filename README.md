# Cousin Camp 🕰️ — Time Machine Travelers

A mobile-friendly web app for **Cousin Camp** — the family reunion where William's
grandmother, **Mimi**, runs a week of daily activities for all the cousins.

**2026 theme: Time Machine Travelers.** Camp runs **June 22–26, 2026**. The
per-day themes are off for now — the schedule is a clean 5-day skeleton with
placeholder activities ready for Mimi to fill in (edit `data.js`).

## Features

- **📅 Today** — today's activities and your progress.
- **🗓️ Schedule** — all five days of camp.
- **📸 Photos** — opens the camp's shared **Google Photos** album (set
  `PHOTO_ALBUM_URL` in `data.js`).
- **🏆 Awards** — pick your camper, check off activities to earn points, claim one
  of nine one-of-a-kind prizes, and unlock badges.

## Shared vs. local

The app works two ways:

- **Local mode (default):** everything stays on each device. No setup.
- **Shared mode:** points, prize claims, and badges sync live across all phones
  via Firebase, gated by a family passcode. See **[SETUP.md](./SETUP.md)** to turn
  it on (paste your Firebase config into `firebase-config.js`).

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

- **Local mode:** your camper, completed activities, and prize claims are saved in
  your browser's `localStorage`, on your own device.
- **Shared mode:** completions and prize claims live in one Firestore document
  (keyed by a hash of the family passcode), so every device stays in sync.

## Customize the camp

All the camp content lives in [`data.js`](./data.js):

- **`CAMPERS`** — the list of cousins (name, emoji, color).
- **`SCHEDULE`** — each day's title and activities
  (time, title, emoji, location, point value, description).
- **`STORE`** — the nine one-of-a-kind Camp Store prizes.
- **`PHOTO_ALBUM_URL`** — the Google Photos shared album link.

Edit those to match your real reunion — dates are ISO `YYYY-MM-DD`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell, header, tab bar, camper picker |
| `styles.css` | Time-machine theme, mobile-first layout, print styles |
| `app.js` | Views, routing, points, prizes, badges, sync |
| `data.js` | Camp schedule, campers, prizes, album link (edit me!) |
| `firebase-config.js` | Your Firebase project config (for shared mode) |
| `firestore.rules` | Security rules for the shared database |
| `SETUP.md` | How to turn on the shared camp |
