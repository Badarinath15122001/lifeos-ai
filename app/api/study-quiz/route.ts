import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Smart quiz mock fallback database
function fallbackGenerateQuiz(topic: string, difficulty: string, count: number) {
  const t = topic.toLowerCase();
  
  let questions = [
    {
      id: "q1",
      question: "Which of the following is NOT an operating system?",
      type: "mcq",
      options: ["Linux", "Windows", "Apache", "macOS"],
      correctAnswer: "Apache",
      explanation: "Apache is a web server software, whereas Linux, Windows, and macOS are full operating systems."
    },
    {
      id: "q2",
      question: "What is virtual memory primarily used for?",
      type: "mcq",
      options: ["Speeding up CPU execution", "Allowing programs larger than physical RAM to run", "Protecting against hardware fires", "Storing files after shutdown"],
      correctAnswer: "Allowing programs larger than physical RAM to run",
      explanation: "Virtual memory maps virtual addresses to physical disk space, allowing processes to execute even if they exceed local RAM limits."
    },
    {
      id: "q3",
      question: "True or False: A thread shares its parent process's memory space.",
      type: "tf",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Threads of the same process share code, data, and resources, unlike separate processes which have distinct address spaces."
    },
    {
      id: "q4",
      question: "A process that has finished execution but still has an entry in the process table is called a ______ process.",
      type: "fill",
      correctAnswer: "zombie",
      explanation: "A zombie process is an inactive process that has completed but still remains in the process table to report status to its parent."
    },
    {
      id: "q5",
      question: "Write a simple function in Javascript called 'isEven' that takes a number and returns true if it is even, and false otherwise.",
      type: "coding",
      correctAnswer: "function isEven(num) {\n  return num % 2 === 0;\n}",
      explanation: "Using the modulo operator (%) to check if the remainder when divided by 2 is equal to 0."
    }
  ];

  if (t.includes("react") || t.includes("frontend") || t.includes("web")) {
    questions = [
      {
        id: "qreact-1",
        question: "Which hook is used to perform side effects in functional components?",
        type: "mcq",
        options: ["useState", "useEffect", "useContext", "useReducer"],
        correctAnswer: "useEffect",
        explanation: "useEffect lets functional components manage operations like data fetching, subscriptions, and DOM updates."
      },
      {
        id: "qreact-2",
        question: "What is the correct syntax to define a React State variable?",
        type: "mcq",
        options: ["const [state, setState] = useState(init)", "const state = useState(init)", "const setState = state(init)", "let state = useState(init)"],
        correctAnswer: "const [state, setState] = useState(init)",
        explanation: "React uses array destructuring to return the state value and its dispatcher function from the useState hook."
      },
      {
        id: "qreact-3",
        question: "True or False: React state updates are executed synchronously.",
        type: "tf",
        options: ["True", "False"],
        correctAnswer: "False",
        explanation: "React batches state updates asynchronously for performance optimizations to prevent redundant re-renders."
      },
      {
        id: "qreact-4",
        question: "In React, data is passed down from parent to child components via ______.",
        type: "fill",
        correctAnswer: "props",
        explanation: "Props (short for properties) represent input parameters passed into child components."
      },
      {
        id: "qreact-5",
        question: "Write a React functional component named 'Heading' that returns an h1 tag containing 'Welcome'.",
        type: "coding",
        correctAnswer: "function Heading() {\n  return <h1>Welcome</h1>;\n}",
        explanation: "Standard React JSX syntax defining a component returning an HTML heading tag."
      }
    ];
  }

  // Adjust count if requested (slice to fit)
  const sliced = questions.slice(0, count);

  return {
    topic,
    difficulty,
    questions: sliced
  };
}

export async function POST(req: NextRequest) {
  try {
    const { topic, difficulty, questionCount, questionType } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    const count = parseInt(questionCount) || 5;

    if (!apiKey) {
      console.log(`Gemini API Key missing. Running fallback Quiz Generator.`);
      await new Promise(r => setTimeout(r, 1200));
      return NextResponse.json(fallbackGenerateQuiz(topic, difficulty, count));
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
      You are an expert academic examiner. Generate a quiz on the topic: "${topic}".
      Details:
      - Difficulty: "${difficulty}"
      - Total Questions: ${count}
      - Format types allowed: "mcq" (Multiple Choice), "tf" (True/False), "fill" (Fill in the blanks), "coding" (simple coding snippet)

      You must return a valid JSON object matching this schema exactly:
      {
        "topic": "topic name",
        "difficulty": "${difficulty}",
        "questions": [
          {
            "id": "unique_id_string",
            "question": "question text",
            "type": "mcq" | "tf" | "fill" | "coding",
            "options": ["Option A", "Option B", "Option C", "Option D"], // REQUIRED ONLY for mcq and tf (tf should be ["True", "False"])
            "correctAnswer": "exact text matching correct option or answer phrase",
            "explanation": "concise explanation of why this answer is correct"
          }
        ]
      }

      Formulate questions suitable for the specified difficulty level. Provide precise answers.
      `;

      const result = await model.generateContent(prompt);
      const text = (await result.response).text().trim();
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (apiError) {
      console.error("Gemini API Quiz generator failed, running local fallback:", apiError);
      return NextResponse.json(fallbackGenerateQuiz(topic, difficulty, count));
    }
  } catch (error) {
    console.error("Quiz generator route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const maxDuration = 30;
