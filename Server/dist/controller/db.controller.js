"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postQuery = postQuery;
exports.postPlotQuery = postPlotQuery;
exports.showTable = showTable;
const mysql_config_1 = require("../config/mysql.config");
const prompt_1 = __importDefault(require("../geminiPrompt/prompt"));
const answerPrompt_1 = __importDefault(require("../geminiPrompt/answerPrompt"));
const plotPrompt_1 = __importDefault(require("../geminiPrompt/plotPrompt"));
const Code_1 = require("../enum/Code");
const response_1 = require("../domain/response");
const Status_1 = require("../enum/Status");
function getMdata(tableName, pool) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!tableName) {
            throw new Error("Table name is required");
        }
        try {
            const [rows] = yield pool.query('SELECT MDATA FROM STORE_META WHERE TABLENAME = ?', [tableName]);
            const jsonObj = JSON.parse(JSON.stringify(rows));
            if (!jsonObj || !jsonObj[0] || !jsonObj[0].MDATA) {
                throw new Error(`No metadata found for table: ${tableName}`);
            }
            return jsonObj[0].MDATA;
        }
        catch (error) {
            console.error(`Error fetching metadata: ${error.message}`);
            throw new Error(`Failed to fetch metadata: ${error.message}`);
        }
    });
}
function postQuery(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let pool = null;
        try {
            // Input validation
            const { tableName, question } = req.body;
            if (!tableName || !question) {
                return res.status(Code_1.Code.BAD_REQUEST).json(new response_1.HttpResponse(Code_1.Code.BAD_REQUEST, Status_1.Status.BAD_REQUEST, "Table name and question are required"));
            }
            // Database connection
            pool = yield (0, mysql_config_1.connection)();
            // Getting the metaData for the table
            const metadata = yield getMdata(tableName, pool);
            // Generate and execute query
            const query = yield (0, prompt_1.default)(question, tableName, metadata);
            if (!query) {
                throw new Error("Failed to generate query");
            }
            const [queryResult] = yield pool.query(query);
            // Generate answer
            const answer = yield (0, answerPrompt_1.default)(question, metadata, JSON.stringify(queryResult));
            if (!answer) {
                throw new Error("Failed to generate answer");
            }
            return res.status(Code_1.Code.OK).json(answer);
        }
        catch (error) {
            console.error("Error in postQuery:", error);
            return res.status(Code_1.Code.INTERNAL_SERVER_ERROR).json(new response_1.HttpResponse(Code_1.Code.INTERNAL_SERVER_ERROR, Status_1.Status.INTERNAL_SERVER_ERROR, `An error occurred: ${error.message}`));
        }
        finally {
            if (pool) {
                yield pool.end().catch(console.error);
            }
        }
    });
}
function postPlotQuery(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let pool = null;
        try {
            // Input validation
            const { question, tableName } = req.body;
            if (!question || !tableName) {
                return res.status(Code_1.Code.BAD_REQUEST).json(new response_1.HttpResponse(Code_1.Code.BAD_REQUEST, Status_1.Status.BAD_REQUEST, "Question and table name are required"));
            }
            // Database connection
            pool = yield (0, mysql_config_1.connection)();
            // Getting the metadata
            const metadata = yield getMdata(tableName, pool);
            // Get plot data
            const plotData = yield (0, plotPrompt_1.default)(question, metadata);
            if (!plotData) {
                throw new Error("Failed to generate plot data");
            }
            // Get table data
            const [allData] = yield pool.query(`SELECT * FROM \`${tableName}\``);
            // Package response
            const ResponseData = {
                plotData: JSON.parse(plotData),
                allData: allData
            };
            return res.status(Code_1.Code.OK).json(ResponseData);
        }
        catch (error) {
            console.error("Error in postPlotQuery:", error);
            return res.status(Code_1.Code.INTERNAL_SERVER_ERROR).json(new response_1.HttpResponse(Code_1.Code.INTERNAL_SERVER_ERROR, Status_1.Status.INTERNAL_SERVER_ERROR, `An error occurred: ${error.message}`));
        }
        finally {
            if (pool) {
                yield pool.end().catch(console.error);
            }
        }
    });
}
function showTable(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let pool = null;
        try {
            // Input validation
            const { tableName, question } = req.body;
            if (!tableName || !question) {
                return res.status(Code_1.Code.BAD_REQUEST).json(new response_1.HttpResponse(Code_1.Code.BAD_REQUEST, Status_1.Status.BAD_REQUEST, "Table name and question are required"));
            }
            // Database connection
            pool = yield (0, mysql_config_1.connection)();
            // Get metadata
            const metadata = yield getMdata(tableName, pool);
            // Generate and execute query
            const query = yield (0, prompt_1.default)(question, tableName, metadata);
            if (!query) {
                throw new Error("Failed to generate query");
            }
            const [queryResult] = yield pool.query(query);
            return res.status(Code_1.Code.OK).json(queryResult);
        }
        catch (error) {
            console.error("Error in showTable:", error);
            return res.status(Code_1.Code.INTERNAL_SERVER_ERROR).json(new response_1.HttpResponse(Code_1.Code.INTERNAL_SERVER_ERROR, Status_1.Status.INTERNAL_SERVER_ERROR, `An error occurred: ${error.message}`));
        }
        finally {
            if (pool) {
                yield pool.end().catch(console.error);
            }
        }
    });
}
