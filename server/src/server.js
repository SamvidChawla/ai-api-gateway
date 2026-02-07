import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express from "express";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const startServer = async () => {
  await connectDB(); 

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
