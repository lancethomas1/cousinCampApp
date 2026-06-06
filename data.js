/*
 * Cousin Camp — camp data
 * -------------------------------------------------------------
 * Edit this file to change the schedule, campers, or point values.
 * Dates are ISO strings (YYYY-MM-DD). Times are display strings.
 */

// The cousins (campers). `id` is used internally and must be unique.
// `last` and `age` show up in the camper picker and leaderboard.
const CAMPERS = [
  { id: "laila",   name: "Laila",   last: "Inman",     age: 13, emoji: "🦄", color: "#e84393" },
  { id: "william", name: "William", last: "Thomas",    age: 11, emoji: "🧢", color: "#ef6c4d" },
  { id: "sophie",  name: "Sophie",  last: "Inman",     age: 10, emoji: "🦋", color: "#2980b9" },
  { id: "samuel",  name: "Samuel",  last: "Thomas",    age:  9, emoji: "⚽", color: "#27ae60" },
  { id: "logan",   name: "Logan",   last: "Hines",     age:  7, emoji: "🦖", color: "#8e44ad" },
  { id: "zoe",     name: "Zoe",     last: "Hines",     age:  6, emoji: "🌈", color: "#f39c12" },
  { id: "leo",     name: "Leo",     last: "Thomas",    age:  5, emoji: "🦁", color: "#16a085" },
  { id: "ava",     name: "Ava",     last: "Quinones",  age:  4, emoji: "🌸", color: "#d63384" },
  { id: "noel",    name: "Noel",    last: "Hines",     age:  3, emoji: "🐥", color: "#00b894" },
];

// Camp week. Each day has a list of activities led by (or starring) Mimi.
// `points` are awarded to a camper when they check the activity complete.
const SCHEDULE = [
  {
    date: "2026-06-06",
    title: "Welcome Day",
    activities: [
      { id: "d1-a1", time: "9:00 AM",  title: "Camp Kickoff Pancakes", emoji: "🥞", location: "Mimi's Kitchen",     points: 10, desc: "Mimi flips her famous buttermilk pancakes to start camp. Don't be late!" },
      { id: "d1-a2", time: "11:00 AM", title: "Camp Flag Painting",     emoji: "🎨", location: "Back Porch",        points: 15, desc: "Every cousin paints a square for the official Cousin Camp flag." },
      { id: "d1-a3", time: "2:00 PM",  title: "Scavenger Hunt",         emoji: "🔍", location: "The Whole Yard",    points: 20, desc: "Find all the items on Mimi's list before the others do." },
      { id: "d1-a4", time: "7:30 PM",  title: "Bonfire & S'mores",      emoji: "🔥", location: "Fire Pit",          points: 10, desc: "Tell stories and toast marshmallows under the stars." },
    ],
  },
  {
    date: "2026-06-07",
    title: "Nature Day",
    activities: [
      { id: "d2-a1", time: "8:30 AM",  title: "Sunrise Nature Walk",    emoji: "🥾", location: "Creek Trail",       points: 15, desc: "Mimi knows every bird call. Bring your walking shoes." },
      { id: "d2-a2", time: "10:30 AM", title: "Leaf & Rock Collecting",  emoji: "🍃", location: "The Woods",        points: 10, desc: "Gather treasures for this afternoon's craft." },
      { id: "d2-a3", time: "1:00 PM",  title: "Nature Collage Craft",    emoji: "🖼️", location: "Craft Table",      points: 15, desc: "Glue your finds into a masterpiece." },
      { id: "d2-a4", time: "4:00 PM",  title: "Frog Pond Expedition",    emoji: "🐸", location: "The Pond",         points: 20, desc: "How many frogs can you spot? Mimi's record is 12." },
    ],
  },
  {
    date: "2026-06-08",
    title: "Baking Day",
    activities: [
      { id: "d3-a1", time: "9:30 AM",  title: "Mimi's Cookie Workshop",  emoji: "🍪", location: "Mimi's Kitchen",   points: 20, desc: "Learn the secret family chocolate chip recipe." },
      { id: "d3-a2", time: "12:00 PM", title: "Decorate-Your-Own Cupcakes", emoji: "🧁", location: "Mimi's Kitchen", points: 15, desc: "Sprinkles, frosting, and a whole lot of mess." },
      { id: "d3-a3", time: "3:00 PM",  title: "Lemonade Stand",          emoji: "🍋", location: "Front Driveway",   points: 15, desc: "Squeeze, stir, and sell to the neighbors." },
      { id: "d3-a4", time: "6:00 PM",  title: "Pizza Night",             emoji: "🍕", location: "Backyard Oven",    points: 10, desc: "Everyone builds their own pizza pie." },
    ],
  },
  {
    date: "2026-06-09",
    title: "Water Day",
    activities: [
      { id: "d4-a1", time: "10:00 AM", title: "Sprinkler Obstacle Course", emoji: "💦", location: "Front Lawn",     points: 20, desc: "Get soaked racing through Mimi's homemade course." },
      { id: "d4-a2", time: "12:30 PM", title: "Water Balloon Toss",      emoji: "🎈", location: "Side Yard",        points: 15, desc: "Don't drop it! Last team standing wins." },
      { id: "d4-a3", time: "2:30 PM",  title: "Popsicle Break",          emoji: "🧊", location: "Shady Porch",      points: 10, desc: "Cool down with Mimi's homemade fruit pops." },
      { id: "d4-a4", time: "4:00 PM",  title: "Kiddie Pool Boat Races",  emoji: "⛵", location: "The Patio",        points: 15, desc: "Build a boat from foil and race it across the pool." },
    ],
  },
  {
    date: "2026-06-10",
    title: "Game Day",
    activities: [
      { id: "d5-a1", time: "9:00 AM",  title: "Backyard Olympics",       emoji: "🏅", location: "The Whole Yard",   points: 25, desc: "Sack races, egg toss, and the three-legged dash." },
      { id: "d5-a2", time: "11:30 AM", title: "Card Games with Mimi",    emoji: "🃏", location: "Screened Porch",   points: 10, desc: "Mimi teaches Rummy and Go Fish. She rarely loses." },
      { id: "d5-a3", time: "2:00 PM",  title: "Giant Board Game Tournament", emoji: "🎲", location: "Living Room",  points: 15, desc: "Bracket-style showdown of camp favorites." },
      { id: "d5-a4", time: "5:00 PM",  title: "Flashlight Tag",          emoji: "🔦", location: "Backyard",         points: 20, desc: "When the sun goes down, the chase begins." },
    ],
  },
  {
    date: "2026-06-11",
    title: "Talent Day",
    activities: [
      { id: "d6-a1", time: "10:00 AM", title: "Talent Rehearsal",        emoji: "🎤", location: "Garage Stage",     points: 10, desc: "Practice your act for tonight's big show." },
      { id: "d6-a2", time: "1:00 PM",  title: "Costume & Prop Making",   emoji: "🎭", location: "Craft Table",      points: 15, desc: "Mimi's trunk of dress-up clothes is open!" },
      { id: "d6-a3", time: "3:30 PM",  title: "Friendship Bracelet Swap", emoji: "🧵", location: "Front Porch",     points: 15, desc: "Make a bracelet, trade with a cousin." },
      { id: "d6-a4", time: "7:00 PM",  title: "Cousin Camp Talent Show", emoji: "⭐", location: "Garage Stage",     points: 30, desc: "Lights, camera, cousins! The headline event." },
    ],
  },
  {
    date: "2026-06-12",
    title: "Awards Day",
    activities: [
      { id: "d7-a1", time: "9:00 AM",  title: "Farewell Breakfast",      emoji: "🍳", location: "Mimi's Kitchen",   points: 10, desc: "One last big breakfast all together." },
      { id: "d7-a2", time: "11:00 AM", title: "Camp Photo Slideshow",    emoji: "📸", location: "Living Room",      points: 10, desc: "Relive the week through everyone's photos." },
      { id: "d7-a3", time: "1:00 PM",  title: "Awards Ceremony",         emoji: "🏆", location: "Back Porch",       points: 25, desc: "Mimi hands out the Cousin Camp medals." },
      { id: "d7-a4", time: "3:00 PM",  title: "Group Hug & Goodbyes",    emoji: "🤗", location: "Front Yard",       points: 10, desc: "Until next summer! Same camp, same Mimi." },
    ],
  },
];

// Camp Store — "Pick Your Prize" board.
// There are nine one-of-a-kind rewards, one for each cousin. A reward can
// only be claimed by a single camper, and each camper holds one reward, so
// every cousin ends the week with their own different prize.
// `cost` is how many camp points it takes to claim it.
const STORE = [
  { id: "r-movie",   emoji: "🎬", name: "Movie Night Pick",      cost: 40, desc: "You choose what everyone watches on movie night." },
  { id: "r-latenight", emoji: "🌙", name: "Stay-Up-Late Pass",   cost: 45, desc: "Stay up 30 extra minutes past camp bedtime." },
  { id: "r-dessert", emoji: "🍦", name: "Dessert Boss",          cost: 25, desc: "First scoop, extra sprinkles — top of the dessert line all day." },
  { id: "r-game",    emoji: "🎮", name: "Game Master",           cost: 35, desc: "You pick the next big game the whole camp plays." },
  { id: "r-frontseat", emoji: "🛶", name: "Front Seat Pass",     cost: 30, desc: "Ride shotgun / sit up front on the next camp outing." },
  { id: "r-helper",  emoji: "👑", name: "Mimi's Helper",         cost: 45, desc: "Be Mimi's special assistant for a whole day." },
  { id: "r-chore",   emoji: "🧹", name: "Skip-a-Chore Pass",     cost: 30, desc: "Get out of one camp chore, no questions asked." },
  { id: "r-mystery", emoji: "🎟️", name: "Mystery Prize",         cost: 50, desc: "A surprise from Mimi's prize box — nobody knows what's inside!" },
  { id: "r-smore",   emoji: "🍫", name: "S'more Master",         cost: 25, desc: "Unlimited s'mores at the next bonfire. Yes, unlimited." },
];

// Make available to app.js
window.CAMP_DATA = { CAMPERS, SCHEDULE, STORE };
