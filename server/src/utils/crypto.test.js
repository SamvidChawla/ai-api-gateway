process.env.ENCRYPTION_SECRET = "test_secret_for_jest_do_not_use_in_prod";

const { encrypt, decrypt } = await import("./encryption.js");
const { generateApiKey, hashApiKey } = await import("./hash.js");
const bcrypt = (await import("bcrypt")).default;

describe("encryption.js", () => {
  test("round trip: encrypt then decrypt returns original text", () => {
    const original = "my-secret-gemini-key";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  test("encrypted output has iv:ciphertext format", () => {
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    expect(parts.length).toBe(2);
    expect(parts[0]).toHaveLength(32); // IV is 16 bytes = 32 hex chars
  });

  test("same input produces different ciphertext each time (random IV)", () => {
    const text = "same-input";
    const first = encrypt(text);
    const second = encrypt(text);
    expect(first).not.toBe(second);
  });
});

describe("hash.js", () => {
  test("generateApiKey starts with sk_live_", () => {
    const key = generateApiKey();
    expect(key.startsWith("sk_live_")).toBe(true);
  });

  test("generateApiKey is 72 characters long", () => {
    const key = generateApiKey();
    expect(key).toHaveLength(72); // "sk_live_" (8) + 64 hex chars
  });

  test("key prefix (first 16 chars) is correct length for DB storage", () => {
    const key = generateApiKey();
    const prefix = key.substring(0, 16);
    expect(prefix).toHaveLength(16);
  });

  test("hashApiKey produces a valid bcrypt hash", async () => {
    const raw = generateApiKey();
    const hash = await hashApiKey(raw);
    const match = await bcrypt.compare(raw, hash);
    expect(match).toBe(true);
  });
});