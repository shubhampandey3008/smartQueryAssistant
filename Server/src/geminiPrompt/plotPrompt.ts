import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");

export default async function getPlotData(
    question : string ,
    metadata : string ,
) : Promise<string>{

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Now using this text to form answers
      const answerPrompt = `
      
      You are given the 'Query' of the user and 'Metadata' of a table.

      1. You need to identify the number of the plotting graph being asked by the user in the Query:
        - 1 for 'Line Graph/Chart'getPlotData
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

      - Query : ${question}

      - Metadata : ${metadata}

      Result :

    `
    
    const answerResult = await model.generateContent(answerPrompt);
    const answerResponse = await answerResult.response;
    const answerText = answerResponse.text();
    console.log(answerText)
    return answerText;
    }
