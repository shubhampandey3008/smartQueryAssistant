import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");

export default async function run(
  question: string,
  table_name: string,
  metadata?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  // You must enclose the tablename and column names within backticks while writing the Query.

  const queryPrompt = `
    
    - System : You are an SQL Query Writer application and you create SQL Queries according to the Question asked by the user.
      You know about the table from the given Schema of the table. You are also given a random Example for reference.
        
    <Example>
    User : get me all the records from ${table_name}
    Assistant : select * from \`${table_name}\`;
    </Example>
    
    - Note : If no Sql Query can be created from 'Question' , then return the Query : "select * from \`${table_name}\`;"
        
    - Schema : ${metadata} || Tablename : ${table_name}

    REMEMBER : Complete the following without enclosing the Query inside backticks

    User : ${question}

    Assistant :

    `;

  const result = await model.generateContent(queryPrompt);
  const response = await result.response;
  const text = response.text();

  return text
}
