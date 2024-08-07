import { Request, Response } from "express";
import { connection } from "../config/mysql.config";
import run from "../geminiPrompt/prompt";
import { FieldPacket, Pool, QueryResult } from "mysql2/promise";
import getAnswer from "../geminiPrompt/answerPrompt";


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
