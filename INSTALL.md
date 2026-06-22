# Installation Guide

## Prerequisites

- A Firebase account (free Spark plan is sufficient)
- A GitHub account (for GitHub Pages hosting)
- A modern browser (Chrome, Firefox, Edge, Safari)

## Step-by-Step Installation

### 1. Download the Project

Download the ZIP file and extract it to a folder named `ada-lab`.

### 2. Set Up Firebase

Follow [FIREBASE_SETUP.md](FIREBASE_SETUP.md) to:
- Create a Firebase project
- Enable Google Authentication
- Set up Firestore Database
- Apply security rules

### 3. Configure the App

Edit **`config/appConfig.js`** and replace the Firebase config:

```js
firebase: {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'your-project.firebaseapp.com',
  projectId:         'your-project-id',
  storageBucket:     'your-project.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID'
}
```

### 4. Set Admin Access

Edit **`config/adminConfig.js`**:

```js
adminEmails: ['your@email.com'],
adminUIDs: ['your-firebase-uid']
```

### 5. Set Donation Details

Edit **`config/donationConfig.js`**:

```js
upiId:   'yourname@upi',
upiName: 'Your Name',
qrImageUrl: 'assets/qr/donation-qr.png'
```

Replace `assets/qr/donation-qr.png` with your UPI QR image.

### 6. Deploy to GitHub Pages

1. Create a new GitHub repository (public)
2. Upload all project files
3. Go to **Settings → Pages → Source → Deploy from branch → main**
4. Your app will be live at `https://yourusername.github.io/ada-lab`

## Updating Admin Email

Only edit `config/adminConfig.js`. No other files need to change.

## Updating UPI/Donation Details

Only edit `config/donationConfig.js`. No other files need to change.

## Adding a New Algorithm

1. Add your algorithm logic to `scripts/algorithms.js`
2. Add the visualizer to `scripts/visualizers.js`
3. Add the HTML panel to `index.html`
4. Add the algorithm name to `ALGORITHM_XP` in `scripts/constants.js`
