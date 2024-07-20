import { Request, Response } from "express";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/md.query";
import { Code } from "../enum/Code";
import { HttpResponse } from "../domain/response";
import { Status } from "../enum/Status";

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
  const metaData: string = `(${jsonMetaData["metaData"]})`;
  console.log(`The metaData is : ${metaData}`);
  try {
    const pool = await connection();
    const createTable = await pool.query(QUERY.CREATE_TABLE, [
      tableName,
      metaData,
    ]);
    return res
      .status(Code.OK)
      .send(new HttpResponse(Code.OK, Status.OK, `${tableName} Table Created`));
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

export async function dropTable(
  req: Request,
  res: Response
): Promise<Response> {
  const tableName = req.body.tableName;

  try {
    const pool = await connection();
    const deleteTable = await pool.query(QUERY.DROP_TABLE, [tableName]);
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
