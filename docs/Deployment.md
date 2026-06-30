# Deployment Guide

This document outlines the step-by-step procedure to deploy **LifeOS AI** to the Firebase serverless cloud.

## Prerequisites
- Node.js v20+ and npm installed.
- A Firebase project initialized in the [Firebase Console](https://console.firebase.google.com).
- Firebase CLI installed globally:
  ```bash
  npm install -g firebase-tools
  ```

---

## 1. Firebase Login & Initialization
Log in via CLI:
```bash
firebase login
```
Associate the local codebase with your remote project ID:
```bash
firebase use --add [your-project-id]
```

---

## 2. Deploying Firebase Cloud Functions
Deploying functions requires setting up your secure Gemini API key in Secret Manager:
```bash
firebase functions:secrets:set GEMINI_API_KEY=your_key_here
```
Now, build the TypeScript source code and deploy functions:
```bash
npm run build --prefix functions
firebase deploy --only functions
```

---

## 3. Deploying Frontend Hosting
1. Toggle the frontend adapter to point to Cloud Functions rather than local API routes. Open `.env.local` or `.env.production` and modify:
   ```env
   NEXT_PUBLIC_USE_FIREBASE_FUNCTIONS=true
   ```
2. Build the Next.js static output:
   ```bash
   npm run build
   ```
3. Deploy Hosting files to the Firebase CDN:
   ```bash
   firebase deploy --only hosting
   ```

Once completed, the CLI will output your live URL, e.g., `https://[your-project-id].web.app`.
