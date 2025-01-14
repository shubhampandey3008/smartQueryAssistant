"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_controller_1 = require("../controller/db.controller");
const dbRouter = (0, express_1.Router)();
dbRouter.post("/", db_controller_1.postQuery);
dbRouter.post("/plot", db_controller_1.postPlotQuery);
dbRouter.post("/show", db_controller_1.showTable);
exports.default = dbRouter;
