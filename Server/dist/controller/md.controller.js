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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setMetadata;
exports.dropTable = dropTable;
const mysql_config_1 = require("../config/mysql.config");
const Code_1 = require("../enum/Code");
const response_1 = require("../domain/response");
const Status_1 = require("../enum/Status");
function validateMetaData(metaData) {
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
function getMetaDataStr(metaData) {
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
    }
    catch (error) {
        throw new Error(`Failed to generate metadata string: ${error.message}`);
    }
}
function storeMetaData(pool, tableName, metaData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!tableName || !metaData) {
                throw new Error("Table name and metadata are required");
            }
            // Create metadata storage table with explicit length constraints
            yield pool.query(`
      CREATE TABLE IF NOT EXISTS STORE_META (
        SNO INT PRIMARY KEY AUTO_INCREMENT,
        TABLENAME VARCHAR(100) NOT NULL,
        MDATA VARCHAR(500) NOT NULL
      )
    `);
            // Use parameterized query to prevent SQL injection
            yield pool.query('INSERT INTO STORE_META(TABLENAME, MDATA) VALUES(?, ?)', [tableName, metaData]);
        }
        catch (error) {
            throw new Error(`Failed to store metadata: ${error.message}`);
        }
    });
}
function setMetadata(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let pool = null;
        try {
            // Validate request body
            if (!req.body.metaData) {
                return res.status(Code_1.Code.BAD_REQUEST).json(new response_1.HttpResponse(Code_1.Code.BAD_REQUEST, Status_1.Status.BAD_REQUEST, "Metadata is required"));
            }
            const metadata = req.body.metaData;
            const jsonMetaData = JSON.parse(metadata);
            // Validate required fields
            if (!jsonMetaData.tableName || !jsonMetaData.metaData || !jsonMetaData.data) {
                return res.status(Code_1.Code.BAD_REQUEST).json(new response_1.HttpResponse(Code_1.Code.BAD_REQUEST, Status_1.Status.BAD_REQUEST, "Missing required fields"));
            }
            const tableName = jsonMetaData.tableName;
            const metaData = JSON.parse(jsonMetaData.metaData);
            const objects = JSON.parse(jsonMetaData.data);
            // Generate metadata string
            const strMetaData = getMetaDataStr(metaData);
            // Establish database connection
            pool = yield (0, mysql_config_1.connection)();
            // Create table with error handling
            try {
                yield pool.query(`CREATE TABLE \`${tableName}\` ${strMetaData}`);
            }
            catch (error) {
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    return res.status(Code_1.Code.BAD_REQUEST).json(new response_1.HttpResponse(Code_1.Code.BAD_REQUEST, Status_1.Status.BAD_REQUEST, `Table ${tableName} already exists`));
                }
                throw error;
            }
            // Store metadata
            yield storeMetaData(pool, tableName, strMetaData.replace(/`/g, "'"));
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
                yield pool.query(`INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`, values);
            }
            return res.status(Code_1.Code.OK).json(new response_1.HttpResponse(Code_1.Code.OK, Status_1.Status.OK, `${tableName} Table Created Successfully`));
        }
        catch (error) {
            console.error("Error in setMetadata:", error);
            let statusCode = Code_1.Code.INTERNAL_SERVER_ERROR;
            let message = "An internal server error occurred";
            // Handle specific error cases
            if (error instanceof SyntaxError) {
                statusCode = Code_1.Code.BAD_REQUEST;
                message = "Invalid JSON format";
            }
            else if (error.message.includes("Invalid metadata")) {
                statusCode = Code_1.Code.BAD_REQUEST;
                message = error.message;
            }
            return res.status(statusCode).json(new response_1.HttpResponse(statusCode, Status_1.Status.INTERNAL_SERVER_ERROR, message));
        }
        finally {
            if (pool) {
                yield pool.end().catch(console.error);
            }
        }
    });
}
function dropTable(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let pool = null;
        try {
            // Validate request body
            const { tableName } = req.body;
            if (!tableName) {
                return res.status(Code_1.Code.BAD_REQUEST).json(new response_1.HttpResponse(Code_1.Code.BAD_REQUEST, Status_1.Status.BAD_REQUEST, "Table name is required"));
            }
            // Establish database connection
            pool = yield (0, mysql_config_1.connection)();
            // Check if table exists before dropping
            const [tables] = yield pool.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_NAME = ?', [tableName]);
            if (Array.isArray(tables) && tables.length === 0) {
                return res.status(Code_1.Code.NOT_FOUND).json(new response_1.HttpResponse(Code_1.Code.NOT_FOUND, Status_1.Status.NOT_FOUND, `Table ${tableName} does not exist`));
            }
            // Drop table
            yield pool.query('DROP TABLE IF EXISTS ??', [tableName]);
            // Also remove metadata
            yield pool.query('DELETE FROM STORE_META WHERE TABLENAME = ?', [tableName]);
            return res.status(Code_1.Code.OK).json(new response_1.HttpResponse(Code_1.Code.OK, Status_1.Status.OK, `${tableName} table dropped successfully`));
        }
        catch (error) {
            console.error("Error in dropTable:", error);
            return res.status(Code_1.Code.INTERNAL_SERVER_ERROR).json(new response_1.HttpResponse(Code_1.Code.INTERNAL_SERVER_ERROR, Status_1.Status.INTERNAL_SERVER_ERROR, `Failed to drop table: ${error.message}`));
        }
        finally {
            if (pool) {
                yield pool.end().catch(console.error);
            }
        }
    });
}
