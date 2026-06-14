/*
 * Cousin Camp — camp data
 * -------------------------------------------------------------
 * THEME (2026): Time Machine Travelers 🕰️
 * Each day Mimi's time machine lands in a different era.
 * Edit this file to change the schedule or travelers.
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
//
// HOW POINTS WORK: every cousin does every activity, so there's no per-kid
// "check in." Instead, points come from getting *prepared*. Give an activity a
// `prep` checklist and it becomes a "Get Prepared" card — each cousin ticks
// their own items (sunscreen on, towel packed, …) and earns the activity's
// `points` once their whole list is checked.
//
// `prep: ["Sunscreen on", "Towel packed"]` (optional) — turns an activity into
// a points-earning prepared card. Without it, an activity is just shown on the
// schedule for reference (no points, nothing to tick).
//
// `info: true` (optional) styles a reference slot as a muted "heads up" card —
// meals, getting dressed, baths, bedtime, and other routine moments. (An item
// with `prep` is always a prepared card; `info` only affects no-prep slots.)
//
// `cook: "Thomas"` (optional) names the family on cooking duty for that meal —
// it shows as a "👨‍🍳 Cooking: …" badge on the card so everyone knows whose
// turn it is in the kitchen.
const SCHEDULE = [
  {
    date: "2026-06-22",
    title: "Monday — Sera's Birthday! 🎂",
    era: "Time Travelers: 90 Years",
    activities: [
      { id: "d1-a1",  time: "6:30 AM",  title: "TV Room Opens",            emoji: "📺", location: "TV Room",          points: 5,  info: true, desc: "Quiet time — not before 6:30!" },
      { id: "d1-a2",  time: "7:45 AM",  title: "Breakfast",                emoji: "🥞", location: "Mimi's Kitchen",   points: 5,  info: true, cook: "Thomas", desc: "Fuel up for time travel." },
      { id: "d1-cap", time: "8:15 AM",  title: "Capoeira with Chris",      emoji: "🥋", location: "Back Yard",        points: 10, prep: ["Comfy clothes on", "Shoes tied", "Water bottle filled"], desc: "Move and groove, Brazilian style." },
      { id: "d1-a3",  time: "8:10 AM",  title: "Get Dressed",              emoji: "👕", location: "Upstairs",         points: 5,  info: true, desc: "Girls in Mimi's bathroom, boys in the guest room." },
      { id: "d1-a4",  time: "8:30 AM",  title: "Meeting on the Porch",     emoji: "🎤", location: "Back Porch",       points: 5,  desc: "Welcome to Cousin Camp!" },
      { id: "d1-a5",  time: "8:45 AM",  title: "Papaw with Guitar",        emoji: "🎸", location: "Back Porch",       points: 5,  desc: "Sing along with Papaw." },
      { id: "d1-a6",  time: "9:00 AM",  title: "T-Shirts & Pictures",      emoji: "📸", location: "Back Porch",       points: 10, desc: "Camp shirts on — say cheese!" },
      { id: "d1-a7",  time: "9:15 AM",  title: "Decorate Water Bottles",   emoji: "🍶", location: "Craft Table",      points: 10, desc: "Decorate your bottle in 80s–90s style." },
      { id: "d1-a8",  time: "9:30 AM",  title: "Time Travelers: 90 Years", emoji: "🕰️", location: "Time Line",        points: 15, desc: "Lay out the timeline, scavenger hunt, add family members, and meet the Time Machine!" },
      { id: "d1-a9",  time: "10:15 AM", title: "Fruit Snack",              emoji: "🍎", location: "Mimi's Kitchen",   points: 5,  info: true, desc: "Snacks from the 30s–50s." },
      { id: "d1-a10", time: "10:30 AM", title: "Time Machine: Guess Who?!", emoji: "❓", location: "Living Room",      points: 10, desc: "Can you guess who steps out of the Time Machine?" },
      { id: "d1-a11", time: "11:00 AM", title: "60s Craft: Paper Mâché",   emoji: "🎨", location: "Craft Table",      points: 15, desc: "Paper mâché plus Heber birthday decorations." },
      { id: "d1-a12", time: "12:00 PM", title: "Lunch",                    emoji: "🍽️", location: "Mimi's Kitchen",   points: 5,  info: true, desc: "Refuel together." },
      { id: "d1-a13", time: "1:00 PM",  title: "Pool at Rebecca's",        emoji: "🏊", location: "Rebecca's",        points: 10, prep: ["Sunscreen on", "Swimsuit on", "Towel packed", "Water bottle filled"], desc: "Splash and swim." },
      { id: "d1-a14", time: "3:30 PM",  title: "Home",                     emoji: "🏡", location: "Mimi's",           points: 5,  info: true, desc: "Back to base." },
      { id: "d1-a15", time: "4:00 PM",  title: "Slang Hats with Christopher", emoji: "🎩", location: "Living Room",   points: 10, desc: "Time travelers through the decades of slang." },
      { id: "d1-a16", time: "5:00 PM",  title: "Time Travel TV Show",      emoji: "📺", location: "TV Room",          points: 10, desc: "Watch a show from another decade." },
      { id: "d1-a17", time: "5:30 PM",  title: "Dinner on the Porch",      emoji: "🍽️", location: "Back Porch",       points: 5,  info: true, cook: "Thomas", desc: "Eat together outside." },
      { id: "d1-a18", time: "6:30 PM",  title: "Fishing",                  emoji: "🎣", location: "The Pond",         points: 10, prep: ["Bug spray on", "Hat on", "Grabbed a fishing pole"], desc: "Cast a line and see what bites." },
      { id: "d1-a19", time: "8:30 PM",  title: "Sera's Birthday Cake",     emoji: "🎂", location: "Back Porch",       points: 10, desc: "Happy birthday, Sera!" },
      { id: "d1-a20", time: "8:45 PM",  title: "Baths",                    emoji: "🛁", location: "Upstairs",         points: 5,  info: true, desc: "Scrub up before bed." },
      { id: "d1-a21", time: "9:00 PM",  title: "Jerry Stories",            emoji: "📖", location: "Upstairs",         points: 5,  desc: "Story time with Jerry." },
      { id: "d1-a22", time: "9:15 PM",  title: "Bed",                      emoji: "😴", location: "Upstairs",         points: 5,  info: true, desc: "All upstairs — sisters share beds, brothers share beds." },
    ],
  },
  {
    date: "2026-06-23",
    title: "Tuesday",
    era: "Evolution of Music & Dance",
    activities: [
      { id: "d2-a1",  time: "6:30 AM",  title: "TV Room Opens",            emoji: "📺", location: "TV Room",          points: 5,  info: true, desc: "Quiet time — not before 6:30!" },
      { id: "d2-a2",  time: "7:45 AM",  title: "Breakfast",                emoji: "🥞", location: "Mimi's Kitchen",   points: 5,  info: true, cook: "Quinones", desc: "Start the day together." },
      { id: "d2-a3",  time: "8:10 AM",  title: "Get Dressed",              emoji: "👕", location: "Upstairs",         points: 5,  info: true, desc: "Ready for the day." },
      { id: "d2-a4",  time: "8:15 AM",  title: "Capoeira with Chris",      emoji: "🥋", location: "Back Yard",        points: 10, prep: ["Comfy clothes on", "Shoes tied", "Water bottle filled"], desc: "Move and groove, Brazilian style." },
      { id: "d2-a5",  time: "8:30 AM",  title: "Meeting on the Porch",     emoji: "🎤", location: "Back Porch",       points: 5,  desc: "Papaw leads songs." },
      { id: "d2-a6",  time: "8:35 AM",  title: "Guess the Decade",         emoji: "🕰️", location: "Time Line",        points: 10, desc: "Timeline's out — guess the decade!" },
      { id: "d2-a7",  time: "9:00 AM",  title: "Finish Paper Mâché",       emoji: "🎨", location: "Craft Table",      points: 10, desc: "Finish yesterday's masterpiece." },
      { id: "d2-a8",  time: "10:00 AM", title: "Leave for Church",         emoji: "⛪", location: "Church",           points: 10, desc: "Start practicing for the Variety Show: The Evolution of Music & Dance." },
      { id: "d2-a9",  time: "12:00 PM", title: "Lunch at Home",            emoji: "🍽️", location: "Mimi's Kitchen",   points: 5,  info: true, desc: "Refuel together." },
      { id: "d2-a10", time: "1:00 PM",  title: "Swim at Rebecca's",        emoji: "🏊", location: "Rebecca's",        points: 10, prep: ["Sunscreen on", "Swimsuit on", "Towel packed", "Water bottle filled"], desc: "Cool off in the pool." },
      { id: "d2-a11", time: "4:00 PM",  title: "Games and Crafts",         emoji: "🎲", location: "Craft Table",      points: 10, desc: "Play and create." },
      { id: "d2-a12", time: "5:00 PM",  title: "Free Willy with Lance",    emoji: "🐳", location: "TV Room",          points: 10, desc: "Movie time with Uncle Lance." },
      { id: "d2-a13", time: "5:30 PM",  title: "Dinner",                   emoji: "🍽️", location: "Back Porch",       points: 5,  info: true, cook: "Hines", desc: "Eat together outside." },
      { id: "d2-a14", time: "6:30 PM",  title: "Futrell Farm",             emoji: "🚜", location: "Futrell Farm",     points: 10, prep: ["Closed-toe shoes on", "Bug spray on", "Hat on"], desc: "Adventure on the farm." },
      { id: "d2-a15", time: "8:30 PM",  title: "Baths",                    emoji: "🛁", location: "Upstairs",         points: 5,  info: true, desc: "Scrub up before bed." },
      { id: "d2-a16", time: "9:00 PM",  title: "Story or Book",            emoji: "📖", location: "Upstairs",         points: 5,  desc: "Wind down with a story." },
      { id: "d2-a17", time: "9:15 PM",  title: "Bed",                      emoji: "😴", location: "Upstairs",         points: 5,  info: true, desc: "Lights out, time travelers." },
    ],
  },
  {
    date: "2026-06-24",
    title: "Wednesday — Cabin Day!",
    era: "Putt Putt & Pool",
    activities: [
      { id: "d3-a1",  time: "6:30 AM",  title: "TV Room Opens",            emoji: "📺", location: "TV Room",            points: 5,  info: true, desc: "Quiet time — not before 6:30!" },
      { id: "d3-a2",  time: "7:45 AM",  title: "Breakfast",                emoji: "🥞", location: "Mimi's Kitchen",     points: 5,  info: true, cook: "Christopher", desc: "Start the day together." },
      { id: "d3-a3",  time: "8:10 AM",  title: "Get Dressed & Pack",       emoji: "🎒", location: "Upstairs",           points: 10, prep: ["Swimsuit on under clothes", "Cabin bag packed", "PJs & toothbrush packed"], desc: "Bathing suit under your clothes — and pack for the cabin!" },
      { id: "d3-cap", time: "8:15 AM",  title: "Capoeira with Chris",      emoji: "🥋", location: "Back Yard",          points: 10, prep: ["Comfy clothes on", "Shoes tied", "Water bottle filled"], desc: "Move and groove, Brazilian style." },
      { id: "d3-a4",  time: "8:30 AM",  title: "Meeting on the Porch",     emoji: "🎤", location: "Back Porch",         points: 5,  desc: "Plan out the day." },
      { id: "d3-a5",  time: "9:00 AM",  title: "Leave for Putt Putt",      emoji: "🚗", location: "On the Road",        points: 5,  info: true, desc: "Load up and head out." },
      { id: "d3-a6",  time: "10:00 AM", title: "Putt Putt at Maggie's",    emoji: "⛳", location: "Maggie's",           points: 15, prep: ["Hat or sunglasses on", "Sunscreen on", "Water bottle filled"], desc: "Mini golf showdown!" },
      { id: "d3-a7",  time: "12:00 PM", title: "Picnic Lunch",             emoji: "🧺", location: "Picnic Spot",        points: 5,  info: true, desc: "Eat outside together." },
      { id: "d3-a8",  time: "1:00 PM",  title: "Pool at Kentucky Dam Lodge", emoji: "🏊", location: "Kentucky Dam Lodge", points: 10, prep: ["Sunscreen on", "Swimsuit on", "Towel packed", "Water bottle filled"], desc: "Splash and swim." },
      { id: "d3-a9",  time: "4:00 PM",  title: "Check in to Cabin",        emoji: "🏕️", location: "The Cabin",          points: 10, prep: ["Bag carried in", "Bed picked", "Stuff unpacked"], desc: "Settle in, then practice the Evolution of Music & Dance." },
      { id: "d3-a10", time: "5:00 PM",  title: "Pizza",                    emoji: "🍕", location: "The Cabin",          points: 5,  info: true, desc: "Pizza night!" },
      { id: "d3-a11", time: "8:30 PM",  title: "Movie: Back to the Future", emoji: "🎬", location: "The Cabin",          points: 10, desc: "Great Scott — movie time!" },
    ],
  },
  {
    date: "2026-06-25",
    title: "Thursday — Variety Show!",
    era: "Variety Show Day",
    activities: [
      { id: "d4-a1",  time: "6:30 AM",  title: "TV Room Opens",            emoji: "📺", location: "TV Room",            points: 5,  info: true, desc: "Quiet time — not before 6:30!" },
      { id: "d4-a2",  time: "8:00 AM",  title: "Breakfast",                emoji: "🥞", location: "The Cabin",          points: 5,  info: true, desc: "Start the day together." },
      { id: "d4-a3",  time: "9:00 AM",  title: "Practice Variety Show",    emoji: "🎭", location: "The Cabin",          points: 15, prep: ["Costume ready", "Know your part", "Listening ears on"], desc: "Rehearse at the cabin." },
      { id: "d4-a4",  time: "10:00 AM", title: "Check Out of Hotel",       emoji: "🧳", location: "The Cabin",          points: 5,  info: true, desc: "Pack up and check out." },
      { id: "d4-a5",  time: "10:15 AM", title: "Swim in Pool",             emoji: "🏊", location: "The Pool",           points: 10, prep: ["Sunscreen on", "Swimsuit on", "Towel packed", "Snack grabbed"], desc: "One more swim — snacks too!" },
      { id: "d4-a6",  time: "12:00 PM", title: "Lunch Out",                emoji: "🍽️", location: "Out",                points: 5,  info: true, desc: "Lunch on the town." },
      { id: "d4-a7",  time: "1:30 PM",  title: "Church: Practice Variety Show", emoji: "⛪", location: "Church",        points: 15, desc: "Dress rehearsal on the big stage." },
      { id: "d4-a8",  time: "3:30 PM",  title: "Sera, Korea",              emoji: "🇰🇷", location: "Church",             points: 10, desc: "Sera shares about Korea." },
      { id: "d4-a9",  time: "4:00 PM",  title: "Soccer, Games or Andy Griffith", emoji: "⚽", location: "Outside",     points: 10, desc: "Soccer, games, or the Andy Griffith Show." },
      { id: "d4-a10", time: "5:00 PM",  title: "TV Time",                  emoji: "📺", location: "TV Room",            points: 5,  info: true, desc: "Relax before the show." },
      { id: "d4-a11", time: "5:30 PM",  title: "Dinner",                   emoji: "🍽️", location: "Mimi's Kitchen",     points: 5,  info: true, cook: "Quinones", desc: "Eat up before showtime." },
      { id: "d4-a12", time: "6:30 PM",  title: "Variety Show",             emoji: "🌟", location: "Show Stage",         points: 20, prep: ["Costume on", "Hair & makeup done", "Props ready", "Lines & moves practiced"], desc: "The big show — parents come at 7:00!" },
      { id: "d4-a13", time: "8:00 PM",  title: "Water Balloon Fight",     emoji: "🎈", location: "Back Yard",          points: 10, prep: ["Play clothes on", "Filled some balloons", "Ready to get soaked!"], desc: "Soak everyone!" },
      { id: "d4-a14", time: "8:30 PM",  title: "Baths",                    emoji: "🛁", location: "Upstairs",           points: 5,  info: true, desc: "Scrub up before bed." },
      { id: "d4-a15", time: "9:00 PM",  title: "Bed",                      emoji: "😴", location: "Upstairs",           points: 5,  info: true, desc: "Lights out — what a day!" },
    ],
  },
  {
    date: "2026-06-26",
    title: "Friday — Last Day!",
    era: "Time Capsule: 2030",
    activities: [
      { id: "d5-a1",  time: "6:30 AM",  title: "TV Room Opens",            emoji: "📺", location: "TV Room",          points: 5,  info: true, desc: "Quiet time — not before 6:30!" },
      { id: "d5-a2",  time: "8:00 AM",  title: "Breakfast",                emoji: "🥞", location: "Mimi's Kitchen",   points: 5,  info: true, cook: "Hines", desc: "Start the day together." },
      { id: "d5-cap", time: "8:15 AM",  title: "Capoeira with Chris",      emoji: "🥋", location: "Back Yard",        points: 10, prep: ["Comfy clothes on", "Shoes tied", "Water bottle filled"], desc: "Move and groove, Brazilian style." },
      { id: "d5-a3",  time: "8:30 AM",  title: "Meeting on the Porch",     emoji: "🎤", location: "Back Porch",       points: 5,  desc: "Plan out the last day." },
      { id: "d5-a4",  time: "8:45 AM",  title: "Time Capsule: 2030",       emoji: "📦", location: "Back Porch",       points: 15, desc: "Travel to the future — write notes and seal the time capsule to open in 2030!" },
      { id: "d5-a5",  time: "9:15 AM",  title: "Craft",                    emoji: "🎨", location: "Craft Table",      points: 10, desc: "One last camp craft." },
      { id: "d5-a6",  time: "10:20 AM", title: "Leave for Lazer Tag",      emoji: "🚗", location: "On the Road",      points: 5,  info: true, desc: "Load up and head out." },
      { id: "d5-a7",  time: "11:00 AM", title: "Lazer Tag",                emoji: "🔫", location: "Lazer Tag",        points: 15, prep: ["Closed-toe shoes on", "Water bottle filled", "Ready to run!"], desc: "Suit up and tag 'em!" },
      { id: "d5-a8",  time: "12:30 PM", title: "Lunch at Belews",          emoji: "🍽️", location: "Belews",           points: 5,  info: true, desc: "Refuel together." },
      { id: "d5-a9",  time: "2:00 PM",  title: "Board Games",              emoji: "🎲", location: "Living Room",      points: 10, desc: "Board games for the big kids, craft for the littles." },
      { id: "d5-a10", time: "4:00 PM",  title: "Leave for Pontoon Boat",   emoji: "🚗", location: "On the Road",      points: 5,  info: true, desc: "Load up and head to the lake." },
      { id: "d5-a11", time: "5:00 PM",  title: "Pontoon Boat & Jet Skis",  emoji: "🚤", location: "The Lake",         points: 20, cook: "Sera & Betsy (dinner on the boat)", prep: ["Sunscreen on", "Swimsuit on", "Life jacket grabbed", "Towel packed"], desc: "Cruise on the pontoon and take turns on the 2 jet skis!" },
      { id: "d5-a12", time: "8:00 PM",  title: "Leave for Home",           emoji: "🏡", location: "On the Road",      points: 5,  info: true, desc: "Head back to base." },
      { id: "d5-a13", time: "8:30 PM",  title: "Baths",                    emoji: "🛁", location: "Upstairs",         points: 5,  info: true, desc: "Scrub up before bed." },
      { id: "d5-a14", time: "9:00 PM",  title: "Bed",                      emoji: "😴", location: "Upstairs",         points: 5,  info: true, desc: "Lights out — last night of camp!" },
    ],
  },
];

// ---------------------------------------------------------------------------
// PARENT AWARDS — recognition that grown-ups hand out.
// At Cousin Camp the grown-ups (Mimi, parents, aunts & uncles) award the extra
// points. The "Kudos" tab lets any grown-up pick a cousin and tap to award:
//   • Kudos cards  — in-the-moment recognition, each worth bonus points
//   • Bonus points — a custom amount with an optional note
//   • Parent badges — special one-of-a-kind honors for the trophy case
// In shared mode these sync to every device alongside points.
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

// Playful, kid-voiced cheer cards. These show up in BOTH apps: cousins send
// them as cheers on the Crew Cheers board, and grown-ups can hand them out from
// Mission Control alongside KUDOS. They're recognition only — worth 0 points —
// so they never tip the leaderboard no matter who gives them.
const CHEERS = [
  { id: "c-waytogo",  emoji: "👏", label: "Way to Go",     points: 0, desc: "Crushed it — nice work!" },
  { id: "c-highfive", emoji: "🙌", label: "High Five",     points: 0, desc: "Up high — you earned it!" },
  { id: "c-yourock",  emoji: "🤩", label: "You Rock",      points: 0, desc: "Just for being awesome." },
  { id: "c-funny",    emoji: "😂", label: "Made Me Laugh", points: 0, desc: "Funniest cousin at camp." },
  { id: "c-buddy",    emoji: "🤝", label: "Best Buddy",    points: 0, desc: "The best cousin to hang with." },
  { id: "c-hero",     emoji: "🦸", label: "My Hero",       points: 0, desc: "Saved the day for me." },
  { id: "c-superstar",emoji: "🌟", label: "Superstar",     points: 0, desc: "Shining bright today." },
  { id: "c-strong",   emoji: "💪", label: "So Strong",     points: 0, desc: "Powered through like a champ." },
  { id: "c-creative", emoji: "🎨", label: "Super Creative", points: 0, desc: "Coolest idea ever." },
  { id: "c-fast",     emoji: "⚡", label: "Lightning Fast", points: 0, desc: "Zoom — too quick to catch!" },
  { id: "c-kind",     emoji: "❤️", label: "So Kind",       points: 0, desc: "Made my day nicer." },
  { id: "c-dancer",   emoji: "🕺", label: "Best Moves",    points: 0, desc: "Dance floor legend." },
  { id: "c-champ",    emoji: "🏆", label: "Champion",      points: 0, desc: "A total winner in my book." },
  { id: "c-party",    emoji: "🎉", label: "Party Starter", points: 0, desc: "Brings the fun every time." },
  { id: "c-brave",    emoji: "🦁", label: "So Brave",      points: 0, desc: "Fearless and bold!" },
  { id: "c-brain",    emoji: "🧠", label: "Big Brain",     points: 0, desc: "Smartest idea today." },
  { id: "c-vibes",    emoji: "🌈", label: "Good Vibes",    points: 0, desc: "Brings the sunshine." },
  { id: "c-lucky",    emoji: "🍀", label: "Lucky Charm",   points: 0, desc: "My good-luck cousin." },
  { id: "c-rocket",   emoji: "🚀", label: "Out of This World", points: 0, desc: "Totally amazing!" },
  { id: "c-goat",     emoji: "🐐", label: "The G.O.A.T.",  points: 0, desc: "Greatest of all time!" },
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

// ---------------------------------------------------------------------------
// COOK TEAMS — which grown-ups are on each family's cooking crew.
// The schedule's `cook` field names a family (e.g. "Thomas"); this table maps
// that family to the first names those grown-ups sign in with in the parents
// app, so each crew sees their own cooking duty highlighted when they sign in.
// `members` are matched against the schedule's `cook` text too, so a one-off
// like Friday's "Sera & Betsy" still lights up for Sera and Betsy.
// Edit these to match your real cooking sign-up.
// ---------------------------------------------------------------------------
const COOK_TEAMS = [
  { label: "Thomas",      members: ["Lance", "Betsy"] },
  { label: "Quinones",    members: ["Shannon", "Vinny"] },
  { label: "Hines",       members: ["Jason", "Sera"] },
  { label: "Christopher", members: ["Chris", "Christopher"] },
];

// Make available to app.js
window.CAMP_DATA = { CAMPERS, GROWNUPS, SCHEDULE, KUDOS, CHEERS, BONUS_QUICK, PARENT_BADGES, COOK_TEAMS };
