# Turning on the Shared Camp 🔗

By default the app runs in **local mode** (each phone keeps its own points and
prizes). Follow these one-time steps to make it a **shared camp** where every
cousin sees the same points, prize board, and badges live across all devices.

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

## Photos — live in-app gallery
The Photos tab is a **live shared gallery**: family tap **Add photos** in the app,
the pictures upload to **Firebase Storage**, and they stream into the grid for
everyone. To turn it on:

1. In the Firebase console: **Build → Storage → Get started**, accept the default
   rules prompt, and pick a location (the same region as Firestore is fine).
2. Open the **Rules** tab in Storage, replace everything with the contents of
   **`storage.rules`** from this repo, and **Publish**.
3. Re-publish your **Firestore** rules too — `firestore.rules` now includes a
   `photos` subcollection rule the gallery needs (Build → Firestore → Rules →
   paste `firestore.rules` → Publish).

Photos are downscaled in the browser before upload (≈1280px JPEGs), so the free
tier (5 GB) holds thousands of them. Tip: keep it to photos — videos are large
and eat the quota fast.

A **Google Photos album** link is still supported as a backup button: paste a
share link into `PHOTO_ALBUM_URL` in **`data.js`** and it appears under the
gallery. (Note: Google Photos can't be displayed *inside* the app — it can only
be linked to — which is why the in-app gallery uses Firebase.)

## Import from Google Photos (optional — Picker API)
Google **no longer lets apps read a shared album automatically** (the old API was
shut off in March 2025 and there's no scheduled/connector access). The only
sanctioned way is the **Picker API**, where a person manually picks photos and the
app copies them in. To enable the "📥 Import from Google Photos" button:

1. **Enable the API:** Google Cloud Console → your `cousincampapp` project →
   **APIs & Services → Library** → search **Photos Picker API** → **Enable**.
2. **OAuth consent screen:** APIs & Services → **OAuth consent screen** → External.
   Fill in the basics, add the scope `…/auth/photospicker.mediaitems.readonly`, and
   under **Test users** add each family member's Google email. (Leaving it in
   "Testing" avoids Google's full app verification; testers just click past an
   "unverified app" notice.)
3. **Create a client ID:** APIs & Services → **Credentials → Create credentials →
   OAuth client ID → Web application**. Under **Authorized JavaScript origins** add
   `https://lancethomas1.github.io` (and `http://localhost:8000` for local testing).
   Copy the **Client ID** into `GOOGLE_PICKER.clientId` in **`firebase-config.js`**.

Then the Photos tab shows the import button: tap it → sign in → pick photos in
Google Photos → they download into the shared gallery.

> ⚠️ **Heads-up:** the import **downloads each picked photo in the browser**, which
> Google may block with a CORS error. If imports fail (check the browser console),
> it needs a tiny proxy (a free Cloudflare Worker) to do the download — ask and it
> can be added. This is **manual** picking only; Google offers no scheduled import.

## Switching back to local mode
Blank out the values in `firebase-config.js` and the app returns to per-device
local mode (no passcode, no sharing).
