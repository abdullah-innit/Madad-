# Madad — Day 1 Setup

Do these steps in order. Don't skip ahead — each one unlocks the next.

## 1. Open the project in VS Code
- Open VS Code → File > Open Folder → select the `madad-app` folder.

## 2. Install the Live Server extension
- Click the Extensions icon in the left sidebar (or Ctrl+Shift+X).
- Search "Live Server" (by Ritwick Dey). Click Install.
- Right-click `index.html` in the file explorer → "Open with Live Server".
- Your browser opens the page. Right now signup/login will show a Firebase error — that's expected, you haven't connected your Firebase project yet. Fix that next.

## 3. Create your Firebase project (free, ~5 minutes)
1. Go to https://console.firebase.google.com and sign in with any Google account.
2. Click "Add project" → name it `madad-app` → you can turn off Google Analytics (not needed) → Create.
3. Once created, click the `</>` icon on the project overview page to register a **web app**. Give it any nickname. Skip Firebase Hosting setup for now — click Continue, then Continue to console.
4. Firebase will show you a code block with a `firebaseConfig` object. Copy the whole object.
5. Open `js/firebase-config.js` in VS Code and paste your values in, replacing the placeholder `YOUR_...` strings.

## 4. Turn on Authentication
1. In the left sidebar: Build > Authentication > Get started.
2. Click "Email/Password" in the sign-in methods list → toggle Enable → Save.

## 5. Turn on Firestore (the database)
1. In the left sidebar: Build > Firestore Database > Create database.
2. Choose a location close to you, click Next.
3. Select "Start in test mode" (fine for now — we'll lock it down before you deploy). Click Create.

## 6. Test it
- Go back to your browser tab (refresh if needed).
- Click "Join as volunteer", fill the signup form, submit.
- Go to your Firebase console → Firestore Database → you should see a `users` collection with your new document inside it. That's your first real user, in a real database, that you built.

## What's already working after this
- Sign up with name, email, password, locality → creates an account + a Firestore profile with `socialPoints: 0`.
- Log in / log out.
- A signed-in banner shows your name and current points.

## What's next (Day 2)
- The "Post a request" and "Browse requests" flow — the actual core feature.
- I'll build that once you confirm signup/login is working on your end.

## If something breaks
Copy the exact error message from your browser's console (press F12 → Console tab) and send it to me. Don't guess-fix it yourself yet — tell me what it says first.
