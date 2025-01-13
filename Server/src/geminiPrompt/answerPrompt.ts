import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from "@google/generative-ai";

// Custom error class for Gemini API related errors
class GeminiAPIError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

// Input validation function
function validateInputs(question: string, metadata: string, queryAnswer: string): void {
  if (!question?.trim()) {
    throw new GeminiAPIError('Question cannot be empty');
  }
  if (!metadata?.trim()) {
    throw new GeminiAPIError('Metadata cannot be empty');
  }
  if (!queryAnswer?.trim()) {
    throw new GeminiAPIError('Query answer cannot be empty');
  }
}

// Configuration for the Gemini model
const generationConfig: GenerationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
  maxOutputTokens: 1024,
};

export default async function getAnswer(
  question: string,
  metadata: string,
  Query_Answer: string
): Promise<string> {
  let model: GenerativeModel;

  try {
    // Validate API key
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new GeminiAPIError('API key is not configured');
    }

    // Initialize Gemini AI with error handling
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig
      });
    } catch (error: any) {
      throw new GeminiAPIError(
        'Failed to initialize Gemini AI',
        error instanceof Error ? error : new Error(error)
      );
    }

    // Validate inputs
    validateInputs(question, metadata, Query_Answer);

    // Sanitize inputs to prevent potential injection
    const sanitizedQuestion = question.replace(/[^\w\s?.,-]/g, '');
    const sanitizedMetadata = metadata.replace(/[^\w\s{}",:.-]/g, '');
    const sanitizedQueryAnswer = Query_Answer.replace(/[^\w\s{}",:.-]/g, '');

    // Construct prompt with error handling for string interpolation
    const answerPrompt = `
      You are given a 'Schema' of a database, 'Question' of the user and 'Query_Result' for the Question from the database.
      You must form a meaningful 'Answer' to the 'Question' by looking into the 'Query_Result'.

      - Question: ${sanitizedQuestion}

      - Schema: ${sanitizedMetadata}

      - Query_Result: ${sanitizedQueryAnswer}

      - Answer:
    `;

    // Set timeout for API call
    const timeout = 30000; // 30 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new GeminiAPIError('Request timed out')), timeout);
    });

    // Make API call with timeout
    const responsePromise = model.generateContent(answerPrompt);
    const answerResult = await Promise.race([responsePromise, timeoutPromise]);

    // Handle response
    if (!answerResult) {
      throw new GeminiAPIError('Empty response from Gemini API');
    }

    const answerResponse = await answerResult.response;
    const answerText = answerResponse.text();

    // Validate response
    if (!answerText?.trim()) {
      throw new GeminiAPIError('Empty or invalid response text');
    }

    return answerText;

  } catch (error: any) {
    // Log error for monitoring
    console.error('Error in getAnswer:', {
      error: error.message,
      cause: error.cause?.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Handle different types of errors
    if (error instanceof GeminiAPIError) {
      throw error; // Rethrow custom errors
    } else if (error.name === 'AbortError') {
      throw new GeminiAPIError('Request timed out');
    } else if (error.message.includes('quota')) {
      throw new GeminiAPIError('API quota exceeded');
    } else if (error.message.includes('network')) {
      throw new GeminiAPIError('Network error occurred');
    } else {
      throw new GeminiAPIError(
        'Failed to generate answer',
        error instanceof Error ? error : new Error(error)
      );
    }
  }
}

// Example usage with error handling
/* 
try {
  const answer = await getAnswer(question, metadata, queryAnswer);
  // Handle successful response
} catch (error) {
  if (error instanceof GeminiAPIError) {
    // Handle specific API errors
    console.error('API Error:', error.message);
    // Potentially retry or fallback
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
*/