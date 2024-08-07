import { Request, Response } from "express";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/md.query";
import { Code } from "../enum/Code";
import { HttpResponse } from "../domain/response";
import { Status } from "../enum/Status";
import { Pool } from "mysql2/promise";



function getMetaDataStr(
  strMetaData: string,
  metaData: { [key: string]: string },
  PrimaryKey: string
) {
  // Creating metadata to create table
  for (let key in metaData) {
    console.log(`The value of Primary key : ${PrimaryKey} , key : ${key}`);
    if (PrimaryKey == key)
      strMetaData = `${strMetaData} \`${key}\` ${metaData[key]} PRIMARY KEY ,`;
    else strMetaData = `${strMetaData} \`${key}\` ${metaData[key]} ,`;

    console.log(strMetaData);
  }

  strMetaData = `(${strMetaData.slice(0, -2)})`;

  return strMetaData;
}

// Storing the metadata
async function storeMetaData (pool : Pool , tableName : string , metaData : String) : Promise<void>
{
  // Creating table if not exists
  await pool.query(`CREATE TABLE IF NOT EXISTS STORE_META ( SNO INT PRIMARY KEY AUTO_INCREMENT , TABLENAME VARCHAR(100) , MDATA VARCHAR(100))`);

  await pool.query(`INSERT INTO STORE_META(TABLENAME , MDATA) VALUES("${tableName}" , "${metaData}")`);
}

export default async function setMetadata(
  req: Request,
  res: Response
): Promise<Response> {
  const metadata = req.body.metaData;
  // console.log(metadata);

  //   Parsing the coming JSON
  const jsonMetaData = JSON.parse(metadata);

  const tableName: string = jsonMetaData["tableName"];
  console.log(`The name of table is : ${tableName}`);
  const metaData: { [key: string]: string } = JSON.parse(
    jsonMetaData["metaData"]
  );

  const PrimaryKey = jsonMetaData["Primary Key"];

  const strMetaData: string = getMetaDataStr("", metaData, PrimaryKey);
  console.log(strMetaData);
  try {
    const pool = await connection();
    const createTable = await pool.query(
      `CREATE TABLE \`${tableName}\` ${strMetaData}`
    );

    // Storing the metaData
    await storeMetaData(pool , tableName , strMetaData.replace(/`/g , "'"))

    // Inserting Values to the created Table
    const objects: Array<{ [key: string]: string }> = JSON.parse(
      jsonMetaData["data"]
    );

    // for (const data of objects) {
    //   console.log(data);
    //   const columns = Object.keys(data)
    //     .map((value) => `\`${value}\``)
    //     .join(", ");
    //   const values = Object.values(data): Array<{ [key: string]: string }> = JSON.parse(
    //     jsonMetaData["data"]
    //   );
  
      for (const data of objects) {
        console.log(data);
        const columns = Object.keys(data)
          .map((value) => `\`${value}\``)
          .join(", ");
        const values = Object.values(data)
          .map((value) => `'${value}'`)
          .join(", ");
  
        await pool.query(
          `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values})`
        );
      }
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, `${tableName} Table Created`));
    }
    catch (error: any) {
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

// To Drop the Table
export async function dropTable(
  req: Request,
  res: Response
): Promise<Response> {
  const tableName = req.body.tableName;

  try {
    const pool = await connection();
    const deleteTable = await pool.query(`DROP TABLE \`${tableName}\``);

    return res
      .status(Code.OK)
      .send(new HttpResponse(Code.OK, Status.OK, `${tableName} table dropped`));
  } catch (error: any) {
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
