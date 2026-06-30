import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Smart fallback task extractor & scheduler
function fallbackPlanner(action: string, text: string, currentDateStr: string) {
  const lower = text.toLowerCase();
  const currentDate = new Date(currentDateStr);
  
  if (action === "extract-task") {
    let title = "New Task";
    let dateStr = currentDate.toISOString().split("T")[0]; // today by default
    let timeStr = "12:00";
    let priority: "low" | "medium" | "high" = "medium";
    let category: "study" | "meal" | "workout" | "personal" | "work" = "personal";
    let duration = 30; // 30 minutes
    let repeat: "none" | "daily" | "weekly" = "none";

    // Extract title
    if (lower.includes("remind me to")) {
      const match = text.match(/remind me to (.*?)(?:tomorrow|today|next|at|on|$)/i);
      if (match && match[1]) title = match[1].trim();
    } else if (lower.includes("book")) {
      const match = text.match(/book (.*?)(?:tomorrow|today|next|at|on|$)/i);
      if (match && match[1]) title = "Book " + match[1].trim();
    } else {
      title = text.slice(0, 30);
    }

    // Clean up trailing prepositions in title
    title = title.replace(/\s+(at|on|tomorrow|next)\s*$/i, "").trim();

    // Parse date
    if (lower.includes("tomorrow")) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateStr = tomorrow.toISOString().split("T")[0];
    } else if (lower.includes("friday")) {
      // Find next Friday
      const friday = new Date(currentDate);
      const dayOffset = (5 - friday.getDay() + 7) % 7 || 7;
      friday.setDate(friday.getDate() + dayOffset);
      dateStr = friday.toISOString().split("T")[0];
    } else if (lower.includes("next monday")) {
      const monday = new Date(currentDate);
      const dayOffset = (1 - monday.getDay() + 7) % 7 || 7;
      monday.setDate(monday.getDate() + dayOffset);
      dateStr = monday.toISOString().split("T")[0];
    }

    // Parse time
    const timeMatch = text.match(/(\d+)\s*(am|pm)/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const ampm = timeMatch[2].toLowerCase();
      if (ampm === "pm" && hour < 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0;
      timeStr = `${hour.toString().padStart(2, "0")}:00`;
    } else if (lower.includes("evening")) {
      timeStr = "18:00";
    } else if (lower.includes("morning")) {
      timeStr = "08:00";
    }

    // Parse priority
    if (lower.includes("urgent") || lower.includes("important") || lower.includes("must")) {
      priority = "high";
    } else if (lower.includes("low") || lower.includes("leisure")) {
      priority = "low";
    }

    // Parse category
    if (lower.includes("study") || lower.includes("learn") || lower.includes("read")) {
      category = "study";
      duration = 60;
    } else if (lower.includes("gym") || lower.includes("workout") || lower.includes("run") || lower.includes("exercise")) {
      category = "workout";
      duration = 60;
    } else if (lower.includes("eat") || lower.includes("cook") || lower.includes("lunch") || lower.includes("dinner")) {
      category = "meal";
      duration = 45;
    } else if (lower.includes("work") || lower.includes("meeting") || lower.includes("project")) {
      category = "work";
      duration = 60;
    }

    // Parse repeat
    if (lower.includes("every day") || lower.includes("daily")) {
      repeat = "daily";
    } else if (lower.includes("every week") || lower.includes("weekly")) {
      repeat = "weekly";
    }

    return {
      title,
      date: dateStr,
      time: timeStr,
      priority,
      category,
      duration,
      repeat
    };
  }

  if (action === "auto-schedule") {
    // Parse demands like "study for 3 hours and gym for 1 hour"
    let studyHours = 2;
    let gymHours = 1;

    const studyMatch = text.match(/study\s+(?:for\s+)?(\d+)\s*hour/i);
    if (studyMatch) studyHours = parseInt(studyMatch[1]);

    const gymMatch = text.match(/(?:gym|workout)\s+(?:for\s+)?(\d+)\s*hour/i);
    if (gymMatch) gymHours = parseInt(gymMatch[1]);

    const dateStr = currentDate.toISOString().split("T")[0];

    // Find slots in evening after work hours (e.g. 5 PM onwards)
    // Avoid overlaps: Study AI from 6 PM to 9 PM, Gym from 9 PM to 10 PM.
    const scheduled = [
      {
        id: `task-sch-1`,
        title: "Study AI Block",
        date: dateStr,
        time: "18:00",
        duration: studyHours * 60,
        priority: "high",
        category: "study",
        completed: false,
        repeat: "none"
      },
      {
        id: `task-sch-2`,
        title: "Gym Workout",
        date: dateStr,
        time: (18 + studyHours).toString().padStart(2, "0") + ":15",
        duration: gymHours * 60,
        priority: "medium",
        category: "workout",
        completed: false,
        repeat: "none"
      }
    ];

    return { scheduledTasks: scheduled };
  }

  return { error: "Action not recognized" };
}

export async function POST(req: NextRequest) {
  try {
    const { action, text, currentDate } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    const todayStr = currentDate || new Date().toISOString();

    if (!apiKey) {
      console.log(`Gemini API Key missing. Running fallback Planner [${action}].`);
      await new Promise(r => setTimeout(r, 1000));
      return NextResponse.json(fallbackPlanner(action, text, todayStr));
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      if (action === "extract-task") {
        const prompt = `
        You are the Planner Agent for LifeOS AI. Your job is to extract task parameters from a user's natural language request.
        Current Time Context: ${todayStr} (Refer to this ISO timestamp when resolving relative times like "tomorrow", "next Monday", "Friday", "at 8 AM").
        
        Analyze this text: "${text}"

        You must return a valid JSON object matching this schema exactly:
        {
          "title": "Clean Task Description",
          "date": "YYYY-MM-DD",
          "time": "HH:MM" (or omit if no specific time),
          "priority": "low" | "medium" | "high",
          "category": "study" | "meal" | "workout" | "personal" | "work",
          "duration": number (estimated duration in minutes, default 30),
          "repeat": "none" | "daily" | "weekly" | "monthly" | "yearly"
        }
        `;

        const result = await model.generateContent(prompt);
        const jsonText = (await result.response).text().trim();
        const parsed = JSON.parse(jsonText);
        return NextResponse.json(parsed);
      }

      if (action === "auto-schedule") {
        const prompt = `
        You are the Planner Agent for LifeOS AI. Your job is to schedule conflict-free tasks based on a user's verbal request.
        Current Time Context: ${todayStr}.
        Avoid overlaps.
        Do not schedule during standard sleep hours (10 PM - 7 AM) or work/school hours (9 AM - 5 PM) unless requested.
        Suggest short breaks between heavy tasks.
        
        Analyze this request: "${text}"

        You must return a valid JSON object matching this schema:
        {
          "scheduledTasks": [
            {
              "title": "Task title",
              "date": "YYYY-MM-DD",
              "time": "HH:MM",
              "duration": number (minutes),
              "priority": "low" | "medium" | "high",
              "category": "study" | "meal" | "workout" | "personal" | "work"
            }
          ]
        }
        `;

        const result = await model.generateContent(prompt);
        const jsonText = (await result.response).text().trim();
        const parsed = JSON.parse(jsonText);
        return NextResponse.json(parsed);
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (apiError) {
      console.error("Gemini API Planner failed, running local fallback:", apiError);
      return NextResponse.json(fallbackPlanner(action, text, todayStr));
    }
  } catch (error) {
    console.error("Planner route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const maxDuration = 30;
