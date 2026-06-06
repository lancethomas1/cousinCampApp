/*
 * Cousin Camp — camp data
 * -------------------------------------------------------------
 * THEME (2026): Time Machine Travelers 🕰️
 * Each day Mimi's time machine lands in a different era.
 * Edit this file to change the schedule, travelers, or prizes.
 * Dates are ISO strings (YYYY-MM-DD). Times are display strings.
 */

// The cousins (time travelers). `id` is used internally and must be unique.
// First names only — keep it that way if the repo is public.
// `parents` lists each cousin's grown-ups (shown on the camp roster).
const CAMPERS = [
  { id: "laila",   name: "Laila",   emoji: "🦄", color: "#e84393", parents: "Chris" },
  { id: "william", name: "William", emoji: "🧢", color: "#ef6c4d", parents: "Lance & Betsy" },
  { id: "sophie",  name: "Sophie",  emoji: "🦋", color: "#2980b9", parents: "Chris" },
  { id: "samuel",  name: "Samuel",  emoji: "⚽", color: "#27ae60", parents: "Lance & Betsy" },
  { id: "logan",   name: "Logan",   emoji: "🦖", color: "#8e44ad", parents: "Jason & Sera" },
  { id: "zoe",     name: "Zoe",     emoji: "🌈", color: "#f39c12", parents: "Jason & Sera" },
  { id: "leo",     name: "Leo",     emoji: "🦁", color: "#16a085", parents: "Lance & Betsy" },
  { id: "ava",     name: "Ava",     emoji: "🌸", color: "#d63384", parents: "Shannon & Vinny" },
  { id: "noel",    name: "Noel",    emoji: "🐥", color: "#00b894", parents: "Jason & Sera" },
];

// The camp schedule. Camp runs five days, June 22–26, 2026.
// Day themes are off for now — these are neutral placeholder slots.
// Edit the titles, times, locations, points, and descriptions to match
// Mimi's real plans. You can add or remove activities freely.
const SCHEDULE = [
  {
    date: "2026-06-22",
    title: "Day 1",
    activities: [
      { id: "d1-a1", time: "9:00 AM", title: "Breakfast",           emoji: "🥞", location: "Mimi's Kitchen", points: 5,  desc: "Start the day together." },
      { id: "d1-a2", time: "11:00 AM", title: "Morning Activity",   emoji: "☀️", location: "TBD",            points: 10, desc: "To be announced!" },
      { id: "d1-a3", time: "2:00 PM",  title: "Afternoon Activity", emoji: "🎨", location: "TBD",            points: 10, desc: "To be announced!" },
      { id: "d1-a4", time: "7:00 PM",  title: "Evening Campfire",   emoji: "🔥", location: "Fire Pit",       points: 5,  desc: "Wind down together." },
    ],
  },
  {
    date: "2026-06-23",
    title: "Day 2",
    activities: [
      { id: "d2-a1", time: "9:00 AM", title: "Breakfast",           emoji: "🥞", location: "Mimi's Kitchen", points: 5,  desc: "Start the day together." },
      { id: "d2-a2", time: "11:00 AM", title: "Morning Activity",   emoji: "☀️", location: "TBD",            points: 10, desc: "To be announced!" },
      { id: "d2-a3", time: "2:00 PM",  title: "Afternoon Activity", emoji: "🎨", location: "TBD",            points: 10, desc: "To be announced!" },
      { id: "d2-a4", time: "7:00 PM",  title: "Evening Campfire",   emoji: "🔥", location: "Fire Pit",       points: 5,  desc: "Wind down together." },
    ],
  },
  {
    date: "2026-06-24",
    title: "Day 3",
    activities: [
      { id: "d3-a1", time: "9:00 AM", title: "Breakfast",           emoji: "🥞", location: "Mimi's Kitchen", points: 5,  desc: "Start the day together." },
      { id: "d3-a2", time: "11:00 AM", title: "Morning Activity",   emoji: "☀️", location: "TBD",            points: 10, desc: "To be announced!" },
      { id: "d3-a3", time: "2:00 PM",  title: "Afternoon Activity", emoji: "🎨", location: "TBD",            points: 10, desc: "To be announced!" },
      { id: "d3-a4", time: "7:00 PM",  title: "Evening Campfire",   emoji: "🔥", location: "Fire Pit",       points: 5,  desc: "Wind down together." },
    ],
  },
  {
    date: "2026-06-25",
    title: "Day 4",
    activities: [
      { id: "d4-a1", time: "9:00 AM", title: "Breakfast",           emoji: "🥞", location: "Mimi's Kitchen", points: 5,  desc: "Start the day together." },
      { id: "d4-a2", time: "11:00 AM", title: "Morning Activity",   emoji: "☀️", location: "TBD",            points: 10, desc: "To be announced!" },
      { id: "d4-a3", time: "2:00 PM",  title: "Afternoon Activity", emoji: "🎨", location: "TBD",            points: 10, desc: "To be announced!" },
      { id: "d4-a4", time: "7:00 PM",  title: "Evening Campfire",   emoji: "🔥", location: "Fire Pit",       points: 5,  desc: "Wind down together." },
    ],
  },
  {
    date: "2026-06-26",
    title: "Day 5",
    activities: [
      { id: "d5-a1", time: "9:00 AM", title: "Breakfast",           emoji: "🥞", location: "Mimi's Kitchen", points: 5,  desc: "Start the day together." },
      { id: "d5-a2", time: "11:00 AM", title: "Morning Activity",   emoji: "☀️", location: "TBD",            points: 10, desc: "To be announced!" },
      { id: "d5-a3", time: "1:00 PM",  title: "Awards Ceremony",    emoji: "🏆", location: "Back Porch",     points: 15, desc: "Mimi hands out the camp medals and certificates." },
      { id: "d5-a4", time: "3:00 PM",  title: "Goodbye Hugs",       emoji: "🤗", location: "Front Yard",     points: 5,  desc: "Until next year!" },
    ],
  },
];

// Camp Store — "Pick Your Prize" board.
// There are nine one-of-a-kind rewards, one for each time traveler. A reward
// can only be claimed by a single camper, and each camper holds one reward, so
// every cousin ends the week with their own different prize.
// `cost` is how many time points it takes to claim it.
const STORE = [
  { id: "r-movie",     emoji: "🎬", name: "Time-Screen Movie Pick", cost: 40, desc: "You choose what the whole camp watches on movie night." },
  { id: "r-latenight", emoji: "🌙", name: "Stay-Up-Late Pass",      cost: 45, desc: "Bend the timeline — stay up 30 extra minutes past bedtime." },
  { id: "r-dessert",   emoji: "🍦", name: "Dessert Captain",        cost: 25, desc: "First scoop, extra sprinkles — top of the dessert line all day." },
  { id: "r-game",      emoji: "🎮", name: "Game Master",            cost: 35, desc: "You pick the next big game the whole camp plays." },
  { id: "r-copilot",   emoji: "🛸", name: "Time Machine Co-Pilot",  cost: 30, desc: "Ride up front / sit shotgun on the next camp outing." },
  { id: "r-helper",    emoji: "👑", name: "Mimi's Time Captain",    cost: 45, desc: "Be Mimi's special right-hand helper for a whole day." },
  { id: "r-chore",     emoji: "⏭️", name: "Time-Skip a Chore",      cost: 30, desc: "Fast-forward past one camp chore, no questions asked." },
  { id: "r-mystery",   emoji: "🎟️", name: "Mystery from the Future", cost: 50, desc: "A surprise from Mimi's prize box — nobody knows what's inside!" },
  { id: "r-smore",     emoji: "🍫", name: "S'more Master",          cost: 25, desc: "Unlimited s'mores at the next bonfire. Yes, unlimited." },
];

// Shared Google Photos album link. Paste the "share" link to your camp's
// Google Photos album here and the Photos tab will open it. Leave blank to
// show a "coming soon" placeholder.
const PHOTO_ALBUM_URL = "";

// ---------------------------------------------------------------------------
// PARENT AWARDS — recognition that grown-ups hand out.
// At Cousin Camp the grown-ups (Mimi, parents, aunts & uncles) award the extra
// points. The "Kudos" tab lets any grown-up pick a cousin and tap to award:
//   • Kudos cards  — in-the-moment recognition, each worth bonus points
//   • Bonus points — a custom amount with an optional note
//   • Parent badges — special one-of-a-kind honors for the trophy case
// In shared mode these sync to every device alongside points and prizes.
// Edit these arrays to change what grown-ups can hand out.
// ---------------------------------------------------------------------------

// Kudos cards. Tap one to award it to the chosen cousin (adds `points`).
const KUDOS = [
  { id: "k-kind",    emoji: "🤝", label: "Kindness",      points: 10, desc: "Was kind to a cousin." },
  { id: "k-helper",  emoji: "🦸", label: "Super Helper",  points: 10, desc: "Helped out without being asked." },
  { id: "k-sport",   emoji: "🤸", label: "Good Sport",    points: 10, desc: "Won or lost with a smile." },
  { id: "k-brave",   emoji: "🦁", label: "Brave",         points: 10, desc: "Tried something new or scary." },
  { id: "k-share",   emoji: "🎁", label: "Great Sharing", points: 10, desc: "Shared with the whole group." },
  { id: "k-clean",   emoji: "🧹", label: "Big Cleanup",   points: 10, desc: "Cleaned up like a champ." },
  { id: "k-manners", emoji: "💬", label: "Kind Words",    points:  5, desc: "Please, thank you, and kindness." },
  { id: "k-listen",  emoji: "👂", label: "Good Listener", points:  5, desc: "Listened to Mimi the first time." },
  { id: "k-leader",  emoji: "⭐", label: "Camp Leader",   points: 15, desc: "Led the cousins by example." },
  { id: "k-extra",   emoji: "💪", label: "Extra Effort",  points: 15, desc: "Went above and beyond." },
];

// Quick-tap bonus point amounts (a custom amount is always available too).
const BONUS_QUICK = [5, 10, 25];

// Special badges a grown-up can grant or take back. These join the camper's
// trophy case alongside the badges earned from activities.
const PARENT_BADGES = [
  { id: "pb-star",     emoji: "🌟", label: "Camper of the Day", desc: "The standout cousin today." },
  { id: "pb-helper",   emoji: "🫶", label: "Mimi's Helper",     desc: "Mimi's right hand all day long." },
  { id: "pb-kind",     emoji: "💝", label: "Kindness Award",    desc: "Spread the most kindness." },
  { id: "pb-explorer", emoji: "🧭", label: "Bold Explorer",     desc: "The most adventurous traveler." },
  { id: "pb-artist",   emoji: "🎨", label: "Camp Artist",       desc: "Dazzling camp creativity." },
  { id: "pb-peace",    emoji: "🕊️", label: "Peacemaker",        desc: "Helped the cousins get along." },
];

// PARENTS — the grown-ups' app sign-in + fairness rule.
// Each parent types their first name to open the grown-ups' app. A parent may
// give kudos/points/badges to every cousin EXCEPT their own kids (listed here),
// so nobody can pad their own kids' scores. Names are matched case-insensitively.
// Grown-ups whose name isn't listed (e.g. Mimi, aunts, uncles) can award everyone.
// Add one entry per parent. Two parents of the same kids? Add two entries.
const PARENTS = [
  { name: "Lance", kids: ["william", "samuel", "leo"] },

  // Fill in the rest of the family — kid ids for convenience:
  //   Inman kids:    "laila", "sophie"
  //   Hines kids:    "logan", "zoe", "noel"
  //   Quinones kids: "ava"
  // e.g. { name: "Mom", kids: ["laila", "sophie"] },
];

// Make available to app.js
window.CAMP_DATA = { CAMPERS, SCHEDULE, STORE, PHOTO_ALBUM_URL, KUDOS, BONUS_QUICK, PARENT_BADGES, PARENTS };
