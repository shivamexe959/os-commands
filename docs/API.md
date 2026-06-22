# Internal API Reference

## Firebase Services

### UserService (`scripts/firebase/database.js`)

```js
UserService.getUser(uid)                  // Get user data
UserService.updateProfile(uid, data)      // Update profile fields
UserService.addXP(uid, amount, reason)    // Add XP and coins
UserService.addToRecent(uid, algoName)    // Track algorithm open
UserService.toggleBookmark(uid, name)     // Toggle bookmark
UserService.toggleFavorite(uid, name)     // Toggle favorite
UserService.updateStreak(uid)             // Update daily streak
UserService.saveSearchHistory(uid, q)     // Save search query
UserService.getAllUsers(limit)            // Admin: get all users
```

### NotificationService (`scripts/firebase/firestore.js`)

```js
NotificationService.send(uid, { title, body, type })
NotificationService.sendGlobal({ title, body, type })
NotificationService.markRead(uid, nid)
NotificationService.listenToNotifications(uid, callback)
NotificationService.listenToAnnouncements(callback)
```

### DonationService

```js
DonationService.record(uid, amount, name)
DonationService.getStats()
DonationService.getTopDonors(n)
```

## XP System (`scripts/features/xp.js`)

```js
awardXP(uid, action, notify)   // Award XP for an action
getLevel(xp)                   // Get level object for XP amount
getProgress(xp)                // Get % progress to next level
```

### XP Actions

| Action | XP |
|--------|-----|
| `algoView` | 5 |
| `algoComplete` | 20 |
| `pdfExport` | 15 |
| `quizCorrect` | 20 |
| `loginStreak` | 50 |
| `referral` | 200 |
| `donation` | 500 |
