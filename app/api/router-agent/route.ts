import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Fallback keyword-based router
function fallbackRoute(message: string) {
  const lower = message.toLowerCase();
  
  // 1. Meal keywords
  const mealKeywords = ["eat", "egg", "banana", "food", "calorie", "meal", "breakfast", "lunch", "dinner", "snack", "nutrition", "carbs", "protein", "diet", "macros"];
  const mealMatches = mealKeywords.filter(k => lower.includes(k)).length;

  // 2. Study keywords
  const studyKeywords = ["study", "explain", "tutor", "learn", "concept", "quiz", "test", "exam", "flashcard", "homework", "mnemonic", "course", "subject", "teach"];
  const studyMatches = studyKeywords.filter(k => lower.includes(k)).length;

  // 3. Planner keywords
  const plannerKeywords = ["remind", "schedule", "calendar", "todo", "task", "appointment", "dentist", "gym", "meet", "workout", "book", "tomorrow", "every day", "at 7", "friday"];
  const plannerMatches = plannerKeywords.filter(k => lower.includes(k)).length;

  const total = mealMatches + studyMatches + plannerMatches;

  if (total === 0) {
    return {
      agent: "study",
      confidence: 0.50,
      reason: "No strong keywords matched. Defaulting to tutor.",
      question: "Would you like Nutrition (Meal), Study (Tutor), or Planning assistance?"
    };
  }

  const max = Math.max(mealMatches, studyMatches, plannerMatches);
  const confidence = Math.min(0.70 + (max / total) * 0.25, 0.98);

  if (mealMatches === max) {
    return {
      agent: "meal",
      confidence,
      reason: "Matched nutrition-related keywords."
    };
  } else if (studyMatches === max) {
    return {
      agent: "study",
      confidence,
      reason: "Matched education/tutor keywords."
    };
  } else {
    return {
      agent: "planner",
      confidence,
      reason: "Matched reminder/scheduling keywords."
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Use fallback route if API key is not configured
    if (!apiKey) {
      console.log("Gemini API Key missing. Running fallback Router Agent.");
      return NextResponse.json(fallbackRoute(message));
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const prompt = `
      You are the Router Agent for LifeOS AI. Your job is to classify the user's message into one of three categories:
      1. "meal" (Nutrition, meals, food logs, diet, calorie checks, recipe analysis, eating logs)
      2. "study" (Learning, education, explain concepts, tutoring, study planning, exam preparation, flashcards, quizzes, coding questions)
      3. "planner" (Reminders, tasks, schedules, calendar appointments, scheduling events, time allocations, todo lists)

      You must return a valid JSON object. The response must match this schema:
      {
        "agent": "meal" | "study" | "planner",
        "confidence": number (between 0.0 and 1.0 representing how confident you are),
        "reason": "short explanation of classification",
        "question": "clarifying question if confidence is low (< 0.75)"
      }

      If the request is ambiguous (e.g. "hi", "how are you", "help me"), return a confidence score below 0.75 and formulate a clarifying question asking if they want help with meal analysis, studying, or task planning.

      User message: "${message}"
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (apiError) {
      console.error("Gemini API router failed, running local fallback:", apiError);
      return NextResponse.json(fallbackRoute(message));
    }
  } catch (error) {
    console.error("Router route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
