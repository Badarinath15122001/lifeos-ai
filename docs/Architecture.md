# System Architecture

This document outlines the detailed architectural layers of **LifeOS AI**.

## Core Layers

```
┌────────────────────────────────────────────────────────┐
│                      Client UI                         │
│   (Next.js App Router, React, Tailwind, Framer Motion) │
└───────────────────────────┬────────────────────────────┘
                            │ (HTTPS Callables / API routes)
                            ▼
┌────────────────────────────────────────────────────────┐
│                     Backend API                        │
│          (Cloud Functions / Next.js Server)            │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌───────────────────────────┐┌───────────────────────────┐
│     Gemini API Server     ││       Firebase DB         │
│   (LLM Routing & Logic)   ││  (Firestore / Auth / Store)│
└───────────────────────────┘└───────────────────────────┘
```

### 1. Presentation Layer (Client)
- **App Router Layouts**: Separates public spaces (Home, Auth) from authenticated workspaces (Meal, Study, Planner).
- **Interactive Dashboards**: Client-side components leveraging **Recharts** for visualizations, dynamic state selectors, and AudioContext synthesizers.
- **Context Services**: Unified context (`AppContext.tsx`) managing user logins, themes, and global setting parameters.

### 2. Services Layer
- **Client Adapters**: Resolves if Firebase credentials exist (`config.ts`). If absent, it automatically switches persistence to browser-native `localStorage` (`mockDb.ts`) and intercepts Auth gates.
- **Server Integrations**: Unified server-side endpoints executing secure generative calls without exposing keys.

### 3. Database Layer (Cloud Persistence)
- **Firebase Auth**: Supports Google OAuth and secure email/password validations.
- **Firestore**: Stores transactional meal, quiz, study session, and reminder task records grouped by `userId`.
- **Firebase Storage**: Handles user file uploads securely (vision food logs, notes).
