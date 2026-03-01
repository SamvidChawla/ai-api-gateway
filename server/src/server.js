import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express from "express";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import subKeys from "./routes/subkeys.js";
import gateWay from "./routes/gateway.js";
import realKey from "./routes/realkey.js";
import cors from "cors";
import helmet from 'helmet';
import rateLimit from "express-rate-limit";
import morgan from "morgan";

const app = express();
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CLIENT ,
  credentials: true
}));

app.use(morgan('dev'));
app.use(helmet()); 

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, 
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: "10kb" }));

app.use("/auth", authRoutes);
app.use("/subkeys", subKeys);
app.use("/realkey",realKey);

const gatewayLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, 
  message: { error: "Gateway rate limit exceeded." },
});
app.use("/gateway", gatewayLimiter, gateWay);

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
