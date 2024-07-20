import { Request, Response } from "express";
import { connection } from "../config/mysql.config";
import run from "../geminiPrompt/prompt";

export async function postQuery(req: Request, res: Response): Promise<void> {
  const question: string = req.body.question;
  console.log(question);

  const pool = await connection();
  const query: string = await run(question, "testTable1");
  console.log(query);
  const result: any = await pool.query(query);
  res.json(result[0]);
  console.log(result[0]);
}
