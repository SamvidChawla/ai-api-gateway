import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  // 1. basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  try {
    // 2. hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. insert user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email, passwordHash]
    );

    console.log(result)
    // 4. success
    res.status(201).json({
      user: result.rows[0],
    });
  } catch (err) {
    // 5. duplicate email
    if (err.code === "23505") {
      return res.status(409).json({ error: "email already exists" });
    }

    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, password_hash
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const token = jwt.sign(
    {
        userId: user.id,
        email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
    );

    // success
    res.status(200).json({
        token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
});

import { requireAuth } from "../middleware/requireAuth.js";

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;
