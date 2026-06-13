'use strict';

const wordlist = require('./wordlist');
const { randomInt } = require('./generator');

const SYMBOLS = '!@#$%^&*?-_=+';

/**
 * Generate a memorable passphrase from the EFF large wordlist.
 *
 * @param {object} options
 * @param {number} options.words        number of words (default 5)
 * @param {string} options.separator    string between words (default '-')
 * @param {boolean} options.capitalize  capitalize the first letter of each word
 * @param {boolean} options.includeNumber  append a random digit to one word
 * @param {boolean} options.includeSymbol  append a random symbol to one word
 * @returns {string}
 */
function generatePassphrase(options = {}) {
  const count = clamp(options.words, 2, 24, 5);
  const separator = typeof options.separator === 'string' ? options.separator : '-';
  const capitalize = !!options.capitalize;
  const includeNumber = !!options.includeNumber;
  const includeSymbol = !!options.includeSymbol;

  const picked = [];
  for (let i = 0; i < count; i++) {
    let word = wordlist[randomInt(wordlist.length)];
    if (capitalize) word = word.charAt(0).toUpperCase() + word.slice(1);
    picked.push(word);
  }

  if (includeNumber) {
    const i = randomInt(picked.length);
    picked[i] += String(randomInt(10));
  }
  if (includeSymbol) {
    const i = randomInt(picked.length);
    picked[i] += SYMBOLS[randomInt(SYMBOLS.length)];
  }

  return picked.join(separator);
}

/** Bits of entropy contributed purely by the word selection. */
function passphraseEntropy(wordCount) {
  return Math.round(wordCount * Math.log2(wordlist.length));
}

function clamp(value, min, max, fallback) {
  const v = Number.parseInt(value, 10);
  if (Number.isNaN(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

module.exports = {
  generatePassphrase,
  passphraseEntropy,
  WORDLIST_SIZE: wordlist.length,
};
