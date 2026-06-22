# Security Guide

## Firestore Security Rules

The included rules (`database/firestoreRules.txt`) enforce:

- Users can only read/write their own documents
- Admins can read all documents
- Banned users cannot submit feedback or bug reports
- Anonymous access is not permitted
- Delete operations require admin role

## Input Sanitization

All user inputs displayed in HTML are sanitized via the `_esc()` helper which escapes `< > & "` characters.

## Admin Verification

Admin access is verified by TWO conditions:
1. Email must be in `adminConfig.adminEmails`
2. OR Firebase UID must be in `adminConfig.adminUIDs`

Never rely on client-side role checks alone — always enforce with Firestore rules.

## Secrets

- Firebase API keys in `appConfig.js` are **public** by design (they are restricted by Firebase rules and authorized domains)
- Never commit admin UIDs to a public repo — use environment variables or a private config
- UPI IDs are semi-public; the QR image provides the actual payment path
