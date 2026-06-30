import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as admin from "firebase-admin";

admin.initializeApp();

// Helper to get Gemini API Key
const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new HttpsError(
      "failed-precondition",
      "The Gemini API key is not configured in backend environment variables."
    );
  }
  return key;
};

/**
 * 1. Router Agent
 * Classifies input message to 'meal', 'study', or 'planner'
 */
export const routerAgent = onCall({ maxInstances: 10 }, async (request: CallableRequest) => {
  // Authentication check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { message } = request.data;
  if (!message) {
    throw new HttpsError("invalid-argument", "Message is required.");
  }

  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    You are the Router Agent for LifeOS AI. Classify this message: "${message}"
    Categorize into:
    - "meal": nutrition, eating, calorie logs, food items.
    - "study": education, tutoring, concept explanations, flashcards, quizzes.
    - "planner": tasks, reminders, schedules, calendar todo items.

    Return JSON schema:
    {
      "agent": "meal" | "study" | "planner",
      "confidence": number (0.0 to 1.0),
      "reason": "explanation string",
      "question": "clarifying question if confidence < 0.75"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return JSON.parse(text);
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to parse intent.");
  }
});

/**
 * 2. Meal Analyzer Agent
 * Extracts nutrition data from food logs (supports text and vision)
 */
export const analyzeMeal = onCall({ maxInstances: 10 }, async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { textDescription, image, mimeType } = request.data;
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const systemPrompt = `
    You are the Meal Analyzer Agent for LifeOS AI. Analyze food text/images and return:
    JSON Schema:
    {
      "foods": [
        { "name": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "servingSize": "..." }
      ],
      "calories": 0,
      "protein": 0,
      "fat": 0,
      "carbs": 0,
      "fiber": 0,
      "sugar": 0,
      "vitamins": ["Vitamin A", "Vitamin C"],
      "minerals": ["Calcium", "Iron"],
      "healthScore": 0,
      "recommendations": ["..."]
    }
  `;

  try {
    let result;
    if (image && mimeType) {
      const imagePart = {
        inlineData: { data: image, mimeType: mimeType }
      };
      const textPrompt = `Analyze meal: "${textDescription || "No text description"}"`;
      result = await model.generateContent([systemPrompt, textPrompt, imagePart]);
    } else {
      const textPrompt = `Analyze meal: "${textDescription}"`;
      result = await model.generateContent([systemPrompt, textPrompt]);
    }

    const text = result.response.text().trim();
    return JSON.parse(text);
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to analyze meal.");
  }
});

/**
 * 3. Study Tutor Agent
 * General educational tutor (explaining concepts, analogies, mnemonics)
 */
export const studyTutor = onCall({ maxInstances: 10 }, async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { action, topic, message } = request.data;
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let prompt = `Explain topic: "${topic || message}" in markdown format with code examples.`;
  if (action === "generate-analogy") {
    prompt = `Explain topic: "${topic}" using a highly vivid, clear, and simple analogy.`;
  } else if (action === "generate-mnemonic") {
    prompt = `Create a creative mnemonic phrase to help memorize key elements of: "${topic}".`;
  }

  try {
    const result = await model.generateContent(prompt);
    return { content: result.response.text().trim() };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Tutor request failed.");
  }
});

/**
 * 4. Study Quiz Generator
 * Generates custom quizzes
 */
export const studyQuiz = onCall({ maxInstances: 10 }, async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { topic, difficulty, questionCount } = request.data;
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const structuralModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    Generate a quiz on topic: "${topic}" with difficulty: "${difficulty}" containing ${questionCount} questions.
    Return JSON schema:
    {
      "topic": "topic name",
      "questions": [
        {
          "id": "q1",
          "question": "...",
          "type": "mcq" | "tf" | "fill" | "coding",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "...",
          "explanation": "..."
        }
      ]
    }
  `;

  try {
    const result = await structuralModel.generateContent(prompt);
    const text = result.response.text().trim();
    return JSON.parse(text);
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to generate quiz.");
  }
});

/**
 * 5. Planner Agent
 * Extracts tasks / Auto schedules
 */
export const plannerAgent = onCall({ maxInstances: 10 }, async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { action, text, currentDate } = request.data;
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  try {
    if (action === "extract-task") {
      const prompt = `
        Extract task from: "${text}"
        Current date context: ${currentDate}.
        Return JSON schema:
        {
          "title": "Clean Task Description",
          "date": "YYYY-MM-DD",
          "time": "HH:MM",
          "priority": "low" | "medium" | "high",
          "category": "study" | "meal" | "workout" | "personal" | "work",
          "duration": 30,
          "repeat": "none" | "daily" | "weekly"
        }
      `;
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text().trim());
    } else if (action === "auto-schedule") {
      const prompt = `
        Schedule tasks for: "${text}"
        Current date context: ${currentDate}. Avoid overlaps, respect sleep and work hours.
        Return JSON schema:
        {
          "scheduledTasks": [
            {
              "title": "Task title",
              "date": "YYYY-MM-DD",
              "time": "HH:MM",
              "duration": 60,
              "priority": "medium",
              "category": "study"
            }
          ]
        }
      `;
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text().trim());
    }
    
    throw new HttpsError("invalid-argument", "Action not recognized.");
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Planner request failed.");
  }
});
