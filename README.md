# ⚡ ADA Algorithm Lab v2.0

> GTU 3150703 · Design & Analysis of Algorithms — Interactive Learning Platform

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://your-username.github.io/ada-lab)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-purple)](LICENSE)

## 🚀 What is ADA Lab?

ADA Algorithm Lab is a **production-ready interactive learning platform** for students studying Design and Analysis of Algorithms (GTU subject 3150703). It features:

- ✅ **30+ Algorithm Visualizers** — Sorting, Searching, Greedy, Graph, DP, Backtracking, String
- 🎯 **XP & Level System** — Earn experience points for every learning action
- 🏆 **Leaderboard** — Compete with peers globally and by college
- 🏅 **20+ Achievements** — Unlock badges as you progress
- 📊 **Student Dashboard** — Track streaks, notes, favorites, history
- 🛡️ **Admin Panel** — Full user analytics, announcements, CSV export
- ❤️ **Donation System** — UPI + QR code + Buy Me a Coffee
- 📝 **Cloud Notes** — Create, auto-save, and sync notes to Firestore
- 🔥 **Daily Streaks** — Maintain your learning momentum
- 🔔 **Notifications** — Real-time achievement and system alerts

## 🛠️ Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ada-lab.git
   cd ada-lab
   ```

2. **Configure Firebase** — See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

3. **Set your admin email** — Edit `config/adminConfig.js`

4. **Set your donation details** — Edit `config/donationConfig.js`

5. **Deploy to GitHub Pages** — Push to `main` branch and enable GitHub Pages in repository settings

## 📁 Project Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for full details.

## ⚙️ Configuration

| File | Purpose |
|------|---------|
| `config/appConfig.js` | Firebase config, feature flags, app metadata |
| `config/adminConfig.js` | Admin emails, UIDs, maintenance mode |
| `config/donationConfig.js` | UPI ID, QR image, donation goals |

## 📖 Documentation

- [INSTALL.md](INSTALL.md) — Installation guide
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) — Firebase configuration
- [DATABASE.md](database/firestoreStructure.md) — Firestore schema
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Deployment guide
- [CHANGELOG.md](CHANGELOG.md) — Version history

## 🔐 Security

- Role-based access control (student / admin / banned)
- Firestore Security Rules included — see `database/firestoreRules.txt`
- Input sanitization on all user-submitted content
- Admin verification by email AND Firebase UID

## 📄 License

MIT © 2026 Kubernama Web Services
