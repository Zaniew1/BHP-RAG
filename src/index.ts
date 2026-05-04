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
import { multiQueryRag } from "./strategies/MultiQuery.strategy";
import { rerankingRag } from "./strategies/Reranking.strategy";
import { naiveRag } from "./strategies/NaiveRag.strategy";

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
// const promptTest = "Na podstawie czego przeprowadza sie badanie profilaktyczne?";
// (async ()=>{
//   let response = '';
// //  response =  await naiveRag.implement(promptTest); // może sie gubić
// //  response =  await rerankingRag.implement(promptTest); // najdłużej idzie
// //  response =  await multiQueryRag.implement(promptTest); // póki co najlepszy

//   console.log(response);

// })()
  

router.use("/documents", documentsRouter);
router.use("/llm", llmRouter);
router.use("/system", systemRouter);
app.use(router);

startServer(app);

export default app;
   