'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// bcrypt operates on at most 72 bytes; the last byte is reserved for a null
// terminator in many implementations, so we cap input at 71 bytes to stay
// interoperable and avoid silent truncation surprises.
const BCRYPT_MAX_BYTES = 72;

function truncateForBcrypt(password) {
  const buf = Buffer.from(password, 'utf-8');
  if (buf.length <= BCRYPT_MAX_BYTES) {
    return { value: password, truncated: false };
  }
  // Truncate on a valid UTF-8 boundary.
  let end = BCRYPT_MAX_BYTES;
  while (end > 0 && (buf[end] & 0xc0) === 0x80) end--;
  return { value: buf.slice(0, end).toString('utf-8'), truncated: true };
}

/**
 * Hash a password with bcrypt.
 * @param {string} password
 * @param {number} rounds  cost factor 4–15 (default 12)
 * @returns {{hash:string, rounds:number, truncated:boolean}}
 */
function bcryptHash(password, rounds = 12) {
  const cost = Math.max(4, Math.min(15, Number.parseInt(rounds, 10) || 12));
  const { value, truncated } = truncateForBcrypt(password);
  const salt = bcrypt.genSaltSync(cost);
  const hash = bcrypt.hashSync(value, salt);
  return { hash, rounds: cost, truncated };
}

/**
 * Verify a password against a bcrypt hash.
 * @returns {{match:boolean, error?:string}}
 */
function bcryptVerify(password, hash) {
  try {
    const { value } = truncateForBcrypt(password);
    return { match: bcrypt.compareSync(value, hash) };
  } catch (err) {
    return { match: false, error: 'Invalid bcrypt hash format.' };
  }
}

/** Hex digest for a given hash algorithm (sha256, sha512, sha1, md5). */
function digest(password, algorithm = 'sha256') {
  return crypto.createHash(algorithm).update(password, 'utf-8').digest('hex');
}

/** Produce a bundle of common digests at once for the UI. */
function allDigests(password) {
  return {
    sha256: digest(password, 'sha256'),
    sha512: digest(password, 'sha512'),
    sha1: digest(password, 'sha1'),
    md5: digest(password, 'md5'),
  };
}

module.exports = {
  bcryptHash,
  bcryptVerify,
  digest,
  allDigests,
  truncateForBcrypt,
  BCRYPT_MAX_BYTES,
};
