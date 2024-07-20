import { Router } from "express";
import setMetadata, { dropTable } from "../controller/md.controller";

const mdRouter = Router();

mdRouter.post("/", setMetadata);
mdRouter.post("/drop", dropTable);

export default mdRouter;
