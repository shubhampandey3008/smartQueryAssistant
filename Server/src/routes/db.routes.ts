import { Router } from "express";
import { postPlotQuery, postQuery, showTable } from "../controller/db.controller";

const dbRouter = Router();

dbRouter.post("/", postQuery);
dbRouter.post("/plot" , postPlotQuery);
dbRouter.post("/show" , showTable);

export default dbRouter;
