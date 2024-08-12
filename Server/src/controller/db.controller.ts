import { Request, Response } from "express";
import { connection } from "../config/mysql.config";
import run from "../geminiPrompt/prompt";
import { FieldPacket, Pool, QueryResult } from "mysql2/promise";
import getAnswer from "../geminiPrompt/answerPrompt";
import getPlotData from "../geminiPrompt/plotPrompt";
import { Code } from "../enum/Code";
import { HttpResponse } from "../domain/response";
import { Status } from "../enum/Status";


async function getMdata(tableName : string , pool : Pool) : Promise<string>{
  try{
    const [rows] : [QueryResult, FieldPacket[]] = await pool.query('SELECT MDATA FROM STORE_META WHERE TABLENAME = ?', [tableName]);
    const jsonObj = JSON.parse(JSON.stringify(rows));
    return jsonObj[0].MDATA;
  }
  catch(error: any)
  {
    console.error(`Error executing query : ${error.stack}`)
  }

  return ""
}

export async function postQuery(req: Request, res: Response): Promise<void> {
  const tableName: string =  req.body.tableName;
  const question: string = req.body.question;
  console.log(tableName);

  const pool = await connection();

  // Getting the metaData for the table
  const metadata: string = await getMdata(tableName , pool);

  const query: string = await run(question, tableName , metadata);
  console.log(query);
  const queryResult: any = await pool.query(query);
  console.log(`the queryResult is : ${JSON.stringify(queryResult[0])}`);

  // Getting back the answer
  const answer = await getAnswer(question , metadata , JSON.stringify(queryResult[0]))
  res.json(answer);
  console.log(answer);
}

export async function postPlotQuery(req: Request , res: Response) : Promise<Response>{

    try{
      const question = req.body.question;
      const tableName = req.body.tableName;

      // Getting the metadata for the table
       const pool =  await connection();
       const metadata: string = await getMdata(tableName , pool);


      // Finding the type of plot , over which columns and if it is possible or not
      const plotData = await getPlotData(question , metadata);

      // Getting the data from the database
      const allData = await pool.query(`SELECT * FROM \`${tableName}\``);

      // packaging the data
      const ResponseData = {
        "plotData" : JSON.parse(plotData),
        "allData" : allData[0]
      };

      return res
        .status(Code.OK)
        .json(ResponseData);
    }
    catch(error: any)
    {
      console.error(error);
      return res
        .status(Code.INTERNAL_SERVER_ERROR)
        .send(
          new HttpResponse(
            Code.INTERNAL_SERVER_ERROR,
            Status.INTERNAL_SERVER_ERROR,
            "An Error Occured"
          )
        );
    }
}


export async function showTable(req: Request , res: Response) : Promise<Response>{
  try{
    const tableName = req.body.tableName;
    const question = req.body.question;

    const pool = await connection();
    const metadata: string = await getMdata(tableName , pool);

    const query: string = await run(question, tableName , metadata);
    console.log(query);
    const queryResult: any = await pool.query(query);
    console.log(`the queryResult is : ${JSON.stringify(queryResult[0])}`);
    
    return res
        .status(Code.OK)
        .json(queryResult[0]);
  }
  catch(error: any){
    console.error(error);
    return res
      .status(Code.INTERNAL_SERVER_ERROR)
      .send(
        new HttpResponse(
          Code.INTERNAL_SERVER_ERROR,
          Status.INTERNAL_SERVER_ERROR,
          "An Error Occured"
        )
      );
  }
}
