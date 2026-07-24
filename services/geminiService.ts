import { GoogleGenAI } from "@google/genai";
import { Cycle, Option, SubjectActionType } from "../types";
import { cacheService } from "./cacheService";

// Performance monitoring helper
const emitPerformanceEvent = (type: string, data?: { duration?: number; error?: string }) => {
  if (process.env.NODE_ENV === 'development') {
    window.dispatchEvent(new CustomEvent('performance', {
      detail: { type, data }
    }));
  }
};

// Helper function to check if response contains valid content (not errors)
export const isValidContent = (response: string): boolean => {
  if (!response || response.length < 20) return false;
  
  const errorIndicators = [
    'ERROR',
    'error',
    'Error', 
    'failed',
    'Failed',
    'API Key',
    'rate limit',
    'Rate Limit',
    'An error occurred',
    'Could not generate',
    'Unable to generate',
    'Please try again',
    'API key is missing',
    'Configuration error'
  ];
  
  return !errorIndicators.some(indicator => response.includes(indicator));
};

// Define the expected response structures
interface FlashcardResponse {
  flashcards: Array<{
    front: string;
    back: string;
    explanation: string;
  }>;
}

interface QuizResponse {
  quiz: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

// Ensure the API key is available
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
const modelId = 'gemini-2.5-flash';

export const generateStudyContent = async (
  subject: string,
  actionType: SubjectActionType,
  userInput: string,
  cycle: Cycle,
  option: Option,
  contextData?: string,
  imageData?: { data: string; mimeType: string } | null
): Promise<string> => {
  if (!apiKey) {
    return "Error: API Key is missing. Please check your environment configuration.";
  }

  // Check cache first
  const cacheKey = cacheService.generateKey('study', subject, actionType, userInput.substring(0, 100), cycle, option);
  const cachedResult = cacheService.get<string>(cacheKey);
  if (cachedResult && !imageData) {
    console.log('Cache hit for:', cacheKey);
    emitPerformanceEvent('cache_hit');
    return cachedResult;
  }
  
  emitPerformanceEvent('cache_miss');

  let systemInstruction = `You are a strict, academic, and encouraging tutor for a student in Cameroon studying for ${cycle} (${option}). 
  Your goal is to help them understand ${subject}.
  
  CRITICAL SCOPE INSTRUCTIONS:
  1. **Level Appropriate**: All explanations, examples, and exercises MUST be strictly within the syllabus of the Cameroon GCE ${cycle}. Do NOT provide university-level, advanced placement, or out-of-scope information unless the user specifically asks for "advanced" context. If a topic is complex, simplify it to fit the ${cycle} level.
  2. **Exam Focused**: Focus on keywords, definitions, and methods awarded marks in GCE exams.
  3. **Directness**: Avoid chatting. Provide direct educational content.
  4. **Formatting**: 
     - Format your response in clean Markdown.
     - Use headings, bullet points, and bold text for key terms.
     - IMPORTANT: Use LaTeX for all mathematical equations. Enclose inline math in single dollar signs ($...$) and block math in double dollar signs ($$...$$).`;

  let prompt = "";

  switch (actionType) {
    case SubjectActionType.SUMMARY:
      prompt = `Provide a concise summary of the topic: "${userInput}". Focus on key definitions and core concepts required for the ${cycle} exam.`;
      break;
    case SubjectActionType.REVISE:
      if (contextData) {
        prompt = `Context: The user has provided the following notes from their class:
        """
        ${contextData.substring(0, 20000)}
        """
        
        Task: Based PRIMARILY on the provided notes (to ensure consistency with what the student has been taught) but checking for accuracy against the ${cycle} syllabus, explain the concept: "${userInput}".
        
        If the notes cover the topic, use the definitions and methods from the notes. If the notes are incomplete regarding this topic, supplement with standard ${cycle} knowledge.
        
        Include a "Key Takeaways" section and a "Common Exam Pitfalls" section.`;
      } else {
        prompt = `I need to revise "${userInput}". Explain this concept step-by-step strictly at the ${cycle} level. Include a "Key Takeaways" section and a "Common Exam Pitfalls" section.`;
      }
      break;
    case SubjectActionType.HINTS:
      if (contextData) {
        prompt = `Context: The user has provided the following notes from their class:
        """
        ${contextData.substring(0, 20000)}
        """
        
        Task: Based PRIMARILY on the provided notes (to ensure consistency with what the student has been taught), I am stuck on this problem: "${userInput}". Give me 3 progressive hints to help me solve it myself using the methods and approaches from the notes. Do not give the final answer immediately.
        
        If the notes don't cover this specific problem, supplement with standard ${cycle} level methods.`;
      } else {
        prompt = `I am stuck on this problem: "${userInput}". Give me 3 progressive hints to help me solve it myself. Do not give the final answer immediately. Ensure the method used is appropriate for ${cycle}.`;
      }
      break;
    case SubjectActionType.FLASHCARDS:
      return await generateFlashcards(userInput, contextData, cycle, option);
    case SubjectActionType.QUIZ:
      return await generateQuiz(userInput, contextData, cycle, option);
    default:
      prompt = userInput || (imageData ? "Analyze this image and explain what is in it." : "");
  }

  // For non-flashcard actions, use the standard generation
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];

    if (imageData) {
      contents[0].parts.push({
        inlineData: {
          data: imageData.data,
          mimeType: imageData.mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    emitPerformanceEvent('api_response', { duration });
    emitPerformanceEvent('api_success');

    const result = response.text || "I couldn't generate a response. Please try again.";
    
    if (!isValidContent(result)) {
      return "ERROR_GENERATION_FAILED";
    }

    // Cache the result (only if no image data and content is valid)
    if (!imageData && isValidContent(result)) {
      cacheService.set(cacheKey, result);
    }
    
    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    emitPerformanceEvent('api_response', { duration });
    emitPerformanceEvent('api_error', { error: error?.message });
    
    console.error("Gemini API Error:", error);

    if (error.name === 'AbortError') {
      return "ERROR_TIMEOUT";
    }

    // Check for rate limit (429) or server overload (503)
    const errorString = error?.toString() || "";
    if (errorString.includes("429") || error?.status === 429 || errorString.toLowerCase().includes("rate limit")) {
      return "ERROR_RATE_LIMIT";
    }

    return "An error occurred while connecting to the study assistant. Please try again later.";
  }
};

// Dedicated quiz generation function with JSON mode
const generateQuiz = async (
  userInput: string,
  contextData: string | undefined,
  cycle: Cycle,
  option: Option
): Promise<string> => {
  if (!apiKey) {
    return JSON.stringify({
      quiz: [{
        question: "Error: API Key is missing",
        options: ["Check configuration", "Try again", "Contact support", "Skip"],
        correctAnswer: "Check configuration",
        explanation: "Please check your environment configuration."
      }]
    });
  }

  const quizSystemInstruction = `You are a strict academic tutor for Cameroon GCE ${cycle} ${option} students.
  
  CRITICAL INSTRUCTIONS:
  1. Return ONLY a valid JSON object. No markdown formatting, no backticks, no conversational text.
  2. The JSON must have this exact structure: {"quiz": [{"question": "question", "options": ["A", "B", "C", "D"], "correctAnswer": "exact option", "explanation": "why correct"}]}
  3. Generate 10 multiple choice questions for: "${userInput}"
  ${contextData ? `4. Use this context: "${contextData.substring(0, 8000)}"` : ''}
  5. Content must be ${cycle} level appropriate
  6. Use LaTeX for mathematical expressions
  7. Options should be plausible but clearly distinguishable
  8. correctAnswer must match the exact option text`;

  const quizPrompt = `Generate a 10-question multiple choice quiz for "${userInput}". Return ONLY JSON with format {"quiz": [{"question": "question", "options": ["A", "B", "C", "D"], "correctAnswer": "exact option", "explanation": "why correct"}]}. No other text.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for structured data

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: quizPrompt }] }],
      config: {
        systemInstruction: quizSystemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            quiz: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  options: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 4,
                    maxItems: 4
                  },
                  correctAnswer: { type: 'string' },
                  explanation: { type: 'string' }
                },
                required: ['question', 'options', 'correctAnswer', 'explanation']
              }
            }
          },
          required: ['quiz']
        }
      },
    });

    clearTimeout(timeoutId);
    const responseText = response.text;
    
    // Validate the response structure
    try {
      const parsed: QuizResponse = JSON.parse(responseText);
      
      // Ensure we have the expected structure
      if (parsed.quiz && Array.isArray(parsed.quiz) && parsed.quiz.length > 0) {
        // Validate each quiz question has all required fields
        const validQuestions = parsed.quiz.filter(q => 
          q.question && 
          q.options && 
          Array.isArray(q.options) && 
          q.options.length === 4 &&
          q.correctAnswer && 
          q.explanation &&
          q.options.includes(q.correctAnswer) &&
          isValidContent(q.question) &&
          isValidContent(q.explanation)
        );
        
        if (validQuestions.length > 0) {
          return JSON.stringify({ quiz: validQuestions });
        }
      }
      
      // If validation fails, create fallback
      return "ERROR_GENERATION_FAILED";
    } catch (parseError) {
      console.error("Failed to parse quiz response:", parseError);
      return "ERROR_GENERATION_FAILED";
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Quiz generation error:", error);
    
    if (error.name === 'AbortError') {
      return "ERROR_TIMEOUT";
    }

    // Check for rate limit
    const errorString = error?.toString() || "";
    if (errorString.includes("429") || error?.status === 429 || errorString.toLowerCase().includes("rate limit")) {
      return JSON.stringify({
        quiz: [{
          question: "Rate Limit Reached",
          options: ["Wait 1 minute", "Wait 5 minutes", "Wait 10 minutes", "Try tomorrow"],
          correctAnswer: "Wait 1 minute",
          explanation: "Please wait a moment before generating more quizzes."
        }]
      });
    }
    
    // Generic error fallback
    return "ERROR_GENERATION_FAILED";
  }
};

// Dedicated flashcard generation function with JSON mode
const generateFlashcards = async (
  userInput: string,
  contextData: string | undefined,
  cycle: Cycle,
  option: Option
): Promise<string> => {
  if (!apiKey) {
    return JSON.stringify({
      flashcards: [{
        front: "Error: API Key is missing",
        back: "Please check your environment configuration.",
        explanation: "The API key is not configured properly. Please check your environment variables and restart the application."
      }]
    });
  }

  const flashcardSystemInstruction = `You are a strict academic tutor for Cameroon GCE ${cycle} ${option} students.
  
  CRITICAL INSTRUCTIONS:
  1. Return ONLY a valid JSON object. No markdown formatting, no backticks, no conversational text.
  2. The JSON must have this exact structure: {"flashcards": [{"front": "question", "back": "answer", "explanation": "why this is correct"}]}
  3. Generate 8-12 flashcards for: "${userInput}"
  ${contextData ? `4. Use this context: "${contextData.substring(0, 8000)}"` : ''}
  5. Content must be ${cycle} level appropriate
  6. Use LaTeX for mathematical expressions
  7. Front should be questions/terms, Back should be concise answers
  8. Explanation should provide brief context or reasoning for the answer`;

  const flashcardPrompt = `Generate flashcards for "${userInput}". Return ONLY JSON with format {"flashcards": [{"front": "question", "back": "answer", "explanation": "why this is correct"}]}. No other text.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for structured data

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: flashcardPrompt }] }],
      config: {
        systemInstruction: flashcardSystemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            flashcards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  front: { type: 'string' },
                  back: { type: 'string' },
                  explanation: { type: 'string' }
                },
                required: ['front', 'back', 'explanation']
              }
            }
          },
          required: ['flashcards']
        }
      },
    });

    clearTimeout(timeoutId);
    const responseText = response.text;
    
    // Validate the response structure
    try {
      const parsed: FlashcardResponse = JSON.parse(responseText);
      
      // Ensure we have the expected structure
      if (parsed.flashcards && Array.isArray(parsed.flashcards) && parsed.flashcards.length > 0) {
        // Validate each flashcard has front, back, and explanation
        const validFlashcards = parsed.flashcards.filter(fc => 
          fc.front && fc.back && fc.explanation &&
          isValidContent(fc.front) &&
          isValidContent(fc.back)
        );
        
        if (validFlashcards.length > 0) {
          return JSON.stringify({ flashcards: validFlashcards });
        }
      }
      
      // If validation fails, create fallback
      return "ERROR_GENERATION_FAILED";
    } catch (parseError) {
      console.error("Failed to parse flashcard response:", parseError);
      return "ERROR_GENERATION_FAILED";
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Flashcard generation error:", error);
    
    if (error.name === 'AbortError') {
      return "ERROR_TIMEOUT";
    }

    // Check for rate limit
    const errorString = error?.toString() || "";
    if (errorString.includes("429") || error?.status === 429 || errorString.toLowerCase().includes("rate limit")) {
      return JSON.stringify({
        flashcards: [{
          front: "Rate Limit Reached",
          back: "Please wait a moment before generating more flashcards.",
          explanation: "You have reached the API rate limit. Please wait before generating more content."
        }]
      });
    }
    
    // Generic error fallback
    return "ERROR_GENERATION_FAILED";
  }
};
