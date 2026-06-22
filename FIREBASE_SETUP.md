# Firebase Setup Guide

## 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add Project**
3. Enter project name: `ada-algorithm-lab`
4. Enable Google Analytics (optional)
5. Click **Create Project**

## 2. Enable Authentication

1. Go to **Authentication → Sign-in method**
2. Enable **Google** provider
3. Add your GitHub Pages domain to **Authorized domains**:
   - `yourusername.github.io`

## 3. Set Up Firestore

1. Go to **Firestore Database → Create database**
2. Choose **Start in production mode**
3. Select a region close to your users

## 4. Apply Security Rules

Copy the contents of `database/firestoreRules.txt` into:
**Firestore → Rules → Edit rules → Publish**

## 5. Get Firebase Config

1. Go to **Project Settings → General → Your apps**
2. Click **Add app → Web**
3. Register app name: `ADA Lab`
4. Copy the `firebaseConfig` object
5. Paste it into `config/appConfig.js`

## 6. Get Your Admin UID

1. Sign in to ADA Lab once (use your admin Google account)
2. Go to Firebase **Authentication → Users**
3. Copy your UID
4. Paste it into `config/adminConfig.js` → `adminUIDs`

## Firestore Collections Created Automatically

| Collection | Purpose |
|-----------|---------|
| `users` | User profiles, XP, streaks, achievements |
| `sessions` | Login/logout session tracking |
| `feedback` | User feedback submissions |
| `bug_reports` | Bug report submissions |
| `feature_requests` | Feature request submissions |
| `donations` | Donation records |
| `announcements` | Global announcements |
| `analytics` | Algorithm usage, search analytics |
| `stats` | Aggregated statistics |

## Firestore Indexes Required

For the leaderboard query, create a composite index:
- Collection: `users`
- Fields: `xp` (Descending)

Go to **Firestore → Indexes → Add index** if you see an error in the console.
