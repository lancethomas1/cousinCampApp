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
// `photo` (optional) is a real headshot shown in place of the emoji — drop a
// square photo in the photos/ folder and point to it here. Cousins without a
// photo fall back to their emoji automatically.
const CAMPERS = [
  { id: "laila",   name: "Laila",   emoji: "🦄", color: "#e84393", parents: "Chris", photo: "photos/laila.jpg" },
  { id: "william", name: "William", emoji: "🧢", color: "#ef6c4d", parents: "Lance & Betsy", photo: "photos/william.jpg" },
  { id: "sophie",  name: "Sophie",  emoji: "🦋", color: "#2980b9", parents: "Chris", photo: "photos/sophie.jpg" },
  { id: "samuel",  name: "Samuel",  emoji: "⚽", color: "#27ae60", parents: "Lance & Betsy", photo: "photos/samuel.jpg" },
  { id: "logan",   name: "Logan",   emoji: "🦖", color: "#8e44ad", parents: "Jason & Sera", photo: "photos/logan.jpg" },
  { id: "zoe",     name: "Zoe",     emoji: "🌈", color: "#f39c12", parents: "Jason & Sera", photo: "photos/zoe.jpg" },
  { id: "leo",     name: "Leo",     emoji: "🦁", color: "#16a085", parents: "Lance & Betsy", photo: "photos/leo.jpg" },
  { id: "ava",     name: "Ava",     emoji: "🌸", color: "#d63384", parents: "Shannon & Vinny", photo: "photos/ava.jpg" },
  { id: "noel",    name: "Noel",    emoji: "🐥", color: "#00b894", parents: "Jason & Sera", photo: "photos/noel.jpg" },
];

// Extra grown-ups who help run camp but have no kids of their own here
// (grandparents, aunts, uncles). They show up in the parents' app sign-in and
// can award points, kudos, and badges to ANY cousin. `name` is the first name
// they sign in with; `nickname` is what the cousins call them.
const GROWNUPS = [
  { name: "Carole", nickname: "Mimi"  },
  { name: "Keith",  nickname: "Papaw" },
];

// The camp schedule. Camp runs five days, June 22–26, 2026.
// Monday & Tuesday are filled in with Mimi's real plans; Wed–Fri are still
// neutral placeholder slots. Edit the titles, times, locations, points, and
// descriptions to match the rest of the plans. You can add or remove
// activities freely. `era` (optional) shows as the day's theme banner.
const SCHEDULE = [
  {
    date: "2026-06-22",
    title: "Monday — Sera's Birthday! 🎂",
    era: "Time Travelers: 90 Years",
    activities: [
      { id: "d1-a1",  time: "6:30 AM",  title: "TV Room Opens",            emoji: "📺", location: "TV Room",          points: 5,  desc: "Quiet time — not before 6:30!" },
      { id: "d1-a2",  time: "8:00 AM",  title: "Breakfast",                emoji: "🥞", location: "Mimi's Kitchen",   points: 5,  desc: "Fuel up for time travel." },
      { id: "d1-a3",  time: "8:20 AM",  title: "Get Dressed",              emoji: "👕", location: "Upstairs",         points: 5,  desc: "Girls in Mimi's bathroom, boys in the guest room." },
      { id: "d1-a4",  time: "8:30 AM",  title: "Meeting on the Porch",     emoji: "🎤", location: "Back Porch",       points: 5,  desc: "Welcome to Cousin Camp!" },
      { id: "d1-a5",  time: "8:45 AM",  title: "Papaw with Guitar",        emoji: "🎸", location: "Back Porch",       points: 5,  desc: "Sing along with Papaw." },
      { id: "d1-a6",  time: "9:00 AM",  title: "T-Shirts & Pictures",      emoji: "📸", location: "Back Porch",       points: 10, desc: "Camp shirts on — say cheese!" },
      { id: "d1-a7",  time: "9:15 AM",  title: "Decorate Water Bottles",   emoji: "🍶", location: "Craft Table",      points: 10, desc: "Decorate your bottle in 80s–90s style." },
      { id: "d1-a8",  time: "9:30 AM",  title: "Time Travelers: 90 Years", emoji: "🕰️", location: "Time Line",        points: 15, desc: "Lay out the timeline, scavenger hunt, add family members, and meet the Time Machine!" },
      { id: "d1-a9",  time: "10:15 AM", title: "Fruit Snack",              emoji: "🍎", location: "Mimi's Kitchen",   points: 5,  desc: "Snacks from the 30s–50s." },
      { id: "d1-a10", time: "10:30 AM", title: "Time Machine: Guess Who?!", emoji: "❓", location: "Living Room",      points: 10, desc: "Can you guess who steps out of the Time Machine?" },
      { id: "d1-a11", time: "11:00 AM", title: "60s Craft: Paper Mâché",   emoji: "🎨", location: "Craft Table",      points: 15, desc: "Paper mâché plus Heber birthday decorations." },
      { id: "d1-a12", time: "12:00 PM", title: "Lunch",                    emoji: "🍽️", location: "Mimi's Kitchen",   points: 5,  desc: "Refuel together." },
      { id: "d1-a13", time: "1:00 PM",  title: "Pool at Rebecca's",        emoji: "🏊", location: "Rebecca's",        points: 10, desc: "Splash and swim." },
      { id: "d1-a14", time: "3:30 PM",  title: "Home",                     emoji: "🏡", location: "Mimi's",           points: 5,  desc: "Back to base." },
      { id: "d1-a15", time: "4:00 PM",  title: "Slang Hats with Christopher", emoji: "🎩", location: "Living Room",   points: 10, desc: "Time travelers through the decades of slang." },
      { id: "d1-a16", time: "5:00 PM",  title: "Time Travel TV Show",      emoji: "📺", location: "TV Room",          points: 10, desc: "Watch a show from another decade." },
      { id: "d1-a17", time: "5:30 PM",  title: "Dinner on the Porch",      emoji: "🍽️", location: "Back Porch",       points: 5,  desc: "Eat together outside." },
      { id: "d1-a18", time: "6:30 PM",  title: "Fishing",                  emoji: "🎣", location: "The Pond",         points: 10, desc: "Cast a line and see what bites." },
      { id: "d1-a19", time: "8:30 PM",  title: "Sera's Birthday Cake",     emoji: "🎂", location: "Back Porch",       points: 10, desc: "Happy birthday, Sera!" },
      { id: "d1-a20", time: "8:45 PM",  title: "Baths",                    emoji: "🛁", location: "Upstairs",         points: 5,  desc: "Scrub up before bed." },
      { id: "d1-a21", time: "9:00 PM",  title: "Jerry Stories",            emoji: "📖", location: "Upstairs",         points: 5,  desc: "Story time with Jerry." },
      { id: "d1-a22", time: "9:15 PM",  title: "Bed",                      emoji: "😴", location: "Upstairs",         points: 5,  desc: "All upstairs — sisters share beds, brothers share beds." },
    ],
  },
  {
    date: "2026-06-23",
    title: "Tuesday",
    era: "Evolution of Music & Dance",
    activities: [
      { id: "d2-a1",  time: "6:30 AM",  title: "TV Room Opens",            emoji: "📺", location: "TV Room",          points: 5,  desc: "Quiet time — not before 6:30!" },
      { id: "d2-a2",  time: "7:45 AM",  title: "Breakfast",                emoji: "🥞", location: "Mimi's Kitchen",   points: 5,  desc: "Start the day together." },
      { id: "d2-a3",  time: "8:15 AM",  title: "Get Dressed",              emoji: "👕", location: "Upstairs",         points: 5,  desc: "Ready for the day." },
      { id: "d2-a4",  time: "8:20 AM",  title: "Capoeira with Chris",      emoji: "🥋", location: "Back Yard",        points: 10, desc: "Move and groove, Brazilian style." },
      { id: "d2-a5",  time: "8:30 AM",  title: "Meeting on the Porch",     emoji: "🎤", location: "Back Porch",       points: 5,  desc: "Papaw leads songs." },
      { id: "d2-a6",  time: "8:35 AM",  title: "Guess the Decade",         emoji: "🕰️", location: "Time Line",        points: 10, desc: "Timeline's out — guess the decade!" },
      { id: "d2-a7",  time: "9:00 AM",  title: "Finish Paper Mâché",       emoji: "🎨", location: "Craft Table",      points: 10, desc: "Finish yesterday's masterpiece." },
      { id: "d2-a8",  time: "10:00 AM", title: "Leave for Church",         emoji: "⛪", location: "Church",           points: 10, desc: "Start practicing for the Variety Show: The Evolution of Music & Dance." },
      { id: "d2-a9",  time: "12:00 PM", title: "Lunch at Home",            emoji: "🍽️", location: "Mimi's Kitchen",   points: 5,  desc: "Refuel together." },
      { id: "d2-a10", time: "1:00 PM",  title: "Swim at Rebecca's",        emoji: "🏊", location: "Rebecca's",        points: 10, desc: "Cool off in the pool." },
      { id: "d2-a11", time: "4:00 PM",  title: "Games and Crafts",         emoji: "🎲", location: "Craft Table",      points: 10, desc: "Play and create." },
      { id: "d2-a12", time: "5:00 PM",  title: "Free Willy with Lance",    emoji: "🐳", location: "TV Room",          points: 10, desc: "Movie time with Uncle Lance." },
      { id: "d2-a13", time: "5:30 PM",  title: "Dinner with Sera & Jason", emoji: "🍽️", location: "Back Porch",       points: 5,  desc: "Sera and Jason cook." },
      { id: "d2-a14", time: "6:30 PM",  title: "Futrell Farm",             emoji: "🚜", location: "Futrell Farm",     points: 10, desc: "Adventure on the farm." },
      { id: "d2-a15", time: "8:30 PM",  title: "Baths",                    emoji: "🛁", location: "Upstairs",         points: 5,  desc: "Scrub up before bed." },
      { id: "d2-a16", time: "9:00 PM",  title: "Story or Book",            emoji: "📖", location: "Upstairs",         points: 5,  desc: "Wind down with a story." },
      { id: "d2-a17", time: "9:15 PM",  title: "Bed",                      emoji: "😴", location: "Upstairs",         points: 5,  desc: "Lights out, time travelers." },
    ],
  },
  {
    date: "2026-06-24",
    title: "Wednesday — Cabin Day!",
    era: "Putt Putt & Pool",
    activities: [
      { id: "d3-a1",  time: "6:30 AM",  title: "TV Room Opens",            emoji: "📺", location: "TV Room",            points: 5,  desc: "Quiet time — not before 6:30!" },
      { id: "d3-a2",  time: "7:45 AM",  title: "Breakfast",                emoji: "🥞", location: "Mimi's Kitchen",     points: 5,  desc: "Start the day together." },
      { id: "d3-a3",  time: "8:15 AM",  title: "Get Dressed & Pack",       emoji: "🎒", location: "Upstairs",           points: 10, desc: "Bathing suit under your clothes — and pack for the cabin!" },
      { id: "d3-a4",  time: "8:30 AM",  title: "Meeting on the Porch",     emoji: "🎤", location: "Back Porch",         points: 5,  desc: "Plan out the day." },
      { id: "d3-a5",  time: "9:00 AM",  title: "Leave for Putt Putt",      emoji: "🚗", location: "On the Road",        points: 5,  desc: "Load up and head out." },
      { id: "d3-a6",  time: "10:00 AM", title: "Putt Putt at Maggie's",    emoji: "⛳", location: "Maggie's",           points: 15, desc: "Mini golf showdown!" },
      { id: "d3-a7",  time: "12:00 PM", title: "Picnic Lunch",             emoji: "🧺", location: "Picnic Spot",        points: 5,  desc: "Eat outside together." },
      { id: "d3-a8",  time: "1:00 PM",  title: "Pool at Kentucky Dam Lodge", emoji: "🏊", location: "Kentucky Dam Lodge", points: 10, desc: "Splash and swim." },
      { id: "d3-a9",  time: "4:00 PM",  title: "Check in to Cabin",        emoji: "🏕️", location: "The Cabin",          points: 10, desc: "Settle in, then practice the Evolution of Music & Dance." },
      { id: "d3-a10", time: "5:00 PM",  title: "Pizza",                    emoji: "🍕", location: "The Cabin",          points: 5,  desc: "Pizza night!" },
      { id: "d3-a11", time: "8:30 PM",  title: "Movie: Back to the Future", emoji: "🎬", location: "The Cabin",          points: 10, desc: "Great Scott — movie time!" },
    ],
  },
  {
    date: "2026-06-25",
    title: "Thursday — Variety Show!",
    era: "Variety Show Day",
    activities: [
      { id: "d4-a1",  time: "6:30 AM",  title: "TV Room Opens",            emoji: "📺", location: "TV Room",            points: 5,  desc: "Quiet time — not before 6:30!" },
      { id: "d4-a2",  time: "8:00 AM",  title: "Breakfast",                emoji: "🥞", location: "The Cabin",          points: 5,  desc: "Start the day together." },
      { id: "d4-a3",  time: "9:00 AM",  title: "Practice Variety Show",    emoji: "🎭", location: "The Cabin",          points: 15, desc: "Rehearse at the cabin." },
      { id: "d4-a4",  time: "10:00 AM", title: "Check Out of Hotel",       emoji: "🧳", location: "The Cabin",          points: 5,  desc: "Pack up and check out." },
      { id: "d4-a5",  time: "10:15 AM", title: "Swim in Pool",             emoji: "🏊", location: "The Pool",           points: 10, desc: "One more swim — snacks too!" },
      { id: "d4-a6",  time: "12:00 PM", title: "Lunch Out",                emoji: "🍽️", location: "Out",                points: 5,  desc: "Lunch on the town." },
      { id: "d4-a7",  time: "1:30 PM",  title: "Church: Practice Variety Show", emoji: "⛪", location: "Church",        points: 15, desc: "Dress rehearsal on the big stage." },
      { id: "d4-a8",  time: "3:30 PM",  title: "Sera, Korea",              emoji: "🇰🇷", location: "Church",             points: 10, desc: "Sera shares about Korea." },
      { id: "d4-a9",  time: "4:00 PM",  title: "Soccer, Games or Andy Griffith", emoji: "⚽", location: "Outside",     points: 10, desc: "Soccer, games, or the Andy Griffith Show." },
      { id: "d4-a10", time: "5:00 PM",  title: "TV Time",                  emoji: "📺", location: "TV Room",            points: 5,  desc: "Relax before the show." },
      { id: "d4-a11", time: "5:30 PM",  title: "Dinner",                   emoji: "🍽️", location: "Mimi's Kitchen",     points: 5,  desc: "Eat up before showtime." },
      { id: "d4-a12", time: "6:30 PM",  title: "Variety Show",             emoji: "🌟", location: "Show Stage",         points: 20, desc: "The big show — parents come at 7:00!" },
      { id: "d4-a13", time: "8:00 PM",  title: "Water Balloon Fight",     emoji: "🎈", location: "Back Yard",          points: 10, desc: "Soak everyone!" },
      { id: "d4-a14", time: "8:30 PM",  title: "Baths",                    emoji: "🛁", location: "Upstairs",           points: 5,  desc: "Scrub up before bed." },
      { id: "d4-a15", time: "9:00 PM",  title: "Bed",                      emoji: "😴", location: "Upstairs",           points: 5,  desc: "Lights out — what a day!" },
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
const PHOTO_ALBUM_URL = "https://photos.app.goo.gl/ro6wZccAxgrEaB9A9";

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

// Make available to app.js
window.CAMP_DATA = { CAMPERS, GROWNUPS, SCHEDULE, STORE, PHOTO_ALBUM_URL, KUDOS, BONUS_QUICK, PARENT_BADGES };
