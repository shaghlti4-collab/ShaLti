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

## Notes
- Email verification uses Firebase's official link (a real OTP code would need a backend). Google accounts are verified automatically.
- Jobs: the latest 200 are loaded once and searched/filtered on the device (Arabic-normalized). For larger volumes, move to server-side queries + pagination.
- Rules: anyone reads jobs; only verified users create (validated schema, `userId` = caller); only the owner deletes; nobody edits.
- Editing the Arabic/French text: `js/translations.js`.
