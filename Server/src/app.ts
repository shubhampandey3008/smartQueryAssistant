import cors from "cors";
import express, { Application } from "express";
import ip from "ip";
import dotenv from "dotenv";
dotenv.config();
import { Code } from "./enum/Code";
import { Status } from "./enum/Status";
import { HttpResponse } from "./domain/response";
import patientRoutes from "./routes/patients.routes";
import dbRouter from "./routes/db.routes";

export class App {
  private readonly app: Application;
  private readonly APPLICATION_RUNNING = "Application is running on:";
  private readonly ROUTE_NOT_FOUND = "Route not found";

  constructor(
    private readonly port: string | number = process.env.SERVER_PORT || 3000
  ) {
    this.app = express();
    this.middleWare();
    this.routes();
  }

  listen(): void {
    this.app.listen(this.port);
    console.info(`${this.APPLICATION_RUNNING} ${ip.address()} : ${this.port}`);
  }

  private routes(): void {
    this.app.use("/patients", patientRoutes);
    this.app.get("/", (req, res) => {
      res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "Welcome to our Website"));
    });
    this.app.use("/dbQuery", dbRouter);
    this.app.all("*", (req, res) =>
      res
        .status(404)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            this.ROUTE_NOT_FOUND
          )
        )
    );
  }

  private middleWare(): void {
    this.app.use(cors({ origin: "*" }));
    this.app.use(express.json());
  }
}
