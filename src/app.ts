import express from "express";
import testRoutes from "./routes/index.ts"
import dotenv from "dotenv";
dotenv.config()

import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));
app.use("/api/parse", testRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
})
