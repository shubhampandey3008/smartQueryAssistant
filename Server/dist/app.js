"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const ip_1 = __importDefault(require("ip"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const Code_1 = require("./enum/Code");
const Status_1 = require("./enum/Status");
const response_1 = require("./domain/response");
const patients_routes_1 = __importDefault(require("./routes/patients.routes"));
const db_routes_1 = __importDefault(require("./routes/db.routes"));
const md_routes_1 = __importDefault(require("./routes/md.routes"));
class App {
    constructor(port = process.env.SERVER_PORT || 3000) {
        this.port = port;
        this.APPLICATION_RUNNING = "Application is running on:";
        this.ROUTE_NOT_FOUND = "Route not found";
        this.app = (0, express_1.default)();
        this.middleWare();
        this.routes();
    }
    listen() {
        this.app.listen(this.port);
        console.info(`${this.APPLICATION_RUNNING} ${ip_1.default.address()} : ${this.port}`);
    }
    routes() {
        this.app.use("/patients", patients_routes_1.default);
        this.app.get("/", (req, res) => {
            res
                .status(Code_1.Code.OK)
                .send(new response_1.HttpResponse(Code_1.Code.OK, Status_1.Status.OK, "Welcome to our Website"));
        });
        this.app.use("/dbQuery", db_routes_1.default);
        this.app.use("/metaData", md_routes_1.default);
        this.app.all("*", (req, res) => res
            .status(404)
            .send(new response_1.HttpResponse(Code_1.Code.NOT_FOUND, Status_1.Status.NOT_FOUND, this.ROUTE_NOT_FOUND)));
    }
    middleWare() {
        this.app.use((0, cors_1.default)({ origin: "*" }));
        this.app.use(express_1.default.json());
    }
}
exports.App = App;
