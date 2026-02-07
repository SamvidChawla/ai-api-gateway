import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import pool from "../config/db.js";
import { generateApiKey, hashApiKey } from "../utils/crypto.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", async (req, res) => {
  const { name, token_limit } = req.body;

  try {
    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);
    const result = await pool.query(
      `INSERT INTO api_keys (user_id, key_hash, name, token_limit)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, token_limit, usage_count, revoked, created_at`,
      [req.user.userId, keyHash, name || null, token_limit || 0]
    );

    const newKey = result.rows[0];

    //Return raw key to user (only once)
    res.status(201).json({
      ...newKey,
      subkey: rawKey
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, token_limit, usage_count, revoked, created_at, revoked_at
       FROM api_keys
       WHERE user_id = $1`,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
});

router.patch("/:id/revoke", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE api_keys
       SET revoked = true, revoked_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, name, revoked, revoked_at`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "subkey not found or already revoked" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
});

export default router;
