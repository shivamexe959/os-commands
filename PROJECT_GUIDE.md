# ADA Algorithm Lab v2.0.0 — Complete Developer Guide

> **Written for:** Any new developer who joins this project with zero prior context.  
> **Read this file first.** It explains everything: what the app does, who the users are, how the code works, and how to make changes without breaking anything.

---

## 1. What Is This App?

**ADA Algorithm Lab** is a free web app built for students of VVP Engineering College (CSE Department, GTU) studying the subject **ADA (Analysis and Design of Algorithms) — subject code 3150703**.

It lets students:
- **Visualize** 30+ sorting, searching, graph, DP, backtracking, and string algorithms with step-by-step animations
- **Earn XP and Coins** for using algorithms, logging streaks, and completing quizzes
- **Track their progress** via a personal dashboard (streaks, achievements, leaderboard, statistics)
- **Take quizzes** set by their teacher
- **Export PDFs** of algorithm notes

It lets teachers:
- See their class roster (Division GX / GY / GZ)
- Send announcements
- Start lab sessions with countdown timers
- Check quiz results
- Grant bonus XP and mute misbehaving students

It lets admins (Shivam, the developer):
- See all users, ban, delete, or promote them
- Send global announcements
- View analytics (devices, colleges, sessions)
- Export all users to CSV

---

## 2. Tech Stack — No Framework, No Build Step

This is **pure HTML + CSS + JavaScript**. There is NO:
- React, Vue, Angular
- Webpack, Vite, or any bundler
- Node.js server
- npm install required

Everything runs directly in the browser. It is hosted on **GitHub Pages** (free, static hosting).

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5 / CSS3 / ES Modules (JS) |
| Database | Firebase Firestore (NoSQL cloud database) |
| Auth | Firebase Authentication (Google Sign-In only) |
| Hosting | GitHub Pages |
| Firebase SDK | version 10.12.2, loaded from CDN (no npm) |

---

## 3. File Structure — Where Everything Lives

```
/
├── index.html                  ← The ENTIRE app is one HTML file
├── app.js                      ← (old entry, ignore — real entry is scripts/app.js)
│
├── config/
│   └── adminConfig.js          ← ⚠️ EDIT THIS: put your Firebase UID here
│
├── scripts/
│   ├── app.js                  ← MAIN ENTRY POINT — starts everything after auth
│   │
│   ├── firebase/
│   │   ├── firebase.js         ← Firebase app init (API keys, project config)
│   │   ├── auth.js             ← Google login, role detection (admin/teacher/student)
│   │   ├── database.js         ← All Firestore read/write for user profiles
│   │   └── firestore.js        ← Advanced Firestore ops (notifications, sessions, admin)
│   │
│   ├── dashboard/
│   │   ├── studentDashboard.js ← Student's personal dashboard (XP, streaks, history)
│   │   ├── adminDashboard.js   ← Admin panel (users, analytics, announcements)
│   │   └── analyticsDashboard.js ← Detailed analytics charts
│   │
│   ├── teacher/                ← 🆕 Teacher Console (added in v2.0.0)
│   │   ├── teacherDashboard.js ← Main teacher console orchestrator
│   │   ├── teacherRole.js      ← Role permission helpers
│   │   ├── classRoster.js      ← Class list, groups, live feed
│   │   ├── classAnnouncements.js ← Teacher announcements
│   │   ├── classQuizControl.js ← Quiz creation and results
│   │   ├── classReports.js     ← CSV export, heatmap, syllabus coverage
│   │   ├── classModeration.js  ← Bonus XP, muting students
│   │   └── classLiveSession.js ← Lab session + countdown timer
│   │
│   ├── features/
│   │   ├── xp.js               ← XP bar rendering, level calculation
│   │   ├── achievements.js     ← All 20 achievement definitions + unlock logic
│   │   ├── announcements.js    ← Real-time announcement bar
│   │   ├── bookmarks.js        ← Bookmark algorithms
│   │   ├── cloudBackup.js      ← Backup/restore user data to Firestore
│   │   ├── donations.js        ← Donation modal (Buy Me a Coffee)
│   │   ├── feedback.js         ← Feedback & bug report forms
│   │   ├── leaderboard.js      ← XP leaderboard across all students
│   │   ├── notes.js            ← Personal cloud notes
│   │   ├── notifications.js    ← Real-time notification bell
│   │   ├── pdf.js              ← PDF export of algorithm page
│   │   ├── preferences.js      ← Theme, language, animation speed
│   │   ├── quiz.js             ← Quiz engine (student side)
│   │   ├── recent.js           ← Recently viewed algorithms
│   │   ├── searchHistory.js    ← Search history tracking
│   │   ├── share.js            ← Share algorithm links
│   │   └── statistics.js       ← Usage statistics charts
│   │
│   ├── ui/
│   │   ├── navbar.js           ← Top navigation bar (XP, coins, streak, buttons)
│   │   ├── modal.js            ← Open/close modal helpers
│   │   ├── theme.js            ← Dark/light theme toggle
│   │   ├── toast.js            ← Toast notification popups
│   │   ├── animations.js       ← UI animation helpers
│   │   └── loader.js           ← Loading spinner
│   │
│   ├── algorithms.js           ← Algorithm list + search/filter (DO NOT EDIT)
│   └── visualizers.js          ← All visualization canvases (DO NOT EDIT)
│
├── styles/
│   ├── main.css                ← Core design tokens, layout (DO NOT EDIT)
│   ├── dashboard.css           ← Student dashboard styles
│   ├── admin.css               ← Admin panel styles
│   ├── teacher.css             ← 🆕 Teacher console styles (added v2.0.0)
│   ├── navbar.css              ← Navbar styles
│   ├── components.css          ← Cards, buttons, badges
│   ├── animations.css          ← Transitions, keyframes
│   ├── notifications.css       ← Notification panel
│   ├── analytics.css           ← Analytics charts
│   ├── layout.css              ← Page layout
│   └── responsive.css          ← Mobile breakpoints
│
├── database/
│   ├── firestoreRules.txt      ← ⚠️ PASTE THIS into Firebase Console → Rules
│   └── firestoreStructure.md   ← Full Firestore document schema reference
│
└── assets/
    └── icons/
        └── avatar.svg          ← Default profile picture
```

---

## 4. The Three User Roles

### 4A. Student (default — everyone starts here)

- **How detected:** Any Google account that is NOT in adminEmails/adminUIDs and NOT promoted to teacher
- **Firestore field:** `role: "student"`
- **What they see:** Normal app — visualizers, dashboard, XP bar, achievements, leaderboard, quiz
- **What they CAN'T see:** Admin Panel button (🛡️), Teacher Console button (📋)

**Student Firestore document** (stored in `users/{uid}`):
```
xp, coins, badges[], achievements[], bookmarks[], quizHistory[]
currentStreak, longestStreak, lastStreakDate
totalAlgorithmsUsed, recentlyViewed[], searchHistory[]
name, email, college, branch, semester, division (GX/GY/GZ)
role: "student"
```

---

### 4B. Teacher

- **How to create a teacher:**
  1. Have the teacher sign in to the app with their Google account first
  2. You (admin) open Admin Panel → Users tab → find them → click "Admin" button → type `teacher` → press OK → enter their divisions (e.g. `GX,GY`)
  3. Their Firestore document gets `role: "teacher"`, `teacherDivisions: ["GX","GY"]`, `teacherSince: "2024-..."`

- **How the app detects teachers:** Firestore `role === "teacher"` OR their email is in `ADMIN_CONFIG.teacherEmails[]`

- **What they see:** A 📋 **Teacher Console** button appears in the navbar (only visible to teachers, not students)

- **Teacher Console tabs:**
  | Tab | What it does |
  |-----|-------------|
  | Overview | Division stats (student count, online now, avg XP), cross-division comparison chart |
  | Roster | Full class list with XP/streak/last-seen, live activity feed, seating groups |
  | Quiz | Create quiz sets, add questions, see results, mark practicals |
  | Reports | Export CSV, end-of-semester report, difficulty heatmap, syllabus coverage |
  | Announcements | Send announcement to one division or all, spotlight top students, direct notifications |
  | Lab Session | Start/stop lab sessions with countdown timer |
  | Moderation | Grant bonus XP (with reason log), mute/unmute students |
  | Syllabus | GTU 3150703 syllabus coverage map (green = attempted, red = not yet) |

- **Teacher CANNOT:** ban users, delete users, access other teachers' divisions (unless given all 3 in their `teacherDivisions` array)

**Additional teacher Firestore fields:**
```
role: "teacher"
teacherDivisions: ["GX", "GY", "GZ"]
teacherSince: "2024-01-15T10:30:00.000Z"
```

---

### 4C. Admin (Shivam — the developer)

- **How detected:** Email matches `ADMIN_CONFIG.adminEmails[]` OR UID matches `ADMIN_CONFIG.adminUIDs[]` (in `config/adminConfig.js`)

- **What they see:** A 🛡️ **Admin Panel** button in the navbar

- **Admin Panel tabs:**
  | Tab | What it does |
  |-----|-------------|
  | Overview | Total users, today's users, total sessions, avg session time, device/browser/OS/college breakdown |
  | Users | Full user table — search, ban, delete, promote to teacher or admin, export CSV |
  | Feedback | All user feedback with star ratings |
  | Bug Reports | All bug reports with priority levels |
  | Announcements | Send global announcement to all users |

- **Admin can do EVERYTHING** — no restrictions

---

## 5. Authentication Flow — How Login Works

File: `scripts/firebase/auth.js`

```
User clicks "Sign In with Google"
    ↓
Firebase Google popup opens
    ↓
onAuthStateChanged fires (in auth.js)
    ↓
Check: is email in adminEmails OR UID in adminUIDs?
    → YES → isAdmin = true
    → NO  → isAdmin = false
    ↓
createOrUpdateUser(user) — creates Firestore doc if first login, else updates lastLogin
    ↓
(Best effort) If isAdmin and role isn't 'admin' yet → updateProfile({role:'admin'})
(Best effort) If teacherEmails includes email and role is 'student' → updateProfile({role:'teacher'})
    ↓
SessionService.startSession(uid) — records session start
    ↓
callback(user, isAdmin, userData) fires
    ↓
app.js receives this → calls renderNavbar(), initStudentDashboard(), etc.
```

**Critical rule:** Every `await` in the auth flow is wrapped in `try-catch`. If ANY Firestore call fails, the user still sees the app. Login never gets stuck in a blank screen.

---

## 6. Config File — The One File You MUST Edit

File: `config/adminConfig.js`

```js
export const ADMIN_CONFIG = {
  appName: 'ADA Algorithm Lab',
  appVersion: '2.0.0',

  // Admin email addresses (Google accounts that become admin)
  adminEmails: [
    'joshi.shivam12507@gmail.com'   // ← Shivam's email
  ],

  // Admin Firebase UIDs (more secure — fill in after first login)
  adminUIDs: [
    'YOUR_FIREBASE_UID_HERE'        // ← Get from Firebase Console → Auth → Users
  ],

  // Teacher emails (optional — you can also promote via Admin Panel instead)
  teacherEmails: [],

  // Maintenance mode — set to true to show maintenance screen
  maintenanceMode: false,
  maintenanceMessage: 'ADA Lab is under maintenance. Back shortly!',

  // Announcement bar (shows to all users on every page load)
  announcement: '',
  announcementType: 'info',        // 'info' | 'warning' | 'success' | 'danger'
};
```

**How to find your Firebase UID:**
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select project → Authentication → Users tab
3. Sign in to the app once first
4. Find your email → copy the "User UID" column value
5. Paste it into `adminUIDs: ['paste-here']`

---

## 7. Firestore Database Structure

The Firebase project is `ada-coffiee` (that's the project ID — note the typo is intentional, it was set at creation).

### Collections:

| Collection | What it stores |
|-----------|---------------|
| `users/{uid}` | Every user's full profile, XP, achievements, history |
| `sessions/{uid}/data/{sessionId}` | Login session records |
| `notifications/{uid}/items/{notifId}` | Per-user notifications |
| `announcements/{annId}` | Global/division announcements |
| `feedback/{feedId}` | User feedback submissions |
| `bugReports/{bugId}` | Bug report submissions |
| `quizSets/{setId}` | Teacher-created quiz sets |
| `quizSets/{setId}/questions/{qId}` | Questions inside a quiz set |
| `quizResults/{uid}_{setId}` | Student quiz attempt results |
| `teacherGroups/{groupId}` | Lab seating groups |
| `teacherLabSessions/{sessionId}` | Lab session records |
| `teacherPracticals/{docId}` | Marked practical exercises |
| `teacherBonusXp/{docId}` | Bonus XP grant log |
| `teacherCountdowns/{divId}` | Live countdown timers per division |

---

## 8. How to Apply Firestore Security Rules

The file `database/firestoreRules.txt` contains security rules that protect your data.

**Apply them:**
1. Go to Firebase Console → your project → Firestore Database → **Rules** tab
2. Select all existing text and delete it
3. Open `database/firestoreRules.txt`, copy everything, paste it in
4. Click **Publish**

**What the rules do:**
- Students can only read/write their OWN `users/{uid}` document
- Teachers can read ALL users in their division (for the roster)
- Only teachers/admins can write to `announcements`, `quizSets`, `teacherLabSessions`, etc.
- Only admins can access all users, feedback, bug reports
- All users must be signed in (no anonymous access)

---

## 9. How to Deploy / Update the App

This app uses **GitHub Pages** — no server needed.

**To update:**
1. Make your code changes
2. Open GitHub.com → your repository
3. Drag and drop the changed files onto the repository (or use git push)
4. GitHub Pages automatically updates within 1-2 minutes

**GitHub Pages setup (one time):**
1. GitHub repository → Settings → Pages
2. Source: Deploy from branch → main → / (root)
3. Save → your site is live at `https://yourusername.github.io/reponame/`

---

## 10. Divisions System

VVP Engineering College CSE has three divisions:
- **GX** — one group of students
- **GY** — another group
- **GZ** — third group

**Students** select their division in the Edit Profile form (GX / GY / GZ dropdown).  
This is stored as `division: "GX"` in their Firestore document.

**Teachers** are assigned divisions when promoted:  
`teacherDivisions: ["GX", "GY"]` means that teacher manages GX and GY.

**The Teacher Console** uses the division to filter the roster — a GX/GY teacher only sees GX and GY students.

---

## 11. XP and Level System

File: `scripts/features/xp.js`

| Action | XP earned |
|--------|----------|
| Open an algorithm | +10 XP |
| Complete a visualization | +25 XP |
| Download a PDF | +15 XP |
| Log in (daily streak) | +5 XP |
| 7-day streak | Achievement: +200 XP |
| Complete a quiz | Depends on score |
| Score 100% on quiz | Achievement: +300 XP |
| First login | Welcome: included |

**Levels:**
| Level | XP Required |
|-------|------------|
| 🌱 Beginner | 0 |
| 📗 Learner | 100 |
| ⚡ Intermediate | 500 |
| 🔥 Advanced | 1500 |
| 💎 Expert | 3000 |
| 👑 Master | 6000 |

---

## 12. Achievements System

File: `scripts/features/achievements.js`

There are **20 achievements**. Each has:
- `id` (string key stored in Firestore)
- `icon`, `name`, `desc`
- `xp` bonus awarded on unlock

Achievements are checked by calling `checkAndAward(uid, userData, trigger)` where `trigger` is an event string like `'noteCreated'`, `'visualizationCompleted'`, `'reachedTop10'`.

**Example:** `first_visual` unlocks when `trigger === 'visualizationCompleted'` or `userData.visualizationsCompleted >= 1`.

---

## 13. Bugs Fixed in v2.0.0

All of these were fixed in the patch applied to this project:

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `auth.js` | Empty string `''` in `adminUIDs` matched every user | Filter with `.filter(u => u)` |
| 2 | `auth.js` | Any Firestore error during login caused blank navbar | Wrapped all Firestore calls in try-catch |
| 3 | `database.js` | `cloudBackup` field silently blocked by `updateProfile` allowlist | Added to allowed fields |
| 4 | `xp.js` | XP bar never updated (wrong element ID `xp-bar` → `dash-xp-bar`) | Fixed element ID |
| 5 | `announcements.js` | XSS vulnerability — raw user content injected into innerHTML | Added `_safe()` escape function |
| 6 | `announcements.js` | Close button used `this.closest('#ann-bar')` — invalid CSS selector | Changed to `getElementById` |
| 7 | `achievements.js` | 4 achievements (`first_visual`, `referral_1`, `quiz_perfect`, `top_10`) had no check logic | Added all 4 checks |
| 8 | `navbar.js` | "Sign In" button pointed to non-existent `login-overlay` ID | Fixed to `firebase-login-overlay` |
| 9 | `index.html` | Leaderboard tab had `style="display:none"` — permanently hidden | Removed inline style |
| 10 | `index.html` | `dash-streak`, `dash-badges`, `dash-level` IDs missing — dashboard couldn't update them | Added missing elements |
| 11 | `adminDashboard.js` | "Promote" button only made admins — no way to make a teacher | Added Teacher/Admin choice dialog |

---

## 14. Adding New Features — Where to Put Code

| What you want to add | Where to put it |
|---------------------|-----------------|
| New algorithm visualizer | `scripts/visualizers.js` + `scripts/algorithms.js` |
| New student dashboard tab | `scripts/dashboard/studentDashboard.js` |
| New teacher feature | `scripts/teacher/` (pick the right module) |
| New admin feature | `scripts/dashboard/adminDashboard.js` |
| New achievement | `scripts/features/achievements.js` (add to `ACHIEVEMENTS` array + `checks` object) |
| New CSS for teacher | `styles/teacher.css` only |
| New modal | Add HTML to `index.html` + open with `openModal('your-modal-id')` |
| New Firestore collection | Add read/write function in `scripts/firebase/firestore.js` + update security rules |

**Never edit:**
- `scripts/algorithms.js` — breaks algorithm list and search
- `scripts/visualizers.js` — breaks all visualizations
- `styles/main.css` — breaks global design
- The Firebase SDK import URLs (keep them at `10.12.2`)

---

## 15. Quick Reference — Common Tasks

### How to turn on maintenance mode
```js
// config/adminConfig.js
maintenanceMode: true,
maintenanceMessage: 'We are updating ADA Lab. Back in 30 minutes!',
```

### How to add a global announcement bar
```js
// config/adminConfig.js
announcement: 'Unit 4 quiz is now LIVE! Check your dashboard.',
announcementType: 'warning',  // or 'info', 'success', 'danger'
```

### How to add a new admin
1. Have them sign in first
2. Get their UID from Firebase Console → Authentication → Users
3. Add it to `config/adminConfig.js` → `adminUIDs: ['uid1', 'new-uid-here']`
4. Redeploy to GitHub Pages

### How to add a teacher via config (instead of Admin Panel)
```js
// config/adminConfig.js
teacherEmails: ['teacher.name@gmail.com'],
```
This auto-sets their role to `teacher` on their next login.

### How to check browser console for errors
1. Open your GitHub Pages site
2. Press **F12** (or right-click → Inspect) → Console tab
3. Look for red errors — they tell you exactly what failed

---

## 16. Contact / Credits

- **Developer:** Shivam Joshi — GTU Student, VVP Engineering College
- **Email:** joshi.shivam12507@gmail.com
- **Firebase Project ID:** ada-coffiee
- **Subject:** Analysis and Design of Algorithms (3150703) — GTU
- **Divisions:** GX, GY, GZ — CSE Department

---

*This guide was written for ADA Algorithm Lab v2.0.0. Last updated: June 2026.*
