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
const CAMPERS = [
  { id: "laila",   name: "Laila",   emoji: "🦄", color: "#e84393" },
  { id: "william", name: "William", emoji: "🧢", color: "#ef6c4d" },
  { id: "sophie",  name: "Sophie",  emoji: "🦋", color: "#2980b9" },
  { id: "samuel",  name: "Samuel",  emoji: "⚽", color: "#27ae60" },
  { id: "logan",   name: "Logan",   emoji: "🦖", color: "#8e44ad" },
  { id: "zoe",     name: "Zoe",     emoji: "🌈", color: "#f39c12" },
  { id: "leo",     name: "Leo",     emoji: "🦁", color: "#16a085" },
  { id: "ava",     name: "Ava",     emoji: "🌸", color: "#d63384" },
  { id: "noel",    name: "Noel",    emoji: "🐥", color: "#00b894" },
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

// Make available to app.js
window.CAMP_DATA = { CAMPERS, SCHEDULE, STORE };
