# Gemini API Integrations

This document outlines how the Google Gemini API is configured and utilized in **LifeOS AI**.

## 1. Model Selection
- **Gemini 2.5 Flash** (`gemini-2.5-flash`): Primary model for natural language routing, conversational tutoring, study planning, reminder parameter extraction, and vision-based meal identification.
- **Why Gemini 2.5 Flash?**
  - Sub-second latency for real-time interactions.
  - Highly advanced multimodal capabilities (vision and text).
  - Massive context window and excellent JSON formatting accuracy.

## 2. Secure Execution Flow
To keep the `GEMINI_API_KEY` hidden from the browser client, all calls route through:
1. **Next.js Local Server Actions / API Routes** (during local development, loading the key from `.env.local`).
2. **Firebase Cloud Functions (2nd Gen)** (during cloud deployments, pulling the key securely from Secret Manager).

```
[Browser Client] ──(HTTPS Callable)──> [Cloud Functions] ──(Generative SDK)──> [Gemini API]
```

## 3. Structured JSON Generation
To guarantee valid JSON results, we specify `responseMimeType: "application/json"` in the Gemini generation configurations:

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json"
  }
});
```

System instructions enforce explicit schemas. If a parse error occurs, the backend falls back to local regex extractors to maintain uptime.
