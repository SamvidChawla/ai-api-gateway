import express from "express";
import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { GoogleGenAI } from "@google/genai";
import { decrypt } from "../utils/encryption.js";

const router = express.Router();

router.post("/generate", async (req, res) => {
  const client = await pool.connect();

  try {
    // auth
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing API key" });
    }

    if (!req.body.prompt || typeof req.body.prompt !== "string") {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    const rawKey = authHeader.split(" ")[1];

    // key lookup
    const keysResult = await client.query(
      `SELECT * FROM api_keys WHERE revoked = false`
    );

    let matchedKey = null;

    for (const key of keysResult.rows) {
      const match = await bcrypt.compare(rawKey, key.key_hash);
      if (match) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    // reset check
    const now = new Date();

    if (matchedKey.reset_at && now > matchedKey.reset_at) {
      const newReset = new Date();
      newReset.setHours(newReset.getHours() + 24);

      await client.query(
        `UPDATE api_keys
         SET tokens_used = 0,
             usage_count = 0,
             reset_at = $1
         WHERE id = $2`,
        [newReset, matchedKey.id]
      );

      matchedKey.tokens_used = 0;
      matchedKey.usage_count = 0;
      matchedKey.reset_at = newReset;
    }

    // gemini key
    const geminiKeyResult = await client.query(
      `SELECT key_encrypted FROM gemini_keys WHERE user_id = $1`,
      [matchedKey.user_id]
    );

    if (geminiKeyResult.rows.length === 0) {
      return res.status(400).json({ error: "Gemini key not set" });
    }

    const decryptedKey = decrypt(geminiKeyResult.rows[0].key_encrypted);
    const ai = new GoogleGenAI({ apiKey: decryptedKey });

    // pre-count
    const countResponse = await ai.models.countTokens({
      model: "gemini-3-flash-preview",
      contents: req.body.prompt
    });

    const estimatedTokens = countResponse.totalTokens || 0;

    if (
      matchedKey.token_limit > 0 &&
      matchedKey.tokens_used + estimatedTokens > matchedKey.token_limit
    ) {
      return res.status(403).json({
        error: "Token limit exceeded",
        reset_at: matchedKey.reset_at,
        estimatedTokens
      });
    }

    // generate
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: req.body.prompt
    });

    const tokensUsed = response.usageMetadata?.totalTokenCount || estimatedTokens;

    // update usage
    const updateResult = await client.query(
      `UPDATE api_keys
       SET tokens_used = tokens_used + $1,
           usage_count = usage_count + 1
       WHERE id = $2
       RETURNING tokens_used, token_limit, reset_at`,
      [tokensUsed, matchedKey.id]
    );

    const updated = updateResult.rows[0];

    //last overflow
    if (
      updated.token_limit > 0 &&
      updated.tokens_used > updated.token_limit
    ) {
      await client.query(
        `INSERT INTO api_key_logs (api_key_id, event_type)
        VALUES ($1, 'request_success')`,
        [matchedKey.id]
      );
      return res.status(403).json({
        error: "Token limit exceeded , allowing last overflow",
        reset_at: updated.reset_at,
        tokensUsed,
        response
      });
    }

    // logging
    await client.query(
      `INSERT INTO api_key_logs (api_key_id, event_type)
       VALUES ($1, 'request_success')`,
      [matchedKey.id]
    );

    // response
    res.json({
      result: response,
      tokens_used: tokensUsed,
      total_used: updateResult.rows[0].tokens_used,
      reset_at: updateResult.rows[0].reset_at
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
