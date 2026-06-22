# Deployment Guide

## GitHub Pages (Recommended)

1. Create a public GitHub repository
2. Upload all project files (maintain the folder structure)
3. Go to **Settings → Pages**
4. Set **Source** to `Deploy from branch`
5. Select **main** branch, **/ (root)** folder
6. Click **Save**
7. Your app will be live at: `https://yourusername.github.io/repo-name`

## Netlify

1. Drag and drop the project folder to [netlify.com/drop](https://netlify.com/drop)
2. Your app gets a `*.netlify.app` URL instantly
3. Add your domain to Firebase Authorized Domains

## Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project folder
3. Follow prompts

## Custom Domain

After deploying, add your domain to Firebase Console:
**Authentication → Settings → Authorized domains → Add domain**
