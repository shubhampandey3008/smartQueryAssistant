import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from "@google/generative-ai";

// Custom error class for query generation errors
class QueryGenerationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'QueryGenerationError';
  }
}

// Input validation function
function validateInputs(question: string, tableName: string, metadata?: string): void {
  if (!question?.trim()) {
    throw new QueryGenerationError('Question cannot be empty');
  }
  if (!tableName?.trim()) {
    throw new QueryGenerationError('Table name cannot be empty');
  }
  
  // Check for SQL injection attempts
  const sqlInjectionPatterns = /['";`=\\]/g;
  if (sqlInjectionPatterns.test(tableName) || sqlInjectionPatterns.test(question)) {
    throw new QueryGenerationError('Invalid characters detected in input');
  }

  if (metadata && typeof metadata !== 'string') {
    throw new QueryGenerationError('Invalid metadata format');
  }
}

// SQL query validation function
function validateQuery(query: string): void {
  // Check for dangerous SQL commands
  const dangerousCommands = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'UPDATE', 'INSERT'];
  if (dangerousCommands.some(cmd => query.toUpperCase().includes(cmd))) {
    throw new QueryGenerationError('Generated query contains unauthorized commands');
  }

  // Ensure it's a SELECT query
  if (!query.toUpperCase().trim().startsWith('SELECT')) {
    throw new QueryGenerationError('Only SELECT queries are allowed');
  }
}

// Model configuration
const generationConfig: GenerationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
  maxOutputTokens: 1024,
};

export default async function run(
  question: string,
  table_name: string,
  metadata?: string
): Promise<string> {
  let model: GenerativeModel;
  const defaultQuery = `select * from \`${table_name}\`;`;

  try {
    // Validate API key
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new QueryGenerationError('API key is not configured');
    }

    // Input validation
    validateInputs(question, table_name, metadata);

    // Initialize model with error handling
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig
      });
    } catch (error: any) {
      throw new QueryGenerationError(
        'Failed to initialize AI model',
        error instanceof Error ? error : new Error(error)
      );
    }

    // Sanitize inputs
    const sanitizedQuestion = question.replace(/[^\w\s?.,-]/g, '');
    const sanitizedTableName = table_name.replace(/[^\w]/g, '');
    const sanitizedMetadata = metadata?.replace(/[^\w\s{}",:.-]/g, '') || '';

    const queryPrompt = `
      - System : You are an MySQL Query Writer application and you create SQL Queries according to the Question asked by the user.
        You know about the table from the given Schema of the table. You are also given a random Example for reference.
          
      <Example>
      User : get me all the records from ${sanitizedTableName}
      Assistant : select * from \`${sanitizedTableName}\`;
      </Example>
      
      - Note : If no SQL Query can be created from 'Question', then return the Query : "${defaultQuery}"
          
      - Schema : ${sanitizedMetadata} || Tablename : ${sanitizedTableName}

      REMEMBER : Complete the following without enclosing the Query inside backticks

      User : ${sanitizedQuestion}

      Assistant :
    `;

    // Set timeout for API call
    const timeout = 30000; // 30 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new QueryGenerationError('Request timed out')), timeout);
    });

    // Make API call with timeout
    const responsePromise = model.generateContent(queryPrompt);
    const result = await Promise.race([responsePromise, timeoutPromise]);

    if (!result) {
      console.warn('Empty response from API, using default query');
      return defaultQuery;
    }

    const response = await result.response;
    const generatedQuery = response.text().trim();

    if (!generatedQuery) {
      console.warn('Empty generated query, using default query');
      return defaultQuery;
    }

    // Validate the generated query
    try {
      validateQuery(generatedQuery);
    } catch (error) {
      console.warn('Invalid query generated, using default query:', error);
      return defaultQuery;
    }

    // Log successful query generation
    console.log('Successfully generated query:', {
      question: sanitizedQuestion,
      query: generatedQuery,
      timestamp: new Date().toISOString()
    });

    return generatedQuery;

  } catch (error: any) {
    // Log error details
    console.error('Error in query generation:', {
      error: error.message,
      cause: error.cause?.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (error instanceof QueryGenerationError) {
      console.warn('Query generation error, using default query:', error.message);
      return defaultQuery;
    }

    if (error.name === 'AbortError') {
      console.warn('Request timeout, using default query');
      return defaultQuery;
    }

    if (error.message.includes('quota')) {
      console.warn('API quota exceeded, using default query');
      return defaultQuery;
    }

    // For any other errors, return default query
    console.warn('Unexpected error, using default query:', error);
    return defaultQuery;
  }
}

// Example usage with error handling:
/*
try {
  const query = await run("show all users", "users_table", "user_metadata");
  // Use the generated query
} catch (error) {
  if (error instanceof QueryGenerationError) {
    console.error('Query Generation Error:', error.message);
    // Handle the error appropriately
  } else {
    console.error('Unexpected error:', error);
  }
}
*/