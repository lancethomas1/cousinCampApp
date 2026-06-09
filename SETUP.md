# Turning on the Shared Camp 🔗

By default the app runs in **local mode** (each phone keeps its own points).
Follow these one-time steps to make it a **shared camp** where every
cousin sees the same points and badges live across all devices.

It uses **Firebase Firestore** (Google) — free for a family-sized app.

## 1. Create a Firebase project (free)
1. Go to <https://console.firebase.google.com> and sign in with a Google account.
2. Click **Add project**, name it (e.g. `cousin-camp`), and finish. You can skip
   Google Analytics.

## 2. Add a Web App and copy the config
1. In your project, click the **`</>` (Web)** icon to "Add app to get started".
2. Give it a nickname (e.g. `cousin-camp-web`) and **Register app**.
3. Firebase shows a `firebaseConfig = { ... }` snippet. Copy those values into
   **`firebase-config.js`** in this repo (apiKey, authDomain, projectId, etc.).

## 3. Create the Firestore database
1. In the left menu: **Build → Firestore Database → Create database**.
2. Choose a location, start in **Production mode**, and create it.
3. Open the **Rules** tab, replace everything with the contents of
   **`firestore.rules`** from this repo, and click **Publish**.

## 4. Commit and you're done
Commit your edited `firebase-config.js` (these values are not secrets and are
safe to be public). Once it's deployed, opening the app will ask for a **family
passcode**.

## How the passcode works
- The first person to enter a passcode "creates" the camp; everyone who enters
  the **exact same passcode** joins the same shared camp.
- The passcode is hashed to decide which hidden Firestore document the camp
  lives in, so the data can't be found without it — and the passcode never
  appears in the code.
- Pick something simple the family can remember (e.g. `mimi2026`) and share it
  in your family group chat. Each person enters it once.

## Switching back to local mode
Blank out the values in `firebase-config.js` and the app returns to per-device
local mode (no passcode, no sharing).
