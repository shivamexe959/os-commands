# Project Structure

```
ADA-Algorithm-Lab/
├── index.html                    # Main application (all algorithm UI + business layer)
├── README.md
├── LICENSE
├── CHANGELOG.md
├── INSTALL.md
├── FIREBASE_SETUP.md
├── PROJECT_STRUCTURE.md
├── .gitignore
├── robots.txt
├── sitemap.xml
│
├── assets/
│   ├── qr/
│   │   └── donation-qr.png       # Replace with your UPI QR
│   ├── icons/
│   │   └── avatar.svg            # Default user avatar
│   └── images/
│
├── styles/
│   ├── main.css                  # Original v1 styles (preserved)
│   ├── layout.css                # CSS variables, body, navbar layout
│   ├── navbar.css                # v2 navbar and announcement bar
│   ├── dashboard.css             # Student dashboard styles
│   ├── admin.css                 # Admin panel styles
│   ├── components.css            # Buttons, cards, modals, forms, chips
│   ├── animations.css            # Keyframes, toasts, XP floats, achievements
│   ├── notifications.css         # Notification panel
│   ├── analytics.css             # Analytics charts
│   ├── firebase.css              # Firebase auth additions
│   ├── sidebar.css               # Sidebar additions
│   ├── algorithms.css            # Algorithm panel additions
│   └── responsive.css            # Responsive breakpoints
│
├── scripts/
│   ├── app.js                    # ★ Main entry point — orchestrates everything
│   ├── algorithms.js             # Original algorithm logic (preserved, 245KB)
│   ├── visualizers.js            # Original visualizer logic (preserved, 200KB)
│   ├── constants.js              # App-wide constants
│   ├── helpers.js                # Utility functions (debounce, format, etc.)
│   ├── utils.js                  # Re-exports all utilities
│   ├── storage.js                # localStorage wrapper
│   ├── events.js                 # Custom event bus
│   │
│   ├── firebase/
│   │   ├── firebase.js           # Firebase app initialization
│   │   ├── auth.js               # Google auth + admin detection
│   │   ├── database.js           # UserService (all user CRUD operations)
│   │   ├── firestore.js          # All other Firestore services
│   │   └── analytics.js          # Algorithm/search analytics
│   │
│   ├── algorithms/               # Algorithm category modules
│   │   ├── sorting.js
│   │   ├── searching.js
│   │   ├── greedy.js
│   │   ├── graphAlgorithms.js
│   │   ├── dynamicProgramming.js
│   │   ├── backtracking.js
│   │   └── stringAlgorithms.js
│   │
│   ├── features/                 # Business feature modules
│   │   ├── xp.js                 # XP system, levels, progress
│   │   ├── achievements.js       # Achievement unlock logic
│   │   ├── leaderboard.js        # Global and college leaderboard
│   │   ├── donations.js          # Donation panel and UPI flow
│   │   ├── notes.js              # Cloud notes CRUD
│   │   ├── statistics.js         # Stats rendering
│   │   ├── notifications.js      # Real-time notification listener
│   │   ├── feedback.js           # Feedback, bug reports, feature requests
│   │   ├── preferences.js        # User preferences form
│   │   ├── cloudBackup.js        # Cloud backup/restore
│   │   ├── searchHistory.js      # Search tracking
│   │   ├── recent.js             # Algorithm open tracking
│   │   ├── bookmarks.js          # Bookmark toggle
│   │   ├── pdf.js                # PDF export tracking
│   │   ├── share.js              # Native share API
│   │   ├── quiz.js               # Quiz system
│   │   └── announcements.js      # Announcement listener
│   │
│   ├── dashboard/
│   │   ├── studentDashboard.js   # Student dashboard orchestrator
│   │   ├── adminDashboard.js     # Admin panel orchestrator
│   │   └── analyticsDashboard.js # Analytics charts
│   │
│   └── ui/
│       ├── toast.js              # Toast notification queue
│       ├── modal.js              # Modal open/close/keydown handlers
│       ├── navbar.js             # v2 navbar renderer
│       ├── theme.js              # Dark/light theme toggle
│       ├── loader.js             # Global loading spinner
│       └── animations.js         # Fade, slide, count-up helpers
│
├── config/
│   ├── appConfig.js              # ★ Firebase config + feature flags
│   ├── adminConfig.js            # ★ Admin emails, UIDs, maintenance mode
│   └── donationConfig.js         # ★ UPI ID, QR image, donation goals
│
├── database/
│   ├── firestoreStructure.md     # Complete Firestore schema
│   └── firestoreRules.txt        # Production-ready security rules
│
└── docs/
    ├── API.md
    ├── CONTRIBUTING.md
    ├── SECURITY.md
    ├── DATABASE.md
    └── DEPLOYMENT.md
```

## ★ Files You Will Edit

| File | When |
|------|------|
| `config/appConfig.js` | First setup — Firebase credentials |
| `config/adminConfig.js` | First setup — your email/UID; maintenance mode |
| `config/donationConfig.js` | When updating UPI ID, QR image, or goals |
| `assets/qr/donation-qr.png` | Replace with your UPI QR code image |
