import { Request, Response } from "express";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/md.query";
import { Code } from "../enum/Code";
import { HttpResponse } from "../domain/response";
import { Status } from "../enum/Status";
import { Pool } from "mysql2/promise";

function validateMetaData(metaData: { [key: string]: string }): void {
  if (!metaData || Object.keys(metaData).length === 0) {
    throw new Error("Invalid metadata: Empty or undefined metadata object");
  }

  for (const [key, value] of Object.entries(metaData)) {
    if (!key || !value) {
      throw new Error(`Invalid metadata: Empty or undefined key or value found`);
    }
    // Basic SQL injection prevention
    if (key.includes(';') || value.includes(';')) {
      throw new Error('Invalid characters in metadata');
    }
  }
}

function getMetaDataStr(metaData: { [key: string]: string }): string {
  try {
    validateMetaData(metaData);
    
    let strMetaData = "SNO INT PRIMARY KEY AUTO_INCREMENT,";
    
    for (let key in metaData) {
      // Sanitize the key and value
      const sanitizedKey = key.replace(/[^\w\s()]/g, '');
      const sanitizedValue = metaData[key].replace(/[^\w\s()]/g, '');
      
      strMetaData = `${strMetaData} \`${sanitizedKey}\` ${sanitizedValue} ,`;
    }

    strMetaData = `(${strMetaData.slice(0, -2)})`;
    return strMetaData;
  } catch (error: any) {
    throw new Error(`Failed to generate metadata string: ${error.message}`);
  }
}

async function storeMetaData(pool: Pool, tableName: string, metaData: string): Promise<void> {
  try {
    if (!tableName || !metaData) {
      throw new Error("Table name and metadata are required");
    }

    // Create metadata storage table with explicit length constraints
    await pool.query(`
      CREATE TABLE IF NOT EXISTS STORE_META (
        SNO INT PRIMARY KEY AUTO_INCREMENT,
        TABLENAME VARCHAR(100) NOT NULL,
        MDATA VARCHAR(500) NOT NULL
      )
    `);

    // Use parameterized query to prevent SQL injection
    await pool.query(
      'INSERT INTO STORE_META(TABLENAME, MDATA) VALUES(?, ?)',
      [tableName, metaData]
    );
  } catch (error: any) {
    throw new Error(`Failed to store metadata: ${error.message}`);
  }
}

export default async function setMetadata(req: Request, res: Response): Promise<Response> {
  let pool: Pool | null = null;
  
  try {
    // Validate request body
    if (!req.body.metaData) {
      return res.status(Code.BAD_REQUEST).json(
        new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST, "Metadata is required")
      );
    }

    const metadata = req.body.metaData;
    const jsonMetaData = JSON.parse(metadata);

    // Validate required fields
    if (!jsonMetaData.tableName || !jsonMetaData.metaData || !jsonMetaData.data) {
      return res.status(Code.BAD_REQUEST).json(
        new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST, "Missing required fields")
      );
    }

    const tableName: string = jsonMetaData.tableName;
    const metaData: { [key: string]: string } = JSON.parse(jsonMetaData.metaData);
    const objects: Array<{ [key: string]: string }> = JSON.parse(jsonMetaData.data);

    // Generate metadata string
    const strMetaData: string = getMetaDataStr(metaData);

    // Establish database connection
    pool = await connection();

    // Create table with error handling
    try {
      await pool.query(`CREATE TABLE \`${tableName}\` ${strMetaData}`);
    } catch (error: any) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        return res.status(Code.BAD_REQUEST).json(
          new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST, `Table ${tableName} already exists`)
        );
      }
      throw error;
    }

    // Store metadata
    await storeMetaData(pool, tableName, strMetaData.replace(/`/g, "'"));

    // Insert data with validation and error handling
    for (const data of objects) {
      if (!data || Object.keys(data).length === 0) {
        throw new Error("Invalid data object found");
      }

      const columns = Object.keys(data)
        .map((value) => `\`${value}\``)
        .join(", ");
      
      // Use parameterized query for values
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      await pool.query(
        `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`,
        values
      );
    }

    return res.status(Code.OK).json(
      new HttpResponse(Code.OK, Status.OK, `${tableName} Table Created Successfully`)
    );

  } catch (error: any) {
    console.error("Error in setMetadata:", error);
    
    let statusCode = Code.INTERNAL_SERVER_ERROR;
    let message = "An internal server error occurred";

    // Handle specific error cases
    if (error instanceof SyntaxError) {
      statusCode = Code.BAD_REQUEST;
      message = "Invalid JSON format";
    } else if (error.message.includes("Invalid metadata")) {
      statusCode = Code.BAD_REQUEST;
      message = error.message;
    }

    return res.status(statusCode).json(
      new HttpResponse(statusCode, Status.INTERNAL_SERVER_ERROR, message)
    );
  } finally {
    if (pool) {
      await pool.end().catch(console.error);
    }
  }
}

export async function dropTable(req: Request, res: Response): Promise<Response> {
  let pool: Pool | null = null;

  try {
    // Validate request body
    const { tableName } = req.body;
    if (!tableName) {
      return res.status(Code.BAD_REQUEST).json(
        new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST, "Table name is required")
      );
    }

    // Establish database connection
    pool = await connection();

    // Check if table exists before dropping
    const [tables] = await pool.query(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_NAME = ?',
      [tableName]
    );
    
    if (Array.isArray(tables) && tables.length === 0) {
      return res.status(Code.NOT_FOUND).json(
        new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, `Table ${tableName} does not exist`)
      );
    }

    // Drop table
    await pool.query('DROP TABLE IF EXISTS ??', [tableName]);

    // Also remove metadata
    await pool.query('DELETE FROM STORE_META WHERE TABLENAME = ?', [tableName]);

    return res.status(Code.OK).json(
      new HttpResponse(Code.OK, Status.OK, `${tableName} table dropped successfully`)
    );

  } catch (error: any) {
    console.error("Error in dropTable:", error);
    return res.status(Code.INTERNAL_SERVER_ERROR).json(
      new HttpResponse(
        Code.INTERNAL_SERVER_ERROR,
        Status.INTERNAL_SERVER_ERROR,
        `Failed to drop table: ${error.message}`
      )
    );
  } finally {
    if (pool) {
      await pool.end().catch(console.error);
    }
  }
}