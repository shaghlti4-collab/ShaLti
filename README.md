# شغلتي | Shaghlti

Mauritanian job board — plain HTML/CSS/JS + Firebase Auth + Cloud Firestore. No build step.

## Firebase setup (one time)
1. Console → **Authentication → Sign-in method**: enable **Email/Password** and **Google**.
2. **Authentication → Settings → Authorized domains**: add your site domain (e.g. `your-app.vercel.app`, `your-user.github.io`). Google sign-in fails without it. `localhost` is already allowed.
3. **Firestore Database**: create the database, then **Rules** → paste the content of `firestore.rules` → Publish (or `firebase deploy --only firestore:rules`).
4. `js/firebase-config.js` already holds your project config.

## Run locally
ES modules need a server (not `file://`):  `npx serve .`  or  `python3 -m http.server 8000`

## Deploy
- **Vercel**: import the folder/repo, Framework = Other, no build command, output = root.
- **GitHub Pages**: push and enable Pages on the root.

## Auto-translation of job posts
Each post is translated once at publish time (AR<->FR) with the free MyMemory API and both versions are stored (`srcLang`, `tr`). The site shows the version matching the language selected. If translation is unavailable (daily free quota reached, network), the post is published in its original language only. Optional: set `CONTACT_EMAIL` in `js/translate.js` to raise MyMemory's free daily limit. Posts published before this feature stay in their original language.

## Restricted users
A restriction created in the developer dashboard is stored in `restrictions/{uid}`. Rules block publishing for that user, the Add buttons show a lock, and the Add page shows the developer's reason.

## Pharmacy guide (دليل صيدلي) — Google Maps
Live from Google (Maps JavaScript API + Places API (New)); **no pharmacy data is stored in Firestore**. Features: pharmacies near me (GPS, distance-sorted), text search, wilaya search, "search this area", custom map pins, details sheet (photo, rating, open/closed, hours, reviews, directions, call, share).
- The key is in `js/config.js`. In Google Cloud Console enable *Maps JavaScript API* + *Places API (New)* + billing, then restrict the key: HTTP referrers = your domain(s), APIs = those two only.
- The Google script loads only when the guide is opened (map loads are billed). Check current pricing yourself.
- Google returns at most 20 results per search and does not guarantee every pharmacy is listed.
- Old data: if you imported pharmacies earlier, you can delete the `pharmacies` collection in the Firestore console (it is no longer used).

## Notes
- Email verification uses Firebase's official link (a real OTP code would need a backend). Google accounts are verified automatically.
- Jobs: the latest 200 are loaded once and searched/filtered on the device (Arabic-normalized). For larger volumes, move to server-side queries + pagination.
- Rules: anyone reads jobs; only verified users create (validated schema, `userId` = caller); only the owner deletes; nobody edits.
- Editing the Arabic/French text: `js/translations.js`.
