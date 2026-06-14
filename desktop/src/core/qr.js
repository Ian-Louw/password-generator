'use strict';

const QRCode = require('qrcode');

/**
 * Render text to a QR code as a PNG data URL, suitable for an <img> tag.
 * Generated entirely offline. Returns null for empty input.
 *
 * @param {string} text
 * @param {boolean} dark  use a dark-friendly palette
 * @returns {Promise<string|null>}
 */
async function toDataURL(text, dark = false) {
  if (!text) return null;
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 220,
    color: dark
      ? { dark: '#e6e9efff', light: '#1c1f26ff' }
      : { dark: '#1f2733ff', light: '#ffffffff' },
  });
}

module.exports = { toDataURL };
