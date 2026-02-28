import crypto from "crypto";
import bcrypt from "bcrypt";

export function generateApiKey() {
  return "sk_live_" + crypto.randomBytes(32).toString("hex");
}

export async function hashApiKey(rawKey) {
  const saltRounds = 10;
  return await bcrypt.hash(rawKey, saltRounds);
}
