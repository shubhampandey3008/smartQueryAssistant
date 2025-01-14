"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getAnswer;
const generative_ai_1 = require("@google/generative-ai");
// Custom error class for Gemini API related errors
class GeminiAPIError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'GeminiAPIError';
    }
}
// Input validation function
function validateInputs(question, metadata, queryAnswer) {
    if (!(question === null || question === void 0 ? void 0 : question.trim())) {
        throw new GeminiAPIError('Question cannot be empty');
    }
    if (!(metadata === null || metadata === void 0 ? void 0 : metadata.trim())) {
        throw new GeminiAPIError('Metadata cannot be empty');
    }
    if (!(queryAnswer === null || queryAnswer === void 0 ? void 0 : queryAnswer.trim())) {
        throw new GeminiAPIError('Query answer cannot be empty');
    }
}
// Configuration for the Gemini model
const generationConfig = {
    temperature: 0.7,
    topK: 40,
    topP: 0.9,
    maxOutputTokens: 1024,
};
function getAnswer(question, metadata, Query_Answer) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        let model;
        try {
            // Validate API key
            const API_KEY = process.env.API_KEY;
            if (!API_KEY) {
                throw new GeminiAPIError('API key is not configured');
            }
            // Initialize Gemini AI with error handling
            try {
                const genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY);
                model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    generationConfig
                });
            }
            catch (error) {
                throw new GeminiAPIError('Failed to initialize Gemini AI', error instanceof Error ? error : new Error(error));
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
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new GeminiAPIError('Request timed out')), timeout);
            });
            // Make API call with timeout
            const responsePromise = model.generateContent(answerPrompt);
            const answerResult = yield Promise.race([responsePromise, timeoutPromise]);
            // Handle response
            if (!answerResult) {
                throw new GeminiAPIError('Empty response from Gemini API');
            }
            const answerResponse = yield answerResult.response;
            const answerText = answerResponse.text();
            // Validate response
            if (!(answerText === null || answerText === void 0 ? void 0 : answerText.trim())) {
                throw new GeminiAPIError('Empty or invalid response text');
            }
            return answerText;
        }
        catch (error) {
            // Log error for monitoring
            console.error('Error in getAnswer:', {
                error: error.message,
                cause: (_a = error.cause) === null || _a === void 0 ? void 0 : _a.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            // Handle different types of errors
            if (error instanceof GeminiAPIError) {
                throw error; // Rethrow custom errors
            }
            else if (error.name === 'AbortError') {
                throw new GeminiAPIError('Request timed out');
            }
            else if (error.message.includes('quota')) {
                throw new GeminiAPIError('API quota exceeded');
            }
            else if (error.message.includes('network')) {
                throw new GeminiAPIError('Network error occurred');
            }
            else {
                throw new GeminiAPIError('Failed to generate answer', error instanceof Error ? error : new Error(error));
            }
        }
    });
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
