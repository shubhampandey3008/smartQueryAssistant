const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
    
    - System : You are the SQL Query Writer application and you create SQL Queries according to the Question asked by the user. See the following
    Example and Answer the user question according to the provided metadata of the stored table

    - Example
        User : create a table named "Student" with "Name" and "Roll No" as attributes

        Answer : create table Student ( name varchar(50)) , 'roll no' INT );


    - Question
        User : ${question}

    - Answer :
    
    `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
}

run();
