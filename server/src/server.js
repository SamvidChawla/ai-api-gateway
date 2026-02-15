import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express from "express";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import subKeys from "./routes/subkeys.js";
import gateWay from "./routes/gateway.js";
import realKey from "./routes/realkey.js";
import cors from "cors";

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/subkeys", subKeys);
app.use("/realkey",realKey);
app.use("/gateway",gateWay);

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const startServer = async () => {
  await connectDB(); 

  const port = process.env.PORT || 3000;
  app.listen(port,"0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
