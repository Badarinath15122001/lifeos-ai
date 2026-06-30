# Firebase Configurations

This document details the configuration requirements and security setup for Firebase services in **LifeOS AI**.

## 1. Firebase Products Utilized
- **Authentication**: Email/Password and Google Sign-in providers.
- **Firestore Database**: NoSQL document store for saving meals, study quizzes, planner tasks, settings, and reminders.
- **Cloud Storage**: Object storage bucket for food photos.
- **Cloud Functions (2nd Gen)**: Server-side secure triggers communicating with Gemini.
- **Firebase Hosting**: Free CDN serverless static file hosting.

## 2. Firestore Collections Schema
Refer to [Database.md](file:///c:/Users/Admin/Downloads/Kaggle%20Capstone%20Project/docs/Database.md) for full collection fields.

## 3. Security Rules Configurations

### Firestore Security Rules
Managed in `firestore.rules`.
- Ensures users can only access documents where `request.auth.uid == resource.data.userId` or `request.auth.uid == incomingUserId`.
- Blocks unauthenticated public reads and writes.

### Cloud Storage Security Rules
Managed in `storage.rules`.
- Restricts access to objects under path `/users/{userId}/*` to the matching authenticated user only.

## 4. Local Emulator Setup
To run the Firebase suite locally with mock emulators:
```bash
firebase emulators:start
```
Ensure your frontend `config.ts` connects to localhost ports if emulator flags are turned on.
