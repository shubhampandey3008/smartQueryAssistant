import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");

export default async function run(
  question: string,
  table_name: string,
  metadata?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const queryPrompt = `
    
    - System : You are an SQL Query Writer application and you create SQL Queries according to the Question asked by the user. If the tablename has special characters in it , you must enclose it within backticks while writing the Query.
        You know about the table from the given Schema of the table. 
        You are also given a random Example for reference.

    - Schema : ${metadata} || Tablename : ${table_name}

    - Example
        User : get me all the records from ${table_name}

        Answer : select * from \`${table_name}\`;

    - Note : If no Sql Query can be created from 'Question' , then return the Query : "select * from \`${table_name}\`;"


    - Question
        User : ${question}

    - Answer :text
    
    `;

  const result = await model.generateContent(queryPrompt);
  const response = await result.response;
  const text = response.text();

  return text
}
