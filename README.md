# Cousin Camp 🕰️ — Time Machine Travelers

A mobile-friendly web app for **Cousin Camp** — the family reunion where William's
grandmother, **Mimi**, runs a week of daily activities for all the cousins.

**2026 theme: Time Machine Travelers.** Camp runs **June 22–26, 2026**. The
per-day themes are off for now — the schedule is a clean 5-day skeleton with
placeholder activities ready for Mimi to fill in (edit `data.js`).

## Features

- **📅 Today** — today's activities and your progress.
- **🗓️ Schedule** — all five days of camp.
- **📸 Photos** — add photos from your phone and tag them to a camp day. Images
  are downscaled in the browser and stored locally on your device.
- **🏆 Awards** — pick your camper, check off activities to earn points, climb the
  leaderboard, and unlock fun badges.

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

Everything (your chosen camper, completed activities, and photos) is saved in your
browser's `localStorage`, so it stays on each person's own device. There's no
account and nothing is uploaded to a server.

## Customize the camp

All the camp content lives in [`data.js`](./data.js):

- **`CAMPERS`** — the list of cousins (name, emoji, color).
- **`SCHEDULE`** — each day's date, theme title, and activities
  (time, title, emoji, location, point value, description).

Edit those arrays to match your real reunion — dates are ISO `YYYY-MM-DD`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell, header, tab bar, camper modal |
| `styles.css` | Summer-camp theme, mobile-first layout |
| `app.js` | Views, routing, points, photos, badges |
| `data.js` | Camp schedule and camper list (edit me!) |
