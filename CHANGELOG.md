# Changelog

## [2.0.0] — 2026-06-21

### Added — Business Layer
- Student Dashboard with profile, XP, streaks, statistics, achievements, leaderboard
- Admin Panel with user management, analytics, announcements, CSV export
- XP System with 10 levels and 25+ XP reward triggers
- 20 Achievements with unlock notifications
- Daily Streak tracking with calendar view
- Global and College Leaderboard
- Cloud Notes with auto-save and Firestore sync
- UPI Donation System with QR code, progress bar, supporter wall
- Notification Center with real-time Firestore listener
- Global Announcement system (admin → all users)
- Feedback Center (rating + comments)
- Bug Report Center with priority levels
- Feature Request Portal with voting
- Referral System with unique codes
- Search History tracking and analytics
- Recently Viewed algorithm history
- Bookmarks and Favorites system
- User Preferences (theme, animation speed, font size)
- Cloud Backup and Restore on login
- Session tracking (start/end/duration)
- Device analytics (browser, OS, screen)
- PDF export history tracking
- Maintenance Mode toggle in admin config
- Modular file structure: 70+ organized files

### Changed
- Added v2 navbar overlay (above existing header)
- All Firebase calls now use Firestore in addition to Realtime Database
- ES Modules for all new business feature files

### Fixed
- All issues from v1 (duplicate inline scripts, triple `</style>`)

### Preserved (100% Backward Compatible)
- All 30+ algorithm visualizers
- All animation logic
- All Firebase Authentication
- All existing HTML IDs and CSS classes
- All existing JavaScript functions

## [1.0.1] — 2026-06-18

### Fixed
- Removed duplicate inline JavaScript blocks causing `const` re-declaration SyntaxErrors
- Fixed triple `</style>` tag

## [1.0.0] — 2026-06-15

### Initial Release
- 30+ algorithm visualizers
- Firebase Google Authentication
- PDF export with jsPDF
- Algorithm categorization and search
- Responsive design
