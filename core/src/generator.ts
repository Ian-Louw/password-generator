import { randomInt, pick, shuffle } from "./random";

export const POOLS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/|~",
} as const;

// Characters that are easy to confuse with one another.
const AMBIGUOUS = new Set("Il1O0o5S2Z8B|`'\"{}[]()/\\~,;:.<>".split(""));

const CONSONANTS = "bcdfghjkmnpqrstvwxz";
const VOWELS = "aeiou";

export interface PasswordOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  digits?: boolean;
  symbols?: boolean;
  excludeAmbiguous?: boolean;
  excludeChars?: string;
  customSymbols?: string;
  requireEach?: boolean;
}

function clampLength(value: unknown, min: number, max: number, fallback: number): number {
  const v = typeof value === "number" ? value : parseInt(String(value), 10);
  if (Number.isNaN(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

export function buildPools(options: PasswordOptions = {}): { pools: string[]; combined: string } {
  const {
    uppercase = true,
    lowercase = true,
    digits = true,
    symbols = true,
    excludeAmbiguous = false,
    excludeChars = "",
    customSymbols = "",
  } = options;

  const symbolPool = customSymbols && customSymbols.length ? customSymbols : POOLS.symbols;

  const exclude = new Set(excludeChars.split(""));
  if (excludeAmbiguous) AMBIGUOUS.forEach((c) => exclude.add(c));

  const filter = (s: string) =>
    s
      .split("")
      .filter((c) => !exclude.has(c))
      .join("");

  const pools: string[] = [];
  if (uppercase) pools.push(filter(POOLS.uppercase));
  if (lowercase) pools.push(filter(POOLS.lowercase));
  if (digits) pools.push(filter(POOLS.digits));
  if (symbols) pools.push(filter(symbolPool));

  const nonEmpty = pools.filter((p) => p.length > 0);
  return { pools: nonEmpty, combined: nonEmpty.join("") };
}

export function generatePassword(options: PasswordOptions = {}): string {
  const length = clampLength(options.length, 4, 4096, 16);
  const requireEach = options.requireEach !== false;

  const { pools, combined } = buildPools(options);
  if (combined.length === 0) {
    throw new Error("No characters available — select at least one character type.");
  }

  let chars: string[] = [];
  if (requireEach && pools.length <= length) {
    chars = pools.map((p) => pick(p.split("")));
  }
  while (chars.length < length) chars.push(pick(combined.split("")));
  chars = chars.slice(0, length);

  return shuffle(chars).join("");
}

export interface PronounceableOptions {
  length?: number;
  uppercase?: boolean;
  digits?: boolean;
}

export function generatePronounceable(options: PronounceableOptions = {}): string {
  const length = clampLength(options.length, 6, 128, 16);
  const wantUpper = options.uppercase !== false;
  const wantDigits = options.digits !== false;

  const digitCount = wantDigits ? Math.min(3, Math.max(2, Math.floor(length / 8))) : 0;
  const letterCount = length - digitCount;

  let out = "";
  for (let i = 0; i < letterCount; i++) {
    let ch = i % 2 === 0 ? pick(CONSONANTS.split("")) : pick(VOWELS.split(""));
    if (wantUpper && randomInt(4) === 0) ch = ch.toUpperCase();
    out += ch;
  }
  for (let i = 0; i < digitCount; i++) out += pick(POOLS.digits.split(""));
  return out;
}

export function generatePin(length = 6): string {
  const n = clampLength(length, 3, 32, 6);
  let out = "";
  for (let i = 0; i < n; i++) out += pick(POOLS.digits.split(""));
  return out;
}

export function generateBulk(count: number, options: PasswordOptions = {}): string[] {
  const n = clampLength(count, 1, 10000, 10);
  const out: string[] = new Array(n);
  for (let i = 0; i < n; i++) out[i] = generatePassword(options);
  return out;
}
