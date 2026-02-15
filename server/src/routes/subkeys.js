import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import pool from "../config/db.js";
import { generateApiKey, hashApiKey } from "../utils/crypto.js";

const router = express.Router();
router.use(requireAuth);

//Create a Key
router.post("/", async (req, res) => {
  const { name, token_limit } = req.body;

  if (token_limit !== undefined) {
    if (typeof token_limit !== "number" || token_limit < 0) {
      return res.status(400).json({ error: "Invalid token_limit" });
    }
  }

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM api_keys
       WHERE user_id = $1 AND revoked = false`,
      [req.user.userId]
    );

    if (parseInt(countResult.rows[0].count) >= 10) {
      return res.status(400).json({ error: "Maximum 10 active subkeys allowed" });
    }

    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);

    const resetAt = new Date();
    resetAt.setHours(resetAt.getHours() + 24);

    const result = await pool.query(
      `INSERT INTO api_keys
       (user_id, key_hash, name, token_limit, tokens_used, usage_count, reset_at)
       VALUES ($1, $2, $3, $4, 0, 0, $5)
       RETURNING id, name, token_limit, tokens_used, usage_count, reset_at, revoked, created_at`,
      [
        req.user.userId,
        keyHash,
        name || null,
        token_limit ?? 0,
        resetAt
      ]
    );

    await pool.query(
      `INSERT INTO api_key_logs (api_key_id, event_type, performed_by)
       VALUES ($1, 'created', $2)`,
      [result.rows[0].id, req.user.userId]
    );

    res.status(201).json({
      ...result.rows[0],
      subkey: rawKey
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Get all keys
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, token_limit, tokens_used, usage_count,
              reset_at, revoked, created_at, revoked_at
       FROM api_keys
       WHERE user_id = $1`,
      [req.user.userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Revoke a Key
router.patch("/:id/revoke", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE api_keys
       SET revoked = true, revoked_at = NOW()
       WHERE id = $1 AND user_id = $2 AND revoked = false
       RETURNING id, name, revoked, revoked_at`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Subkey not found or already revoked" });
    }

    await pool.query(
      `INSERT INTO api_key_logs (api_key_id, event_type, performed_by)
       VALUES ($1, 'revoked', $2)`,
      [id, req.user.userId]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Modify a Key
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, token_limit } = req.body;

  if (token_limit !== undefined) {
    if (typeof token_limit !== "number" || token_limit < 0) {
      return res.status(400).json({ error: "Invalid token_limit" });
    }
  }

  try {
    const existing = await pool.query(
      `SELECT id, revoked FROM api_keys
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Subkey not found" });
    }

    if (existing.rows[0].revoked) {
      return res.status(400).json({ error: "Cannot modify revoked key" });
    }

    const updateResult = await pool.query(
      `UPDATE api_keys
       SET name = COALESCE($1, name),
           token_limit = COALESCE($2, token_limit)
       WHERE id = $3
       RETURNING id, name, token_limit, tokens_used, usage_count, reset_at, revoked`,
      [name ?? null, token_limit ?? null, id]
    );

    await pool.query(
      `INSERT INTO api_key_logs (api_key_id, event_type, performed_by)
       VALUES ($1, 'updated', $2)`,
      [id, req.user.userId]
    );

    res.json(updateResult.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all logs for the user’s subkeys
router.get("/logs", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        l.id,
        l.api_key_id,
        k.name AS subkey_name,
        l.event_type,
        u.email AS performed_by_email,
        l.timestamp
      FROM api_key_logs l
      JOIN api_keys k ON l.api_key_id = k.id
      LEFT JOIN users u ON l.performed_by = u.id
      WHERE k.user_id = $1
      ORDER BY l.timestamp DESC
      `,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;