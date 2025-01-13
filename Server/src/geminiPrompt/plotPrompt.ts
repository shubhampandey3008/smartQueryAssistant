import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from "@google/generative-ai";

// Custom error class for plot-related API errors
class PlotDataError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'PlotDataError';
  }
}

// Interface for plot response validation
interface PlotResponse {
  plot: number;
  columns: string[];
}

// Validate plot response format
function validatePlotResponse(response: any): PlotResponse {
  try {
    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    
    if (!parsed || typeof parsed !== 'object') {
      throw new PlotDataError('Invalid response format');
    }

    if (!Number.isInteger(parsed.plot) || parsed.plot < 1 || parsed.plot > 3) {
      throw new PlotDataError('Invalid plot type number');
    }

    if (!Array.isArray(parsed.columns) || parsed.columns.length === 0) {
      throw new PlotDataError('Invalid or empty columns array');
    }

    if (!parsed.columns.every((col: string) => typeof col === 'string' && col.trim())) {
      throw new PlotDataError('Invalid column names');
    }

    return parsed as PlotResponse;
  } catch (error) {
    if (error instanceof PlotDataError) {
      throw error;
    }
    throw new PlotDataError('Failed to parse plot response', 
      error instanceof Error ? error : new Error(String(error)));
  }
}

// Validate input parameters
function validateInputs(question: string, metadata: string): void {
  if (!question?.trim()) {
    throw new PlotDataError('Question cannot be empty');
  }
  if (!metadata?.trim()) {
    throw new PlotDataError('Metadata cannot be empty');
  }
  
  // Check if question contains plot-related keywords
  const plotKeywords = ['plot', 'graph', 'chart', 'visualize', 'display'];
  if (!plotKeywords.some(keyword => question.toLowerCase().includes(keyword))) {
    throw new PlotDataError('Question does not appear to be a plotting request');
  }
}

// Configuration for the Gemini model
const generationConfig: GenerationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
  maxOutputTokens: 1024,
};

export default async function getPlotData(
  question: string,
  metadata: string,
): Promise<string> {
  let model: GenerativeModel;

  try {
    // Validate API key
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new PlotDataError('API key is not configured');
    }

    // Initialize Gemini AI
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig
      });
    } catch (error: any) {
      throw new PlotDataError(
        'Failed to initialize Gemini AI',
        error instanceof Error ? error : new Error(error)
      );
    }

    // Validate inputs
    validateInputs(question, metadata);

    // Sanitize inputs
    const sanitizedQuestion = question.replace(/[^\w\s?.,-]/g, '');
    const sanitizedMetadata = metadata.replace(/[^\w\s{}",:.-]/g, '');

    // Construct prompt
    const answerPrompt = `
      You are given the 'Query' of the user and 'Metadata' of a table.

      1. You need to identify the number of the plotting graph being asked by the user in the Query:
        - 1 for 'Line Graph/Chart'
        - 2 for 'Bar Graph/Chart'
        - 3 for 'Scatter Graph/Chart'

      2. You need to identify and return the list of columns from the 'Metadata' which are being asked in the Query.

      3. You must return the details as an object in the following format:
      {"plot" : plotnumber,"columns" : [column1 , column2 , column3 .....]}

      <Example>
      Query : Plot Bar Graph for weights and heights of students
      Metadata : (SNo int Primary Key , Name varchar(50) , weight int , height int)
      Result : {"plot" : 2 , "columns" : ["weight","height"]}
      </Example>

      - Query : ${sanitizedQuestion}

      - Metadata : ${sanitizedMetadata}

      Result :
    `;

    // Set timeout for API call
    const timeout = 30000; // 30 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new PlotDataError('Request timed out')), timeout);
    });

    // Make API call with timeout
    const responsePromise = model.generateContent(answerPrompt);
    const answerResult = await Promise.race([responsePromise, timeoutPromise]);

    // Handle response
    if (!answerResult) {
      throw new PlotDataError('Empty response from Gemini API');
    }

    const answerResponse = await answerResult.response;
    const answerText = answerResponse.text();

    // Validate response format and content
    validatePlotResponse(answerText);

    // Log success for monitoring
    console.log('Successfully generated plot data:', {
      question: sanitizedQuestion,
      result: answerText,
      timestamp: new Date().toISOString()
    });

    return answerText;

  } catch (error: any) {
    // Log error for monitoring
    console.error('Error in getPlotData:', {
      error: error.message,
      cause: error.cause?.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Handle different types of errors
    if (error instanceof PlotDataError) {
      throw error; // Rethrow custom errors
    } else if (error.name === 'AbortError') {
      throw new PlotDataError('Request timed out');
    } else if (error.message.includes('quota')) {
      throw new PlotDataError('API quota exceeded');
    } else if (error.message.includes('network')) {
      throw new PlotDataError('Network error occurred');
    } else {
      throw new PlotDataError(
        'Failed to generate plot data',
        error instanceof Error ? error : new Error(error)
      );
    }
  }
}

// Example usage with error handling
/*
try {
  const plotData = await getPlotData(question, metadata);
  const validatedData = validatePlotResponse(plotData);
  // Use validatedData.plot and validatedData.columns
} catch (error) {
  if (error instanceof PlotDataError) {
    console.error('Plot Data Error:', error.message);
    // Handle specific plot data errors
  } else {
    console.error('Unexpected error:', error);
    // Handle other errors
  }
}
*/