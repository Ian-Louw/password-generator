'use strict';

const test = require('node:test');
const assert = require('node:assert');

const generator = require('../src/core/generator');
const passphrase = require('../src/core/passphrase');
const strength = require('../src/core/strength');
const hasher = require('../src/core/hasher');

// ── generator ──────────────────────────────────────────────────────────────

test('password has the requested length', () => {
  for (const len of [4, 8, 16, 64, 128]) {
    assert.strictEqual(generator.generatePassword({ length: len }).length, len);
  }
});

test('password respects selected character classes', () => {
  const pw = generator.generatePassword({
    length: 40, uppercase: false, lowercase: true, digits: false, symbols: false,
  });
  assert.match(pw, /^[a-z]+$/);
});

test('requireEach guarantees one of every selected pool', () => {
  for (let i = 0; i < 200; i++) {
    const pw = generator.generatePassword({
      length: 4, uppercase: true, lowercase: true, digits: true, symbols: true, requireEach: true,
    });
    assert.match(pw, /[A-Z]/);
    assert.match(pw, /[a-z]/);
    assert.match(pw, /[0-9]/);
    assert.match(pw, /[^A-Za-z0-9]/);
  }
});

test('excludeAmbiguous removes confusable characters', () => {
  const pw = generator.generatePassword({ length: 200, excludeAmbiguous: true });
  assert.doesNotMatch(pw, /[Il1O0o]/);
});

test('excludeChars are never present', () => {
  const pw = generator.generatePassword({ length: 200, excludeChars: 'abcABC' });
  assert.doesNotMatch(pw, /[abcABC]/);
});

test('throws when no character types are selected', () => {
  assert.throws(() =>
    generator.generatePassword({
      uppercase: false, lowercase: false, digits: false, symbols: false,
    })
  );
});

test('PIN is all digits and correct length', () => {
  const pin = generator.generatePin(8);
  assert.match(pin, /^\d{8}$/);
});

test('bulk produces the requested count of unique strings', () => {
  const list = generator.generateBulk(50, { length: 24 });
  assert.strictEqual(list.length, 50);
  assert.strictEqual(new Set(list).size, 50); // collisions are astronomically unlikely
});

test('generated passwords are random (no repeats across calls)', () => {
  const a = generator.generatePassword({ length: 32 });
  const b = generator.generatePassword({ length: 32 });
  assert.notStrictEqual(a, b);
});

// ── passphrase ──────────────────────────────────────────────────────────────

test('passphrase has the requested word count', () => {
  const phrase = passphrase.generatePassphrase({ words: 5, separator: '-', capitalize: false, includeNumber: false, includeSymbol: false });
  assert.strictEqual(phrase.split('-').length, 5);
});

test('passphrase entropy scales with words', () => {
  assert.ok(passphrase.passphraseEntropy(6) > passphrase.passphraseEntropy(4));
  assert.strictEqual(passphrase.WORDLIST_SIZE, 7776);
});

test('capitalize and number options apply', () => {
  const phrase = passphrase.generatePassphrase({ words: 4, separator: ' ', capitalize: true, includeNumber: true });
  assert.match(phrase, /[A-Z]/);
  assert.match(phrase, /[0-9]/);
});

// ── strength ────────────────────────────────────────────────────────────────

test('common passwords score very low', () => {
  const r = strength.evaluateStrength('password');
  assert.ok(r.entropy <= 8);
  assert.ok(['Very Weak', 'Weak'].includes(r.label));
});

test('long random passwords score high', () => {
  const pw = generator.generatePassword({ length: 32 });
  const r = strength.evaluateStrength(pw);
  assert.ok(r.entropy >= 100, `expected high entropy, got ${r.entropy}`);
  assert.ok(['Strong', 'Very Strong'].includes(r.label));
});

test('strength report includes crack times for all scenarios', () => {
  const r = strength.evaluateStrength('Tr0ub4dour&3');
  assert.ok(r.crackTimes.online_throttled);
  assert.ok(r.crackTimes.offline_fast);
});

test('empty password is handled', () => {
  const r = strength.evaluateStrength('');
  assert.strictEqual(r.entropy, 0);
  assert.strictEqual(r.label, 'Empty');
});

// ── hasher ──────────────────────────────────────────────────────────────────

test('bcrypt hash verifies against original password', () => {
  const pw = 'Sup3r$ecret!';
  const { hash } = hasher.bcryptHash(pw, 6); // low cost keeps the test fast
  assert.match(hash, /^\$2[aby]\$06\$/);
  assert.strictEqual(hasher.bcryptVerify(pw, hash).match, true);
  assert.strictEqual(hasher.bcryptVerify('wrong', hash).match, false);
});

test('bcrypt flags truncation beyond 72 bytes', () => {
  const long = 'a'.repeat(100);
  const { truncated } = hasher.bcryptHash(long, 6);
  assert.strictEqual(truncated, true);
});

test('digests are deterministic and correct length', () => {
  const d = hasher.allDigests('hello');
  assert.strictEqual(d.sha256.length, 64);
  assert.strictEqual(d.sha512.length, 128);
  assert.strictEqual(d.sha256, hasher.digest('hello', 'sha256'));
});

test('bcryptVerify reports invalid hash format gracefully', () => {
  const res = hasher.bcryptVerify('x', 'not-a-hash');
  assert.strictEqual(res.match, false);
});
