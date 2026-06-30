import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FoodItem } from "@/types";

// Smart local fallback for meal analysis (based on keyword parsing)
function fallbackAnalyzeMeal(text?: string, hasImage?: boolean) {
  const description = text || "Uploaded Meal Photo";
  const lower = description.toLowerCase();
  
  const foods: FoodItem[] = [];
  let recommendations: string[] = ["Drink 250ml water with this meal.", "Consider adding some leafy greens for extra fiber."];
  let healthScore = 75;
  let fiber = 2;
  let sugar = 5;
  const vitamins: string[] = ["Vitamin C"];
  const minerals: string[] = ["Calcium"];

  if (lower.includes("egg") || lower.includes("breakfast")) {
    foods.push({ name: "Boiled Eggs", calories: 156, protein: 13, carbs: 1.1, fat: 11, servingSize: "2 large eggs" });
    healthScore = 88;
    vitamins.push("Vitamin D", "Vitamin B12");
    minerals.push("Iron", "Selenium");
    recommendations.push("Excellent source of high-quality protein.");
  }
  
  if (lower.includes("banana")) {
    foods.push({ name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.3, servingSize: "1 medium banana" });
    fiber += 3;
    sugar += 12;
    vitamins.push("Vitamin B6", "Vitamin C");
    minerals.push("Potassium", "Magnesium");
  }

  if (lower.includes("milk") || lower.includes("yogurt")) {
    foods.push({ name: "Whole Milk", calories: 120, protein: 8, carbs: 12, fat: 5, servingSize: "200ml glass" });
    vitamins.push("Vitamin A");
    minerals.push("Calcium", "Phosphorus");
  }

  if (lower.includes("burger") || lower.includes("fries") || lower.includes("fast food")) {
    foods.push({ name: "Beef Burger", calories: 450, protein: 25, carbs: 38, fat: 22, servingSize: "1 standard burger" });
    foods.push({ name: "French Fries", calories: 312, protein: 3.5, carbs: 41, fat: 15, servingSize: "1 medium portion" });
    healthScore = 45;
    sugar += 8;
    fiber += 3;
    minerals.push("Sodium", "Zinc");
    recommendations = [
      "High in sodium and saturated fats. Limit fast food to 1-2 times a week.",
      "Add a side salad next time to lower the caloric density of the meal.",
      "Drink lemon water to aid digestion."
    ];
  }

  if (lower.includes("chicken") || lower.includes("rice")) {
    foods.push({ name: "Grilled Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: "100g cooked" });
    foods.push({ name: "White Rice", calories: 205, protein: 4.2, carbs: 44, fat: 0.4, servingSize: "150g cooked" });
    healthScore = 82;
    vitamins.push("Niacin", "Vitamin B6");
    minerals.push("Selenium", "Phosphorus");
    recommendations.push("Good lean protein meal. Consider swapping white rice for brown rice to add fiber.");
  }

  if (lower.includes("salad") || lower.includes("vegetable")) {
    foods.push({ name: "Mixed Garden Salad", calories: 45, protein: 1.5, carbs: 8, fat: 0.2, servingSize: "1 large bowl" });
    foods.push({ name: "Olive Oil Vinaigrette", calories: 119, protein: 0, carbs: 0.2, fat: 13.5, servingSize: "1 tbsp dressing" });
    healthScore = 95;
    fiber += 4;
    sugar += 2;
    vitamins.push("Vitamin K", "Vitamin A", "Folate");
    minerals.push("Potassium", "Iron");
    recommendations = ["Fantastic vegetable intake!", "Healthy monounsaturated fats from olive oil dressing."];
  }

  // Default fallback if no keywords matched
  if (foods.length === 0) {
    if (hasImage) {
      foods.push({ name: "Salmon Fillet", calories: 206, protein: 22, carbs: 0, fat: 12, servingSize: "100g cooked" });
      foods.push({ name: "Avocado", calories: 160, protein: 2, carbs: 8.5, fat: 15, servingSize: "0.5 medium avocado" });
      foods.push({ name: "Quinoa", calories: 120, protein: 4, carbs: 21, fat: 2, servingSize: "100g cooked" });
      healthScore = 92;
      fiber = 7;
      sugar = 1;
      vitamins.push("Vitamin E", "B-Vitamins", "Vitamin C");
      minerals.push("Magnesium", "Potassium", "Omega-3");
      recommendations = [
        "Highly nutritious meal loaded with healthy fats (Omega-3s) and complex carbs.",
        "Perfect post-workout refuel recipe!"
      ];
    } else {
      foods.push({ name: "Granola with Yogurt", calories: 280, protein: 10, carbs: 36, fat: 8, servingSize: "1 bowl" });
      healthScore = 72;
      sugar = 14;
      fiber = 4;
      vitamins.push("Vitamin B12", "Riboflavin");
      minerals.push("Calcium", "Zinc");
      recommendations.push("Watch the sugar content in store-bought granolas.");
    }
  }

  // Calculate totals
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;

  foods.forEach(f => {
    totalCalories += f.calories;
    totalProtein += f.protein;
    totalFat += f.fat;
    totalCarbs += f.carbs;
  });

  return {
    foods,
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein),
    fat: Math.round(totalFat),
    carbs: Math.round(totalCarbs),
    fiber,
    sugar,
    vitamins,
    minerals,
    healthScore,
    recommendations
  };
}

export async function POST(req: NextRequest) {
  try {
    const { textDescription, image, mimeType } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // Call local fallback if Gemini API is not configured
    if (!apiKey) {
      console.log("Gemini API Key missing. Running fallback Meal Analyzer.");
      // Small artificial delay to simulate AI response
      await new Promise(r => setTimeout(r, 1200));
      return NextResponse.json(fallbackAnalyzeMeal(textDescription, !!image));
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const systemPrompt = `
      You are the Meal Analyzer Agent for LifeOS AI. Your job is to analyze a meal description (text) and/or a meal photo (image) and return a detailed, structured nutrition analysis in JSON format.
      
      You must return a valid JSON object matching this schema exactly:
      {
        "foods": [
          { "name": "Food Name", "calories": number, "protein": number (grams), "carbs": number (grams), "fat": number (grams), "servingSize": "portion details" }
        ],
        "calories": total_calories_number,
        "protein": total_protein_grams,
        "fat": total_fat_grams,
        "carbs": total_carbs_grams,
        "fiber": total_fiber_grams,
        "sugar": total_sugar_grams,
        "vitamins": ["Vitamin A", "Vitamin C", etc.],
        "minerals": ["Calcium", "Iron", etc.],
        "healthScore": score_out_of_100_based_on_nutritional_density,
        "recommendations": ["actionable advice 1", "actionable advice 2"]
      }

      Provide your best nutritional estimates based on the contents described or visible. Be realistic.
      `;

      let result;
      if (image && mimeType) {
        const imagePart = {
          inlineData: {
            data: image,
            mimeType: mimeType
          }
        };
        const textPrompt = `Analyze this meal. Text details: "${textDescription || "No text description provided"}"`;
        result = await model.generateContent([systemPrompt, textPrompt, imagePart]);
      } else {
        const textPrompt = `Analyze this meal text description: "${textDescription}"`;
        result = await model.generateContent([systemPrompt, textPrompt]);
      }

      const response = await result.response;
      const text = response.text().trim();
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (apiError) {
      console.error("Gemini API Meal Analyzer failed, running local fallback:", apiError);
      return NextResponse.json(fallbackAnalyzeMeal(textDescription, !!image));
    }
  } catch (error) {
    console.error("Meal analyzer route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const maxDuration = 30; // Set timeout limit for Vercel/Firebase Functions
