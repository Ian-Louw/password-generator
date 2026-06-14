'use strict';

const crypto = require('crypto');

// Character pools
const POOLS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/|~',
};

// Characters that are easy to confuse with one another.
const AMBIGUOUS = new Set('Il1O0o5S2Z8B|`\'"{}[]()/\\~,;:.<>'.split(''));

/**
 * Cryptographically secure unbiased random integer in [0, max).
 * Uses rejection sampling on top of crypto.randomInt for safety on all ranges.
 */
function randomInt(max) {
  if (max <= 0) throw new RangeError('max must be > 0');
  return crypto.randomInt(0, max);
}

/** Pick one random character from a string. */
function pick(str) {
  return str[randomInt(str.length)];
}

/** Cryptographically secure Fisher–Yates shuffle (in place). */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build the effective character set from the requested options.
 * Returns { pools: string[], combined: string }.
 */
function buildPools(options = {}) {
  const {
    uppercase = true,
    lowercase = true,
    digits = true,
    symbols = true,
    excludeAmbiguous = false,
    excludeChars = '',
    customSymbols = '',
  } = options;

  // A non-empty custom set overrides the default symbol pool.
  const symbolPool = customSymbols && customSymbols.length ? customSymbols : POOLS.symbols;

  const exclude = new Set(excludeChars.split(''));
  if (excludeAmbiguous) {
    for (const c of AMBIGUOUS) exclude.add(c);
  }

  const filter = (s) =>
    s
      .split('')
      .filter((c) => !exclude.has(c))
      .join('');

  const pools = [];
  if (uppercase) pools.push(filter(POOLS.uppercase));
  if (lowercase) pools.push(filter(POOLS.lowercase));
  if (digits) pools.push(filter(POOLS.digits));
  if (symbols) pools.push(filter(symbolPool));

  // Drop any pool that became empty after filtering.
  const nonEmpty = pools.filter((p) => p.length > 0);
  return { pools: nonEmpty, combined: nonEmpty.join('') };
}

/**
 * Generate a single cryptographically secure password.
 *
 * @param {object} options
 * @param {number} options.length
 * @param {boolean} options.uppercase
 * @param {boolean} options.lowercase
 * @param {boolean} options.digits
 * @param {boolean} options.symbols
 * @param {boolean} options.excludeAmbiguous   omit easily-confused characters
 * @param {string}  options.excludeChars       extra characters to never use
 * @param {boolean} options.requireEach        guarantee >=1 char from each pool
 * @returns {string}
 */
function generatePassword(options = {}) {
  const length = clampLength(options.length, 4, 4096, 16);
  const requireEach = options.requireEach !== false;

  const { pools, combined } = buildPools(options);
  if (combined.length === 0) {
    throw new Error('No characters available — select at least one character type.');
  }

  let chars = [];

  if (requireEach && pools.length <= length) {
    // Guarantee at least one character from each selected pool.
    chars = pools.map((p) => pick(p));
  }

  while (chars.length < length) {
    chars.push(pick(combined));
  }

  // If requireEach over-filled (pools > length), trim then top up is unnecessary.
  chars = chars.slice(0, length);

  return shuffle(chars).join('');
}

// Syllable building blocks for pronounceable passwords. Kept free of ambiguous
// or hard-to-say clusters so the result is easy to type and read aloud.
const CONSONANTS = 'bcdfghjkmnpqrstvwxz';
const VOWELS = 'aeiou';

/**
 * Generate an easy-to-pronounce password by alternating consonants and vowels,
 * optionally sprinkling in uppercase letters and digits.
 *
 * @param {object} options
 * @param {number} options.length     target length (default 16)
 * @param {boolean} options.uppercase capitalize some letters (default true)
 * @param {boolean} options.digits    append a short digit group (default true)
 * @returns {string}
 */
function generatePronounceable(options = {}) {
  const length = clampLength(options.length, 6, 128, 16);
  const wantUpper = options.uppercase !== false;
  const wantDigits = options.digits !== false;

  // Reserve a couple of trailing characters for digits when requested.
  const digitCount = wantDigits ? Math.min(3, Math.max(2, Math.floor(length / 8))) : 0;
  const letterCount = length - digitCount;

  let out = '';
  for (let i = 0; i < letterCount; i++) {
    let ch = i % 2 === 0 ? pick(CONSONANTS) : pick(VOWELS);
    // Occasionally uppercase a letter for class diversity.
    if (wantUpper && randomInt(4) === 0) ch = ch.toUpperCase();
    out += ch;
  }
  for (let i = 0; i < digitCount; i++) out += pick(POOLS.digits);

  return out;
}

/** Generate a numeric PIN of the given length. */
function generatePin(length = 6) {
  const n = clampLength(length, 3, 32, 6);
  let out = '';
  for (let i = 0; i < n; i++) out += pick(POOLS.digits);
  return out;
}

/** Generate `count` independent passwords. */
function generateBulk(count, options = {}) {
  const n = clampLength(count, 1, 10000, 10);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = generatePassword(options);
  return out;
}

function clampLength(value, min, max, fallback) {
  const v = Number.parseInt(value, 10);
  if (Number.isNaN(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

module.exports = {
  POOLS,
  AMBIGUOUS,
  randomInt,
  shuffle,
  buildPools,
  generatePassword,
  generatePronounceable,
  generatePin,
  generateBulk,
};
