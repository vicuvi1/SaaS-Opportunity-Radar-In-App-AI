import crypto from "crypto";
import fs from "fs";
import path from "path";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit authentication tag

let cachedKey: Buffer | null = null;

/**
 * Returns a 32-byte encryption key.
 * Priority:
 * 1. process.env.CREDENTIAL_ENCRYPTION_KEY
 * 2. Persisted local key file at data/.vault_key
 * 3. Auto-generated and stored in data/.vault_key
 */
function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const envKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (envKey && envKey.trim().length > 0) {
    cachedKey = crypto.createHash("sha256").update(envKey.trim()).digest();
    return cachedKey;
  }

  // Fallback to local persisted key file
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const keyPath = path.join(dataDir, ".vault_key");
    if (fs.existsSync(keyPath)) {
      const existing = fs.readFileSync(keyPath, "utf-8").trim();
      if (existing.length >= 32) {
        cachedKey = crypto.createHash("sha256").update(existing).digest();
        return cachedKey;
      }
    }

    // Generate random 32-byte secret
    const newKeyHex = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(keyPath, newKeyHex, { encoding: "utf-8", mode: 0o600 });
    cachedKey = crypto.createHash("sha256").update(newKeyHex).digest();
    return cachedKey;
  } catch (err) {
    console.error("[crypto] Failed to read/write persistent vault key, using runtime key:", err);
    cachedKey = crypto.createHash("sha256").update("saas-opportunity-radar-default-vault-seed").digest();
    return cachedKey;
  }
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: `<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a formatted ciphertext (`<iv>:<tag>:<data>`) using AES-256-GCM.
 * Returns null or throws if corrupted/tampered.
 */
export function decryptSecret(ciphertext: string): string {
  if (!ciphertext) return "";
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted secret format. Expected iv:tag:data");
  }

  const [ivHex, tagHex, dataHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(dataHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Masks a sensitive string for safe client display.
 * Never outputs the full plaintext.
 * Example: `••••••••••••abc1`
 */
export function maskSecret(secret: string | null | undefined): string {
  if (!secret) return "";
  const trimmed = secret.trim();
  if (trimmed.length <= 4) {
    return "••••••••";
  }
  const lastFour = trimmed.slice(-4);
  return `••••••••••••${lastFour}`;
}
