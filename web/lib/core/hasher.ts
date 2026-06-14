import bcrypt from "bcryptjs";

// bcrypt operates on at most 72 bytes; cap input there to avoid silent surprises.
const BCRYPT_MAX_BYTES = 72;

function truncateForBcrypt(password: string): { value: string; truncated: boolean } {
  const buf = new TextEncoder().encode(password);
  if (buf.length <= BCRYPT_MAX_BYTES) return { value: password, truncated: false };
  let end = BCRYPT_MAX_BYTES;
  while (end > 0 && (buf[end] & 0xc0) === 0x80) end--;
  return { value: new TextDecoder().decode(buf.slice(0, end)), truncated: true };
}

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface BcryptResult {
  hash: string;
  rounds: number;
  truncated: boolean;
}

export async function bcryptHash(password: string, rounds = 12): Promise<BcryptResult> {
  const cost = Math.max(4, Math.min(15, Math.trunc(rounds) || 12));
  const { value, truncated } = truncateForBcrypt(password);
  const salt = await bcrypt.genSalt(cost);
  const hash = await bcrypt.hash(value, salt);
  return { hash, rounds: cost, truncated };
}

export async function bcryptVerify(
  password: string,
  hash: string,
): Promise<{ match: boolean; error?: string }> {
  try {
    const { value } = truncateForBcrypt(password);
    return { match: await bcrypt.compare(value, hash) };
  } catch {
    return { match: false, error: "Invalid bcrypt hash format." };
  }
}

async function digest(algorithm: "SHA-256" | "SHA-512" | "SHA-1", text: string): Promise<string> {
  const buf = await crypto.subtle.digest(algorithm, new TextEncoder().encode(text));
  return toHex(buf);
}

export interface DigestBundle {
  sha256: string;
  sha512: string;
  sha1: string;
}

export async function allDigests(password: string): Promise<DigestBundle> {
  const [sha256, sha512, sha1] = await Promise.all([
    digest("SHA-256", password),
    digest("SHA-512", password),
    digest("SHA-1", password),
  ]);
  return { sha256, sha512, sha1 };
}

/** PBKDF2-HMAC-SHA256, encoded Django-style: pbkdf2_sha256$<iter>$<salt>$<hash> */
export async function pbkdf2Hash(password: string, iterations = 600000): Promise<string> {
  const iter = Math.max(1000, Math.trunc(iterations) || 600000);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return `pbkdf2_sha256$${iter}$${toBase64(salt)}$${toBase64(new Uint8Array(bits))}`;
}
