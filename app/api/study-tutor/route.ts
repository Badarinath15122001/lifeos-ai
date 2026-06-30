import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";

// Smart study fallback generator
function fallbackStudyTutor(action: string, topic: string, message?: string) {
  const t = (topic || message || "General Study").toLowerCase();
  
  if (action === "generate-flashcards") {
    let flashcards = [
      { id: "1", front: "What is the primary role of the CPU?", back: "The Central Processing Unit (CPU) executes instructions of a computer program, performing basic arithmetic, logical, control and input/output operations." },
      { id: "2", front: "Explain the difference between RAM and Storage.", back: "RAM (Random Access Memory) is volatile short-term memory that holds open applications. Storage (SSD/HDD) is non-volatile long-term memory that retains files after shutdown." },
      { id: "3", front: "What is an Algorithm?", back: "A step-by-step procedure or set of rules to be followed in calculations or other problem-solving operations, especially by a computer." },
      { id: "4", front: "What is version control (e.g., Git)?", back: "A system that records changes to a file or set of files over time so that you can recall specific versions later." },
      { id: "5", front: "What does API stand for and what does it do?", back: "Application Programming Interface. It defines interactions between multiple software intermediaries, letting them speak to each other." }
    ];

    if (t.includes("operating system") || t.includes("os")) {
      flashcards = [
        { id: "os-1", front: "What is virtual memory?", back: "A memory management technique where secondary storage (SSD/HDD) is used as if it were part of the main memory (RAM), using paging." },
        { id: "os-2", front: "Explain the difference between a Process and a Thread.", back: "A Process is an executing instance of an application with its own memory space. A Thread is a path of execution within a process that shares resources." },
        { id: "os-3", front: "What is a Deadlock in operating systems?", back: "A situation where two or more processes are unable to proceed because each is waiting for the other to release a resource." },
        { id: "os-4", front: "What is Kernel Mode?", back: "The highest privilege level of execution in CPU, allowing unrestricted access to underlying hardware and memory." },
        { id: "os-5", front: "What is a System Call?", back: "The programmatic interface by which a user-space application requests services from the operating system kernel." }
      ];
    } else if (t.includes("react") || t.includes("frontend")) {
      flashcards = [
        { id: "react-1", front: "What is the Virtual DOM?", back: "A programming concept where an ideal, or 'virtual', representation of a UI is kept in memory and synced with the 'real' DOM via reconciliation." },
        { id: "react-2", front: "What does the 'useRef' hook do?", back: "Returns a mutable ref object whose '.current' property is initialized with the passed argument, persisting across renders without triggering a re-render." },
        { id: "react-3", front: "What is Hydration in Next.js?", back: "The process of client-side JavaScript attaching event listeners and state to the server-side pre-rendered HTML." },
        { id: "react-4", front: "Explain state vs props in React.", back: "State is local data managed within a component that can change over time. Props are configuration parameters passed down from a parent component." },
        { id: "react-5", front: "Why do we need 'key' prop in list renders?", back: "Keys help React identify which items have changed, been added, or been removed, optimizing DOM update reconciliations." }
      ];
    }

    return { flashcards };
  }

  if (action === "generate-plan") {
    return {
      topic,
      schedule: [
        { day: 1, title: "Foundations & Core Terminology", hours: 2, tasks: [`Read basic definitions for ${topic}`, "Watch introductory tutorials", "Summarize core principles in notes"] },
        { day: 2, title: "Intermediate Concepts & Core Architecture", hours: 3, tasks: [`Study architectural details of ${topic}`, "Sketch a visual concept map", "Run through 5 practical exercise questions"] },
        { day: 3, title: "Edge Cases & Advanced Deep Dive", hours: 3, tasks: [`Examine advanced implementations of ${topic}`, "Write a brief markdown summary report", "Generate mnemonics for hard sections"] },
        { day: 4, title: "Review, Active Recall & Practice Quiz", hours: 2, tasks: ["Run quiz questions", "Review incorrect cards", "Perform a 25-minute Pomodoro focus test"] }
      ]
    };
  }

  // Default response (analogy, mnemonic, chat)
  let textResponse = `### Explanation for **${topic}**\n\nTo understand this concept, it helps to break it down. `;
  
  if (action === "generate-analogy") {
    if (t.includes("operating system") || t.includes("os")) {
      textResponse += `\n\n**Analogy**: Think of an Operating System like the **manager of a busy restaurant**.\n- The **Kitchen staff** is the hardware CPU and RAM.\n- The **Customers** are user-space applications (Word, Chrome).\n- The **Manager** (OS Kernel) takes orders, schedules tables, allocates plates (memory), and ensures customers don't run into the kitchen to grab food themselves!`;
    } else {
      textResponse += `\n\n**Analogy**: Think of this concept like a **librarian organizing a massive library**. Instead of dumping books randomly on the floor (unstructured memory), the librarian shelves them using a clean index (data structures) so that any book can be found in seconds (efficient time complexity).`;
    }
  } else if (action === "generate-mnemonic") {
    textResponse += `\n\nHere is a mnemonic memory helper to remember key components:\n\n**"P.E.A.C.H."**\n- **P**rocess scheduling\n- **E**xception handling\n- **A**ddress translation\n- **C**ache management\n- **H**ardware access`;
  } else {
    // Chat responder
    textResponse += `Here is a structured overview of what you asked about **"${message || topic}"**.\n\n1. **Core Concept**: It forms the basis of modern engineering design patterns.\n2. **Why it matters**: It optimizes resource utilization and limits complex spaghetti dependencies.\n3. **Analogy**: It acts like a traffic light, regulating flow and preventing gridlocks.`;
  }

  return { content: textResponse };
}

export async function POST(req: NextRequest) {
  try {
    const { action, topic, message, chatHistory } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.log(`Gemini API Key missing. Running fallback Study Tutor [${action}].`);
      await new Promise(r => setTimeout(r, 1000));
      return NextResponse.json(fallbackStudyTutor(action, topic, message));
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
      });

      if (action === "generate-flashcards") {
        const structuralModel = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `
        You are a tutor. Generate exactly 5 flashcards for active recall study on the topic: "${topic}".
        Each flashcard must have a question on the front, and a concise answer on the back.
        
        You must return a valid JSON object matching this schema:
        {
          "flashcards": [
            { "id": "string", "front": "question string", "back": "answer string" }
          ]
        }
        `;
        const result = await structuralModel.generateContent(prompt);
        const text = (await result.response).text().trim();
        return NextResponse.json(JSON.parse(text));
      }

      if (action === "generate-plan") {
        const structuralModel = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `
        You are a study planner. Automatically create a daily study schedule based on:
        - Topic: "${topic}"
        - Difficulty: "medium"
        - Timeframes: 4 days of study
        
        You must return a valid JSON object matching this schema:
        {
          "topic": "topic name",
          "schedule": [
            { "day": number, "title": "focus title", "hours": number, "tasks": ["task 1", "task 2"] }
          ]
        }
        `;
        const result = await structuralModel.generateContent(prompt);
        const text = (await result.response).text().trim();
        return NextResponse.json(JSON.parse(text));
      }

      // Default conversational / analogy / mnemonic prompts
      let systemPrompt = "You are Study & Tutor AI, a premium personal AI Tutor. Explain concepts clearly using markdown formatting, code highlights, and tables where appropriate.";
      if (action === "generate-analogy") {
        systemPrompt = "You are Study & Tutor AI. Explain the given topic using a highly vivid, clear analogy. Make it engaging and easy to understand.";
      } else if (action === "generate-mnemonic") {
        systemPrompt = "You are Study & Tutor AI. Create a creative mnemonic word or phrase (and explain what each letter stands for) to help the user memorize details about the topic.";
      }

      // Build chat input
      const contents: Content[] = [{ role: "user", parts: [{ text: systemPrompt }] }];
      if (chatHistory && chatHistory.length > 0) {
        chatHistory.forEach((h: { role: string; content: string }) => {
          contents.push({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }]
          });
        });
      }
      
      const userText = message || `Explain ${topic}`;
      contents.push({ role: "user", parts: [{ text: userText }] });

      const result = await model.generateContent({ contents });
      const text = (await result.response).text().trim();
      return NextResponse.json({ content: text });
    } catch (apiError) {
      console.error("Gemini API Study Tutor failed, running local fallback:", apiError);
      return NextResponse.json(fallbackStudyTutor(action, topic, message));
    }
  } catch (error) {
    console.error("Study tutor route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const maxDuration = 30;
