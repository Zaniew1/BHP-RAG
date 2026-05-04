import cors from "cors";
import morgan from "morgan";
import express from "express";
import cookieParser from "cookie-parser";
import llmRouter from "./routes/llm.routes";
import systemRouter from "./routes/system.routes";
import documentsRouter from "./routes/documents.routes";
import { Router } from "express";
import { NODE_ENV } from "./utils/constants";
import { startServer } from "./config/server";

const app = express();
const router = Router();

app.use(express.json());
app.use(morgan(NODE_ENV));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
import { rerankingRag } from './strategies/Reranking.strategy';
rerankingRag.implement("Ustawa O Służbie Medycyny Pracy jest z którego roku?")



router.use("/documents", documentsRouter);
router.use("/llm", llmRouter);
router.use("/system", systemRouter);
app.use(router);

startServer(app);

export default app;
   