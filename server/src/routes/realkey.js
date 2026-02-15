import express from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { encrypt } from "../utils/encryption.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", async (req, res) => {
  const { api_key } = req.body;

  if (!api_key || typeof api_key !== "string") {
    return res.status(400).json({ error: "Invalid API key" });
  }

  try {
    const trimmedKey = api_key.trim();
    const encryptedKey = encrypt(trimmedKey);

    await pool.query(
      `INSERT INTO gemini_keys (user_id, key_encrypted)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET
         key_encrypted = EXCLUDED.key_encrypted,
         updated_at = NOW()`,
      [req.user.userId, encryptedKey]
    );

    res.json({ message: "Gemini key saved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT created_at, updated_at
       FROM gemini_keys
       WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ configured: false });
    }

    res.json({
      configured: true,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/", async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM gemini_keys WHERE user_id = $1`,
      [req.user.userId]
    );

    res.json({ message: "Gemini key removed" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
