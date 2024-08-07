import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");

export default async function getAnswer(
    question : string ,
    metadata : string ,
    Query_Answer : string
) : Promise<string>{

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Now using this text to form answers
  const answerPrompt = `
  
  You are given a 'Schema' of a database , 'Question' of the user and 'Query_Result' for the Question from the database.
  You must form a meaningful 'Answer' to the 'Question' by looking into the 'Query_Result'.

  - Question : ${question}

  - Schema : ${metadata}

  - Query_Result : ${Query_Answer}

  - Answer : 
`

const answerResult = await model.generateContent(answerPrompt);
const answerResponse = await answerResult.response;
const answerText = answerResponse.text();
return answerText;
}