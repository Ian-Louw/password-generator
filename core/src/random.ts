// Cryptographically secure randomness helpers built on the Web Crypto API.
// Everything runs in the browser; no value ever leaves the device.

function getCrypto(): Crypto {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (!c || typeof c.getRandomValues !== "function") {
    throw new Error("Web Crypto API is not available in this environment.");
  }
  return c;
}

/**
 * Unbiased random integer in [0, max) using rejection sampling over 32-bit
 * values — avoids the modulo bias a naive `% max` would introduce.
 */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new RangeError("max must be a positive integer");
  }
  const crypto = getCrypto();
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % max;
}

/** Pick one random character/element. */
export function pick<T>(arr: ArrayLike<T>): T {
  return arr[randomInt(arr.length)];
}

/** Cryptographic Fisher–Yates shuffle (in place). */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
