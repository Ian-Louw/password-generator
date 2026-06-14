"use strict";

// Tests run against the compiled output so they exercise exactly what consumers
// import. Run `npm run build` first (the `test` script does this for you).
const test = require("node:test");
const assert = require("node:assert");

const core = require("../dist/index.js");

test("password has the requested length", () => {
  for (const len of [4, 8, 16, 64, 128]) {
    assert.strictEqual(core.generatePassword({ length: len }).length, len);
  }
});

test("password respects selected character classes", () => {
  const pw = core.generatePassword({
    length: 40, uppercase: false, lowercase: true, digits: false, symbols: false,
  });
  assert.match(pw, /^[a-z]+$/);
});

test("requireEach guarantees one of every selected pool", () => {
  for (let i = 0; i < 200; i++) {
    const pw = core.generatePassword({
      length: 4, uppercase: true, lowercase: true, digits: true, symbols: true, requireEach: true,
    });
    assert.match(pw, /[A-Z]/);
    assert.match(pw, /[a-z]/);
    assert.match(pw, /[0-9]/);
    assert.match(pw, /[^A-Za-z0-9]/);
  }
});

test("excludeAmbiguous removes confusable characters", () => {
  const pw = core.generatePassword({ length: 200, excludeAmbiguous: true });
  assert.doesNotMatch(pw, /[Il1O0o]/);
});

test("customSymbols replaces the default symbol pool", () => {
  const pw = core.generatePassword({
    length: 100, uppercase: false, lowercase: false, digits: false, symbols: true, customSymbols: "#@",
  });
  assert.match(pw, /^[#@]+$/);
});

test("pronounceable password has correct length and digits", () => {
  const pw = core.generatePronounceable({ length: 16, uppercase: true, digits: true });
  assert.strictEqual(pw.length, 16);
  assert.match(pw, /[0-9]/);
});

test("throws when no character types are selected", () => {
  assert.throws(() =>
    core.generatePassword({ uppercase: false, lowercase: false, digits: false, symbols: false }),
  );
});

test("PIN is all digits and correct length", () => {
  assert.match(core.generatePin(8), /^\d{8}$/);
});

test("bulk produces the requested count of unique strings", () => {
  const list = core.generateBulk(50, { length: 24 });
  assert.strictEqual(list.length, 50);
  assert.strictEqual(new Set(list).size, 50);
});

test("passphrase word count and entropy", () => {
  const phrase = core.generatePassphrase({ words: 5, separator: "-", capitalize: false, includeNumber: false, includeSymbol: false });
  assert.strictEqual(phrase.split("-").length, 5);
  assert.strictEqual(core.WORDLIST.length, 7776);
  assert.ok(core.passphraseEntropy(6) > core.passphraseEntropy(4));
});

test("strength: common weak, long random strong", () => {
  assert.ok(core.evaluateStrength("password").entropy <= 8);
  const strong = core.evaluateStrength(core.generatePassword({ length: 32 }));
  assert.ok(strong.entropy >= 100);
  assert.ok(["Strong", "Very Strong"].includes(strong.label));
});

test("randomInt is within range and unbiased-ish", () => {
  for (let i = 0; i < 1000; i++) {
    const n = core.randomInt(7);
    assert.ok(n >= 0 && n < 7 && Number.isInteger(n));
  }
});
