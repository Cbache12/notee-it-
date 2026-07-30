import crypto from "crypto";

export interface StravaSession {
  athleteId: number;
  athleteName: string;
  athleteAvatar: string | null;
  accessToken: string;
  refreshToken: string;
  /** Unix seconds when accessToken expires. */
  expiresAt: number;
}

export const SESSION_COOKIE = "coach_session";

function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to your environment (see .env.example)."
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
}

/** AES-256-GCM encrypt, returned as base64url(iv):base64url(tag):base64url(ciphertext). */
export function encryptSession(session: StravaSession): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(session), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext]
    .map((buf) => buf.toString("base64url"))
    .join(".");
}

export function decryptSession(value: string): StravaSession | null {
  try {
    const key = getKey();
    const [ivB64, tagB64, ciphertextB64] = value.split(".");
    if (!ivB64 || !tagB64 || !ciphertextB64) return null;
    const iv = Buffer.from(ivB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const ciphertext = Buffer.from(ciphertextB64, "base64url");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString("utf8")) as StravaSession;
  } catch {
    return null;
  }
}
