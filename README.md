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

## Pharmacy guide (دليل صيدلي)
Leaflet + OpenStreetMap map, search, filters, "near me" (GPS), details and directions. Data lives in the `pharmacies` collection (public read, developer-only write, enforced by `firestore.rules`). No sample data is shipped: the section is empty until the developer imports records from the dashboard. Queries are paginated (50 per page); "near me" reads a latitude band then sorts by distance. Map tiles © OpenStreetMap contributors.

## Notes
- Email verification uses Firebase's official link (a real OTP code would need a backend). Google accounts are verified automatically.
- Jobs: the latest 200 are loaded once and searched/filtered on the device (Arabic-normalized). For larger volumes, move to server-side queries + pagination.
- Rules: anyone reads jobs; only verified users create (validated schema, `userId` = caller); only the owner deletes; nobody edits.
- Editing the Arabic/French text: `js/translations.js`.
