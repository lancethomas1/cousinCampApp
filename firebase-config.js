/*
 * Firebase config — turns ON the SHARED camp.
 * -------------------------------------------------------------
 * Until the values below are filled in, the app runs in LOCAL mode
 * (each phone keeps its own points/prizes). Paste the web config from
 * your Firebase project here to make the camp shared across all devices.
 *
 * These values are NOT secrets — they are safe to commit and be public.
 * Access is protected by (a) the family passcode, which decides which
 * hidden Firestore document the camp lives in, and (b) Firestore rules
 * (see firestore.rules). See SETUP.md for step-by-step instructions.
 */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyA8JMrlfkQFahUK0MJhkqMpFgwcke4hkWY",
  authDomain: "cousincampapp.firebaseapp.com",
  projectId: "cousincampapp",
  storageBucket: "cousincampapp.firebasestorage.app",
  messagingSenderId: "981929551490",
  appId: "1:981929551490:web:2135c67001be83c867769b",
  measurementId: "G-YZ6LESHDNK",
};

/*
 * Optional: "Import from Google Photos" (Picker API).
 * Paste the OAuth 2.0 Web client ID from Google Cloud here to show an
 * "Import from Google Photos" button on the Photos tab. Leave blank to hide it.
 * The client ID is not a secret. See SETUP.md → "Import from Google Photos".
 */
window.GOOGLE_PICKER = {
  clientId: "",
};
