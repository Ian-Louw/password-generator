import { WORDLIST } from "./wordlist";
import { randomInt } from "./random";

const SYMBOLS = "!@#$%^&*?-_=+";

export interface PassphraseOptions {
  words?: number;
  separator?: string;
  capitalize?: boolean;
  includeNumber?: boolean;
  includeSymbol?: boolean;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const v = typeof value === "number" ? value : parseInt(String(value), 10);
  if (Number.isNaN(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

export function generatePassphrase(options: PassphraseOptions = {}): string {
  const count = clamp(options.words, 2, 24, 5);
  const separator = typeof options.separator === "string" ? options.separator : "-";
  const capitalize = !!options.capitalize;
  const includeNumber = !!options.includeNumber;
  const includeSymbol = !!options.includeSymbol;

  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    let word = WORDLIST[randomInt(WORDLIST.length)];
    if (capitalize) word = word.charAt(0).toUpperCase() + word.slice(1);
    picked.push(word);
  }

  if (includeNumber) picked[randomInt(picked.length)] += String(randomInt(10));
  if (includeSymbol) picked[randomInt(picked.length)] += SYMBOLS[randomInt(SYMBOLS.length)];

  return picked.join(separator);
}

export function passphraseEntropy(wordCount: number): number {
  return Math.round(wordCount * Math.log2(WORDLIST.length));
}

export const WORDLIST_SIZE = WORDLIST.length;
