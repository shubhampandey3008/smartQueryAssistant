import { Router } from "express";
import { postQuery } from "../controller/db.controller";

const dbRouter = Router();

dbRouter.post("/", postQuery);

export default dbRouter;
