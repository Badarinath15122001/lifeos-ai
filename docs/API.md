# API Blueprints

This document outlines the API endpoints and JSON structures utilized by the LifeOS AI client to communicate with the server backend.

---

## 1. Router Agent
- **Endpoint**: `/api/router-agent` (Local Next.js) or `routerAgent` (Cloud Function)
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "message": "I ate three scrambled eggs"
  }
  ```
- **Response (JSON)**:
  ```json
  {
    "agent": "meal" | "study" | "planner",
    "confidence": 0.95,
    "reason": "User mentioned eating eggs, pointing to meal analyzer.",
    "question": null
  }
  ```

---

## 2. Meal Analyzer
- **Endpoint**: `/api/meal-analyzer` (Local Next.js) or `analyzeMeal` (Cloud Function)
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "textDescription": "Salad and water",
    "image": "base64_encoded_string_optional",
    "mimeType": "image/png"
  }
  ```
- **Response (JSON)**:
  ```json
  {
    "foods": [
      { "name": "Mixed Garden Salad", "calories": 45, "protein": 1.5, "carbs": 8, "fat": 0.2, "servingSize": "1 bowl" }
    ],
    "calories": 45,
    "protein": 1.5,
    "carbs": 8,
    "fat": 0.2,
    "fiber": 4,
    "sugar": 2,
    "vitamins": ["Vitamin K", "Vitamin A"],
    "minerals": ["Potassium", "Iron"],
    "healthScore": 95,
    "recommendations": ["Excellent vegetable intake!"]
  }
  ```

---

## 3. Study Tutor
- **Endpoint**: `/api/study-tutor` (Local Next.js) or `studyTutor` (Cloud Function)
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "action": "generate-analogy" | "generate-mnemonic" | "generate-flashcards" | "generate-plan" | "chat",
    "topic": "Operating Systems Paging",
    "message": "Explain pages vs frames"
  }
  ```
- **Response (JSON)**:
  - For conversational actions:
    ```json
    {
      "content": "### Explanation...\n\nAnalogies: ..."
    }
    ```
  - For Flashcards:
    ```json
    {
      "flashcards": [
        { "id": "1", "front": "Question?", "back": "Answer." }
      ]
    }
    ```

---

## 4. Planner Agent
- **Endpoint**: `/api/planner-agent` (Local Next.js) or `plannerAgent` (Cloud Function)
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "action": "extract-task" | "auto-schedule",
    "text": "Remind me tomorrow at 8 AM to run",
    "currentDate": "2026-06-30T11:17:35.000Z"
  }
  ```
- **Response (JSON)**:
  ```json
  {
    "title": "Run",
    "date": "2026-07-01",
    "time": "08:00",
    "priority": "medium",
    "category": "workout",
    "duration": 30,
    "repeat": "none"
  }
  ```
