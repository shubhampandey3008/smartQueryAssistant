import { Request, Response } from "express";
import { connection } from "../config/mysql.config";
import run from "../geminiPrompt/prompt";
import { FieldPacket, Pool, QueryResult } from "mysql2/promise";
import getAnswer from "../geminiPrompt/answerPrompt";
import getPlotData from "../geminiPrompt/plotPrompt";
import { Code } from "../enum/Code";
import { HttpResponse } from "../domain/response";
import { Status } from "../enum/Status";

async function getMdata(tableName: string, pool: Pool): Promise<string> {
  if (!tableName) {
    throw new Error("Table name is required");
  }

  try {
    const [rows]: [QueryResult, FieldPacket[]] = await pool.query(
      'SELECT MDATA FROM STORE_META WHERE TABLENAME = ?',
      [tableName]
    );
    const jsonObj = JSON.parse(JSON.stringify(rows));
    
    if (!jsonObj || !jsonObj[0] || !jsonObj[0].MDATA) {
      throw new Error(`No metadata found for table: ${tableName}`);
    }
    
    return jsonObj[0].MDATA;
  } catch (error: any) {
    console.error(`Error fetching metadata: ${error.message}`);
    throw new Error(`Failed to fetch metadata: ${error.message}`);
  }
}

export async function postQuery(req: Request, res: Response): Promise<Response> {
  let pool: Pool | null = null;
  
  try {
    // Input validation
    const { tableName, question } = req.body;
    if (!tableName || !question) {
      return res.status(Code.BAD_REQUEST).json(
        new HttpResponse(
          Code.BAD_REQUEST,
          Status.BAD_REQUEST,
          "Table name and question are required"
        )
      );
    }

    // Database connection
    pool = await connection();
    
    // Getting the metaData for the table
    const metadata: string = await getMdata(tableName, pool);
    
    // Generate and execute query
    const query: string = await run(question, tableName, metadata);
    if (!query) {
      throw new Error("Failed to generate query");
    }
    
    const [queryResult] = await pool.query(query);
    
    // Generate answer
    const answer = await getAnswer(question, metadata, JSON.stringify(queryResult));
    if (!answer) {
      throw new Error("Failed to generate answer");
    }

    return res.status(Code.OK).json(answer);

  } catch (error: any) {
    console.error("Error in postQuery:", error);
    return res.status(Code.INTERNAL_SERVER_ERROR).json(
      new HttpResponse(
        Code.INTERNAL_SERVER_ERROR,
        Status.INTERNAL_SERVER_ERROR,
        `An error occurred: ${error.message}`
      )
    );
  } finally {
    if (pool) {
      await pool.end().catch(console.error);
    }
  }
}

export async function postPlotQuery(req: Request, res: Response): Promise<Response> {
  let pool: Pool | null = null;

  try {
    // Input validation
    const { question, tableName } = req.body;
    if (!question || !tableName) {
      return res.status(Code.BAD_REQUEST).json(
        new HttpResponse(
          Code.BAD_REQUEST,
          Status.BAD_REQUEST,
          "Question and table name are required"
        )
      );
    }

    // Database connection
    pool = await connection();
    
    // Getting the metadata
    const metadata: string = await getMdata(tableName, pool);

    // Get plot data
    const plotData = await getPlotData(question, metadata);
    if (!plotData) {
      throw new Error("Failed to generate plot data");
    }

    // Get table data
    const [allData] = await pool.query(`SELECT * FROM \`${tableName}\``);

    // Package response
    const ResponseData = {
      plotData: JSON.parse(plotData),
      allData: allData
    };

    return res.status(Code.OK).json(ResponseData);

  } catch (error: any) {
    console.error("Error in postPlotQuery:", error);
    return res.status(Code.INTERNAL_SERVER_ERROR).json(
      new HttpResponse(
        Code.INTERNAL_SERVER_ERROR,
        Status.INTERNAL_SERVER_ERROR,
        `An error occurred: ${error.message}`
      )
    );
  } finally {
    if (pool) {
      await pool.end().catch(console.error);
    }
  }
}

export async function showTable(req: Request, res: Response): Promise<Response> {
  let pool: Pool | null = null;

  try {
    // Input validation
    const { tableName, question } = req.body;
    if (!tableName || !question) {
      return res.status(Code.BAD_REQUEST).json(
        new HttpResponse(
          Code.BAD_REQUEST,
          Status.BAD_REQUEST,
          "Table name and question are required"
        )
      );
    }

    // Database connection
    pool = await connection();
    
    // Get metadata
    const metadata: string = await getMdata(tableName, pool);

    // Generate and execute query
    const query: string = await run(question, tableName, metadata);
    if (!query) {
      throw new Error("Failed to generate query");
    }

    const [queryResult] = await pool.query(query);
    
    return res.status(Code.OK).json(queryResult);

  } catch (error: any) {
    console.error("Error in showTable:", error);
    return res.status(Code.INTERNAL_SERVER_ERROR).json(
      new HttpResponse(
        Code.INTERNAL_SERVER_ERROR,
        Status.INTERNAL_SERVER_ERROR,
        `An error occurred: ${error.message}`
      )
    );
  } finally {
    if (pool) {
      await pool.end().catch(console.error);
    }
  }
}