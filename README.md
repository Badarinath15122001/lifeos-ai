# LifeOS AI — Personal Productivity & Health Assistant

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-API-4285F4?style=for-the-badge&logo=google-gemini)](https://ai.google.dev)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**LifeOS AI** is a premium, personal productivity and health assistant that integrates the utility of ChatGPT, Notion, and Google Calendar into a single unified workspace. The platform features a central **Routing AI Agent** that dynamically redirects user requests to three specialized sub-agents: a **Meal Analyzer**, a **Study Tutor**, and a **Task Planner**.

Built entirely using Google's serverless ecosystem, it utilizes **Google Gemini 2.5 Flash** for natural language understanding, vision parsing, and structured planning outputs, backed by **Firebase** for Authentication, Firestore persistence, Cloud Storage, and 2nd Gen Cloud Functions.

---

## System Architecture

```mermaid
graph TD
    User([User Client]) -->|1. Submit Message / Voice| Router[Router AI Agent]
    
    Router -->|2. High Confidence Classification| Dis[Path Dispatcher]
    Router -->|Low Confidence| Clarify[Clarifying Prompt Modal]
    Clarify -->|User Selects Intent| Dis
    
    Dis -->|Meal Intent| Meal[Meal Analyzer Agent]
    Dis -->|Study Intent| Study[Study Tutor Agent]
    Dis -->|Planner Intent| Planner[Planner Agent]

    subgraph Specialized AI Agents [Gemini 2.5 Flash Engine]
        Meal -->|Analyze Nutrition / Vision| Gem[Gemini API Server]
        Study -->|Flashcards / Tutor Chat| Gem
        Planner -->|Extract Reminders / Schedule| Gem
    </div>

    subgraph Firebase Cloud Storage & Database
        AllAgents[All Workspace Pages] -->|Read / Write| Auth[Firebase Auth]
        AllAgents -->|Store Records| Firestore[(Cloud Firestore / localStorage)]
        AllAgents -->|Upload Files| Storage[(Firebase Storage)]
    </div>
```

---

## Core Features

### 1. Central Router Agent
* **Intent Routing**: Analyzes natural language strings (e.g. "I ate three eggs" or "remind me to pay bills tomorrow") and automatically redirects the user to the correct page with their request loaded.
* **Ambient Dialogues**: Asks clarifying questions if classification confidence falls below 75%.
* **Multimodal Actions**: Integrated **Web Speech API** for hands-free voice dictation (Speech-to-Text) and vocalized AI replies (Text-to-Speech).

### 2. Meal Analyzer (Vision + Nutrition)
* **Visual Food Log**: Drag-and-drop meal images (PNG/JPG/WEBP) for automated food recognition, macro calculations, and portion sizing.
* **Macronutrient Dashboard**: Interactive charts (Recharts) detailing Macro percentages, calories-by-food bars, and daily target calorie meters.
* **AI Coach Insights**: Real-time qualitative scoring and health adjustments (e.g., "Add greens to increase fiber", "Limit high-sodium items").

### 3. Study & Tutor AI
* **Interactive Tutor Chat**: Explains complex topics, provides analogical stories, and builds memorization mnemonics.
* **Spaced Repetition Deck**: Standardized flashcards compiling questions and answers with a 3D-flipping recall interface.
* **Focus Pomodoro Timer**: Visual ticking rings (25/5, 50/10, Custom) with a built-in browser AudioContext synth chime that logs focus metrics to user history.
* **Course Planner**: Generates 4-day revision timetables based on target dates and study hours.

### 4. Planning & Scheduler AI
* **Reminder Extraction**: Converts natural language lines to structured tasks (Date, Time, priority, categories).
* **AI Conflict Solver**: Optimizes schedules when allocating heavy task workloads by avoiding work/sleep hours and scheduling breaks.
* **Kanban & Calendar Views**: Full weekly/monthly calendar grids and drag-to-complete Kanban columns.

---

## Technology Stack

* **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts
* **Backend**: Firebase Authentication, Cloud Firestore (Database), Firebase Storage (Uploads), Firebase Hosting, 2nd Gen Cloud Functions (TypeScript)
* **AI Engine**: Google Gemini API (`gemini-2.5-flash`)

---

## Local Development (Zero Setup Mock Mode)

To allow instant testing locally without configuring Google Cloud/Firebase billing accounts, this project includes a **Dual-Mode Persistence Layer**. If no credentials are found in environment variables, the application runs entirely in a **local mock mode** (saving logs to `localStorage` and running smart keyword mock parsers for AI responses).

### 1. Clone & Install
```bash
git clone https://github.com/your-username/LifeOS-AI.git
cd LifeOS-AI
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env.local` and add your real keys once ready, or keep default settings for local mock running:
```bash
cp .env.example .env.local
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Deployment Instructions

### 1. Firebase Project Setup
Initialize a project inside the [Firebase Console](https://console.firebase.google.com/).
1. Enable **Authentication** (Email/Password & Google OAuth).
2. Create a **Firestore Database** in Native Mode.
3. Enable **Cloud Storage**.

### 2. Deploy Backend Cloud Functions
Ensure you have the Firebase CLI installed:
```bash
npm install -g firebase-tools
firebase login
firebase use --add [your-firebase-project-id]
```
Configure your Gemini API key in Cloud Functions:
```bash
firebase functions:secrets:set GEMINI_API_KEY=your_actual_key_here
```
Deploy functions:
```bash
npm run deploy --prefix functions
```

### 3. Deploy Frontend Hosting
Change the backend mode in `.env.local` (set `NEXT_PUBLIC_USE_FIREBASE_FUNCTIONS=true`) and run:
```bash
npm run build
firebase deploy --only hosting
```

---

## Suggested Git Commit Sequence

To maintain clean repository standards, follow this progression of commits:
1. `feat: initial project setup and Tailwind configurations`
2. `feat: add Firebase configurations and localStorage mockDb service`
3. `feat: implement landing page and Router AI Agent`
4. `feat: implement Meal Analyzer dashboard and Recharts visualizations`
5. `feat: implement Study Tutor, flashcard widgets, and Pomodoro focus timer`
6. `feat: implement Planner Kanban task board and Calendar schedule grids`
7. `feat: build local server API routes for Gemini API integrations`
8. `feat: build Firebase Cloud Functions callable endpoints`
9. `feat: configure firestore.rules and storage.rules security parameters`
10. `docs: update README and API/architecture blueprints`

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
