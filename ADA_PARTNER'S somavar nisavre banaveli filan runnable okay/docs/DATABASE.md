# Database Documentation

See [../database/firestoreStructure.md](../database/firestoreStructure.md) for the full Firestore schema.

## Key Design Decisions

1. **Denormalized user document** — All user stats in one document for fast reads
2. **Subcollections for lists** — Notes, notifications, activity use subcollections to avoid document size limits
3. **Analytics as key-value maps** — Algorithm and search counts stored as Firestore map fields with `increment()`
4. **Session tracking** — Separate `sessions` collection for time-series analysis
5. **Minimal reads** — Dashboard loads user document once; real-time features use `onSnapshot` listeners
