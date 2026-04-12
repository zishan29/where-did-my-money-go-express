import express from "express";
import cors from "cors";
import router from "./routes/index";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/api/parse", router);

export default app;
