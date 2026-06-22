# Firestore Database Structure

## Collections

### `users/{uid}`

| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Firebase UID |
| `name` | string | Display name |
| `email` | string | Email address |
| `photoURL` | string | Profile photo URL |
| `phone` | string | Phone number |
| `college` | string | College name |
| `university` | string | University name |
| `semester` | string | Current semester |
| `branch` | string | Branch/department |
| `country` / `state` / `city` | string | Location |
| `joinDate` | timestamp | Registration date |
| `lastLogin` | timestamp | Last login time |
| `lastActive` | timestamp | Last activity |
| `role` | string | `student` \| `admin` \| `banned` |
| `isPremium` | boolean | Premium status |
| `isDonor` | boolean | Has donated |
| `theme` | string | `dark` \| `light` |
| `animationSpeed` | string | `slow` \| `medium` \| `fast` |
| `totalSessions` | number | Total login sessions |
| `totalAlgorithmsUsed` | number | Algorithms opened |
| `pdfDownloads` | number | PDFs exported |
| `xp` | number | Total XP earned |
| `coins` | number | Coins earned |
| `badges` | array | Badge IDs |
| `achievements` | array | Achievement IDs |
| `currentStreak` | number | Current daily streak |
| `longestStreak` | number | Best daily streak |
| `lastStreakDate` | string | Last streak date (YYYY-MM-DD) |
| `favoriteAlgorithms` | array | Favorite algo names |
| `bookmarks` | array | Bookmarked algo names |
| `recentlyViewed` | array | Last 50 algo names |
| `searchHistory` | array | Last 100 searches |
| `referralCode` | string | Unique referral code |
| `referralCount` | number | Number of referrals |
| `profileCompletion` | number | Profile completion % |
| `browser` / `os` / `device` | string | Device info |

#### Subcollections

- `users/{uid}/notifications/{nid}` — User notifications
- `users/{uid}/notes/{nid}` — Cloud notes
- `users/{uid}/activity/{aid}` — Activity log
- `users/{uid}/pdf_history/{phid}` — PDF export history

### `sessions/{sid}`

| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | User UID |
| `startTime` | timestamp | Session start |
| `endTime` | timestamp | Session end |
| `duration` | number | Duration in seconds |
| `device` | string | Device type |

### `feedback/{fid}`

| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Submitter UID |
| `rating` | number | 1-5 star rating |
| `comment` | string | Feedback text |
| `category` | string | Feedback category |
| `status` | string | `open` \| `reviewed` |
| `timestamp` | timestamp | Submission time |

### `bug_reports/{bid}` / `feature_requests/{fid}`

Similar structure with `title`, `description`, `priority`, `status`, `votes`.

### `donations/{did}`

| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Donor UID |
| `name` | string | Donor name |
| `amount` | number | Amount in ₹ |
| `verified` | boolean | Admin verified |
| `timestamp` | timestamp | Donation time |

### `announcements/{aid}`

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Announcement title |
| `body` | string | Announcement body |
| `type` | string | `info` \| `warning` \| `success` \| `danger` |
| `active` | boolean | Is currently shown |

### `analytics/algorithms`

Key-value: `{ 'Bubble Sort': 42, 'Quick Sort': 38, ... }`

### `analytics/searches`

Key-value: `{ 'sorting': 15, 'graph': 12, ... }`

### `stats/donations`

`{ totalAmount: 1500, totalCount: 12 }`
