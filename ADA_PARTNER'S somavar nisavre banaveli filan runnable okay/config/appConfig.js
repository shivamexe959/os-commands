// ============================================================
// ADA Algorithm Lab — App Configuration
// Edit ONLY this file to change app-wide settings.
// ============================================================
export const APP_CONFIG = {
  name: 'ADA Algorithm Lab',
  version: '2.0.0',
  tagline: 'GTU 3150703 · Design & Analysis of Algorithms',
  logo: '⚡',
  logoUrl: '',                      // set to image URL to replace emoji
  author: 'Kubernama Web Services',
  website: 'https://your-site.github.io/ada-lab',
  supportEmail: 'support@example.com',

  // Theme
  primaryColor: '#3b82f6',
  accentColor: '#8b5cf6',
  successColor: '#10b981',
  dangerColor: '#ef4444',

  // Firebase — FILL IN YOUR OWN FIREBASE CONFIG
  firebase: {
  apiKey:            'AIzaSyB09vmAWFWmFYuvASq5VBQsseiRSujkyv0',
  authDomain:        'ada-coffiee.firebaseapp.com',
  projectId:         'ada-coffiee',
  storageBucket:     'ada-coffiee.firebasestorage.app',
  messagingSenderId: '1044154975863',
  appId:             '1:1044154975863:web:52e66c39f91525ee412872',
  measurementId:     'G-XLJ7C3EVBV'
},

  // Feature flags — set false to disable a module
    features: {
    xpSystem:        true,
    achievements:    true,
    leaderboard:     true,
    donations:       true,
    notes:           true,
    bookmarks:       true,
    streaks:         true,
    referral:        true,
    notifications:   true,
    announcements:   true,
    quiz:            true,
    feedback:        true,
    adminPanel:      true,
    cloudBackup:     true
  }
};
