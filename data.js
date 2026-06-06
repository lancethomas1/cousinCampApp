/*
 * Cousin Camp — camp data
 * -------------------------------------------------------------
 * THEME (2026): Time Machine Travelers 🕰️
 * Each day Mimi's time machine lands in a different era.
 * Edit this file to change the schedule, travelers, or prizes.
 * Dates are ISO strings (YYYY-MM-DD). Times are display strings.
 */

// The cousins (time travelers). `id` is used internally and must be unique.
// `last` and `age` show up in the traveler picker and roster.
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

// The journey through time. Each day the machine lands in a new era.
// `era` is the destination label; `points` are awarded on completion.
const SCHEDULE = [
  {
    date: "2026-06-06",
    title: "Launch Day",
    era: "Present Day · Year 2026",
    activities: [
      { id: "d1-a1", time: "9:00 AM",  title: "Blast-Off Breakfast",      emoji: "🥞", location: "Mission Control (Kitchen)", points: 10, desc: "Fuel up with Mimi's pancakes before the very first jump through time." },
      { id: "d1-a2", time: "11:00 AM", title: "Build Your Time-Travel Gear", emoji: "🥽", location: "Back Porch",            points: 15, desc: "Make your own time goggles and a wrist time-band for the journey." },
      { id: "d1-a3", time: "2:00 PM",  title: "Decode the Time Map",       emoji: "🗺️", location: "The Whole Yard",          points: 20, desc: "A scavenger hunt for the lost coordinates that power the machine." },
      { id: "d1-a4", time: "7:30 PM",  title: "Starlight Time Stories",    emoji: "🔥", location: "Fire Pit",                points: 10, desc: "Bonfire tales of all the eras we'll visit this week." },
    ],
  },
  {
    date: "2026-06-07",
    title: "Dinosaur Days",
    era: "The Prehistoric Age",
    activities: [
      { id: "d2-a1", time: "8:30 AM",  title: "Sunrise Dino Tracking",     emoji: "🦕", location: "Creek Trail",             points: 15, desc: "An early-morning hunt for giant 'dinosaur' footprints. Watch your step!" },
      { id: "d2-a2", time: "10:30 AM", title: "Fossil Dig",                emoji: "🦴", location: "The Dig Pit",             points: 10, desc: "Excavate buried fossils with brushes, just like real paleontologists." },
      { id: "d2-a3", time: "1:00 PM",  title: "Make-Your-Own Dinosaur",    emoji: "🦖", location: "Craft Table",             points: 15, desc: "Build a dino model from your fossil finds and name your new species." },
      { id: "d2-a4", time: "4:00 PM",  title: "Erupting Volcano Science",  emoji: "🌋", location: "The Patio",               points: 20, desc: "Make a baking-soda volcano blow its top, prehistoric style." },
    ],
  },
  {
    date: "2026-06-08",
    title: "Ancient Egypt",
    era: "3000 B.C. · Land of the Pharaohs",
    activities: [
      { id: "d3-a1", time: "9:30 AM",  title: "Build the Great Pyramid",   emoji: "🔺", location: "Back Porch",              points: 20, desc: "Teams stack blocks and boxes into the tallest pyramid they can." },
      { id: "d3-a2", time: "12:00 PM", title: "Decorate Mummy Cookies",    emoji: "🍪", location: "Mimi's Kitchen",          points: 15, desc: "Bake and wrap cookies to look like little mummies. Spooky and sweet!" },
      { id: "d3-a3", time: "3:00 PM",  title: "Hieroglyphic Name Scrolls", emoji: "📜", location: "Craft Table",             points: 15, desc: "Write your name in ancient hieroglyphs on a rolled-up scroll." },
      { id: "d3-a4", time: "6:00 PM",  title: "Pharaoh's Feast Pizza",     emoji: "🍕", location: "Backyard Oven",           points: 10, desc: "A royal pizza night fit for a king of the Nile." },
    ],
  },
  {
    date: "2026-06-09",
    title: "Knights & Castles",
    era: "The Middle Ages · 1200 A.D.",
    activities: [
      { id: "d4-a1", time: "10:00 AM", title: "Build a Cardboard Castle",  emoji: "🏰", location: "The Garage",              points: 20, desc: "Raise the walls and towers of Camp Castle from boxes and tape." },
      { id: "d4-a2", time: "12:30 PM", title: "Royal Crown & Shield Craft", emoji: "👑", location: "Craft Table",            points: 10, desc: "Every knight and royal needs a crown and a coat of arms." },
      { id: "d4-a3", time: "2:30 PM",  title: "Dragon Water Battle",       emoji: "🐉", location: "Side Yard",               points: 15, desc: "Defend the castle from the dragon with water balloons!" },
      { id: "d4-a4", time: "4:00 PM",  title: "Knight Training Course",    emoji: "⚔️", location: "Front Lawn",              points: 15, desc: "Run the obstacle course to earn your knighthood from Queen Mimi." },
    ],
  },
  {
    date: "2026-06-10",
    title: "Pirate Seas",
    era: "The Age of Sail · 1700s",
    activities: [
      { id: "d5-a1", time: "9:00 AM",  title: "Walk-the-Plank Sprinklers", emoji: "💦", location: "Front Lawn",              points: 25, desc: "A soaking-wet obstacle course across the deck of the SS Mimi." },
      { id: "d5-a2", time: "11:30 AM", title: "Buried Treasure Hunt",      emoji: "🪙", location: "The Whole Yard",          points: 15, desc: "Follow the map and dig up the buried treasure before the others." },
      { id: "d5-a3", time: "2:00 PM",  title: "Cannonball Balloon Toss",   emoji: "🎈", location: "Side Yard",               points: 15, desc: "Don't let the water-balloon cannonball hit the deck!" },
      { id: "d5-a4", time: "5:00 PM",  title: "Build-a-Boat Pool Races",   emoji: "⛵", location: "The Patio",               points: 20, desc: "Build a tiny pirate ship from foil and race it across the sea." },
    ],
  },
  {
    date: "2026-06-11",
    title: "Wild West",
    era: "The Frontier · 1850s",
    activities: [
      { id: "d6-a1", time: "10:00 AM", title: "Gold Rush Panning",         emoji: "🥇", location: "The Pond",                points: 10, desc: "Pan the creek for hidden gold nuggets, forty-niner style." },
      { id: "d6-a2", time: "1:00 PM",  title: "Cowboy Hat & Bandana Craft", emoji: "🤠", location: "Craft Table",            points: 15, desc: "Gear up like a real cowpoke for tonight's hoedown." },
      { id: "d6-a3", time: "3:30 PM",  title: "Stick-Horse Rodeo Races",   emoji: "🐎", location: "Backyard Corral",         points: 15, desc: "Saddle up your trusty stick-horse and race around the corral." },
      { id: "d6-a4", time: "7:00 PM",  title: "Wild West Hoedown Show",    emoji: "⭐", location: "Garage Saloon Stage",      points: 30, desc: "The big talent show — sing, dance, or tell a tall tale!" },
    ],
  },
  {
    date: "2026-06-12",
    title: "Back to the Future",
    era: "Awards Day · The Year 3000",
    activities: [
      { id: "d7-a1", time: "9:00 AM",  title: "Return-Trip Breakfast",     emoji: "🍳", location: "Mission Control (Kitchen)", points: 10, desc: "One last big breakfast before the machine brings us home." },
      { id: "d7-a2", time: "11:00 AM", title: "Time-Travel Slideshow",     emoji: "📸", location: "Living Room",             points: 10, desc: "Relive every era through everyone's photos from the trip." },
      { id: "d7-a3", time: "1:00 PM",  title: "Time Travelers Awards",     emoji: "🏆", location: "Back Porch",              points: 25, desc: "Mimi hands out the official Time Traveler medals and certificates." },
      { id: "d7-a4", time: "3:00 PM",  title: "Bury the Time Capsule",     emoji: "⏳", location: "Front Yard",              points: 10, desc: "Seal a capsule for next year's cousins, then big goodbye hugs." },
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
