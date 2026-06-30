# Database Schema Blueprint

This document details the NoSQL Firestore collection designs and localStorage mapping utilized by **LifeOS AI**.

---

## 1. Users Collection (`/users`)
Stores basic metadata for authenticated accounts.
```json
{
  "uid": "user_id_string",
  "email": "user@email.com",
  "displayName": "User Name",
  "photoURL": "https://url-to-avatar.png",
  "createdAt": "ISO_timestamp_string"
}
```

---

## 2. User Settings Collection (`/settings`)
Stores personalized targets for health counters and study block intervals.
```json
{
  "userId": "user_id_string",
  "theme": "light" | "dark",
  "dailyCalorieGoal": 2000,
  "dailyProteinGoal": 120,
  "dailyCarbsGoal": 220,
  "dailyFatGoal": 70,
  "studyGoalMinutes": 120,
  "notificationsEnabled": true
}
```

---

## 3. Meal Logs Collection (`/meals`)
Stores user food logs analyzed by Vision/Text.
```json
{
  "id": "meal-id-string",
  "userId": "user_id_string",
  "title": "Breakfast Scramble",
  "timestamp": "ISO_timestamp_string",
  "imageUrl": "https://firebase-storage-url-or-base64.png",
  "textDescription": "2 eggs and toast",
  "foods": [
    { "name": "Scrambled Eggs", "calories": 156, "protein": 13, "carbs": 1.1, "fat": 11, "servingSize": "2 eggs" }
  ],
  "calories": 250,
  "protein": 18,
  "carbs": 5,
  "fat": 15,
  "fiber": 2,
  "sugar": 1,
  "vitamins": ["Vitamin D"],
  "minerals": ["Iron"],
  "healthScore": 85,
  "recommendations": ["Great source of protein!"]
}
```

---

## 4. Planner Tasks Collection (`/tasks`)
Stores scheduled todo items and recurring routines.
```json
{
  "id": "task-id-string",
  "userId": "user_id_string",
  "title": "Study OS memory management",
  "date": "YYYY-MM-DD",
  "time": "HH:MM" (optional),
  "priority": "low" | "medium" | "high",
  "category": "study" | "meal" | "workout" | "personal" | "work",
  "completed": false,
  "repeat": "none" | "daily" | "weekly"
}
```

---

## 5. Quiz History Collection (`/quizzes`)
Logs completed exams and success rates.
```json
{
  "id": "quiz-id-string",
  "userId": "user_id_string",
  "topic": "React Hooks",
  "difficulty": "medium",
  "questions": [
    {
      "id": "q1",
      "question": "What hook manages states?",
      "options": ["useState", "useEffect"],
      "correctAnswer": "useState",
      "explanation": "useState initializes component reactive values."
    }
  ],
  "score": 100,
  "completedAt": "ISO_timestamp_string",
  "timeSpent": 45 // in seconds
}
```
