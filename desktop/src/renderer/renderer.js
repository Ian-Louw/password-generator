'use strict';

const api = window.ultrapass;
const $ = (id) => document.getElementById(id);

let settings = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 1800);
}

async function copy(text) {
  if (!text) return;
  const { clearSeconds } = await api.copyToClipboard(text);
  toast(clearSeconds > 0 ? `Copied · clears in ${clearSeconds}s` : 'Copied to clipboard');
}

// Set an output value while preserving its current masked/revealed state.
function setOutput(id, value) {
  $(id).textContent = value;
}

// ── Reveal / hide ──────────────────────────────────────────────────────────

function toggleMask(outputId, btn) {
  const el = $(outputId);
  const masked = el.classList.toggle('masked');
  if (btn) btn.textContent = masked ? '🙈' : '👁️';
}

function maskAll() {
  ['pw-output', 'pp-output'].forEach((id) => $(id).classList.add('masked'));
  $('pw-reveal').textContent = '👁️';
  $('pp-reveal').textContent = '👁️';
}

// ── Session history (in-memory only) ───────────────────────────────────────

const history = [];
const HISTORY_MAX = 50;

function addHistory(value, kind) {
  if (!value || value === history[0]?.value) return;
  history.unshift({ value, kind });
  if (history.length > HISTORY_MAX) history.pop();
  renderHistory();
}

function renderHistory() {
  const list = $('hist-list');
  list.innerHTML = '';
  $('hist-empty').style.display = history.length ? 'none' : 'block';
  for (const { value, kind } of history) {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `<span class="h-tag"></span><span class="h-val masked"></span>
      <button class="icon-btn h-reveal" title="Show / hide">👁️</button>
      <button class="icon-btn h-copy" title="Copy">📋</button>`;
    li.querySelector('.h-tag').textContent = kind;
    const val = li.querySelector('.h-val');
    val.textContent = value;
    li.querySelector('.h-reveal').addEventListener('click', (e) => {
      const m = val.classList.toggle('masked');
      e.currentTarget.textContent = m ? '👁️' : '🙈';
    });
    li.querySelector('.h-copy').addEventListener('click', () => copy(value));
    list.appendChild(li);
  }
}

// ── QR code modal ──────────────────────────────────────────────────────────

async function showQr(text) {
  if (!text || text === 'click generate') return toast('Generate something first');
  const dataUrl = await api.qrCode(text);
  if (!dataUrl) return;
  $('qr-img').src = dataUrl;
  $('qr-modal').hidden = false;
}

function closeQr() {
  $('qr-modal').hidden = true;
  $('qr-img').src = '';
}

function paintMeter(fillEl, labelEl, entropyEl, result) {
  fillEl.style.width = `${result.score}%`;
  fillEl.style.background = result.color;
  labelEl.textContent = result.label;
  labelEl.style.color = result.color;
  if (entropyEl) entropyEl.textContent = result.entropy ? `${result.entropy} bits` : '';
}

// ── Navigation ───────────────────────────────────────────────────────────────

document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    btn.classList.add('active');
    $(`view-${btn.dataset.view}`).classList.add('active');
  });
});

// ── Password view ────────────────────────────────────────────────────────────

function pwOptions() {
  return {
    length: +$('pw-length').value,
    uppercase: $('pw-upper').checked,
    lowercase: $('pw-lower').checked,
    digits: $('pw-digits').checked,
    symbols: $('pw-symbols').checked,
    excludeAmbiguous: $('pw-ambig').checked,
    excludeChars: $('pw-exclude').value,
    customSymbols: $('pw-symbolset').value,
    requireEach: $('pw-require').checked,
    pronounceable: $('pw-pron').checked,
  };
}

async function generatePassword() {
  try {
    const opts = pwOptions();
    const pw = opts.pronounceable
      ? await api.generatePronounceable({ length: opts.length, uppercase: opts.uppercase, digits: opts.digits })
      : await api.generatePassword(opts);
    setOutput('pw-output', pw);
    const result = await api.evaluateStrength(pw);
    paintMeter($('pw-meter-fill'), $('pw-meter-label'), $('pw-meter-entropy'), result);
    $('pw-crack').textContent = `Offline crack time (fast GPU): ${result.crackTimes.offline_fast}`;
    addHistory(pw, 'password');
  } catch (err) {
    setOutput('pw-output', err.message || 'Error');
    toast(err.message || 'Error');
  }
}

$('pw-length').addEventListener('input', (e) => {
  $('pw-length-val').textContent = e.target.value;
});
$('pw-length').addEventListener('change', generatePassword);
['pw-upper', 'pw-lower', 'pw-digits', 'pw-symbols', 'pw-ambig', 'pw-require', 'pw-pron'].forEach((id) =>
  $(id).addEventListener('change', generatePassword)
);
$('pw-exclude').addEventListener('change', generatePassword);
$('pw-symbolset').addEventListener('change', generatePassword);
$('pw-generate').addEventListener('click', generatePassword);
$('pw-regen').addEventListener('click', generatePassword);
$('pw-copy').addEventListener('click', () => copy($('pw-output').textContent));
$('pw-output').addEventListener('click', () => copy($('pw-output').textContent));
$('pw-reveal').addEventListener('click', () => toggleMask('pw-output', $('pw-reveal')));
$('pw-qr').addEventListener('click', () => showQr($('pw-output').textContent));

// ── Passphrase view ──────────────────────────────────────────────────────────

function ppOptions() {
  return {
    words: +$('pp-words').value,
    separator: $('pp-sep').value,
    capitalize: $('pp-cap').checked,
    includeNumber: $('pp-num').checked,
    includeSymbol: $('pp-sym').checked,
  };
}

async function generatePassphrase() {
  const phrase = await api.generatePassphrase(ppOptions());
  setOutput('pp-output', phrase);
  const result = await api.evaluateStrength(phrase);
  const baseEntropy = await api.passphraseEntropy(+$('pp-words').value);
  paintMeter($('pp-meter-fill'), $('pp-meter-label'), $('pp-meter-entropy'), result);
  $('pp-meter-entropy').textContent = `~${baseEntropy} bits from words`;
  addHistory(phrase, 'passphrase');
}

$('pp-words').addEventListener('input', (e) => {
  $('pp-words-val').textContent = e.target.value;
});
$('pp-words').addEventListener('change', generatePassphrase);
['pp-sep', 'pp-cap', 'pp-num', 'pp-sym'].forEach((id) =>
  $(id).addEventListener('change', generatePassphrase)
);
$('pp-generate').addEventListener('click', generatePassphrase);
$('pp-regen').addEventListener('click', generatePassphrase);
$('pp-copy').addEventListener('click', () => copy($('pp-output').textContent));
$('pp-output').addEventListener('click', () => copy($('pp-output').textContent));
$('pp-reveal').addEventListener('click', () => toggleMask('pp-output', $('pp-reveal')));
$('pp-qr').addEventListener('click', () => showQr($('pp-output').textContent));

// ── PIN view ─────────────────────────────────────────────────────────────────

async function generatePin() {
  const pin = await api.generatePin(+$('pin-length').value);
  $('pin-output').textContent = pin;
}
$('pin-length').addEventListener('input', (e) => {
  $('pin-length-val').textContent = e.target.value;
});
$('pin-length').addEventListener('change', generatePin);
$('pin-generate').addEventListener('click', generatePin);
$('pin-regen').addEventListener('click', generatePin);
$('pin-copy').addEventListener('click', () => copy($('pin-output').textContent));
$('pin-output').addEventListener('click', () => copy($('pin-output').textContent));

// ── Bulk view ────────────────────────────────────────────────────────────────

function bulkOptions() {
  return {
    length: +$('bulk-length').value,
    uppercase: $('bulk-upper').checked,
    lowercase: $('bulk-lower').checked,
    digits: $('bulk-digits').checked,
    symbols: $('bulk-symbols').checked,
    excludeAmbiguous: $('bulk-ambig').checked,
  };
}

async function generateBulk() {
  try {
    const count = Math.max(1, Math.min(10000, +$('bulk-count').value || 1));
    const list = await api.generateBulk(count, bulkOptions());
    $('bulk-output').value = list.join('\n');
    toast(`Generated ${list.length} passwords`);
  } catch (err) {
    toast(err.message || 'Error');
  }
}

$('bulk-length').addEventListener('input', (e) => {
  $('bulk-length-val').textContent = e.target.value;
});
$('bulk-generate').addEventListener('click', generateBulk);
$('bulk-copy').addEventListener('click', () => {
  if ($('bulk-output').value) copy($('bulk-output').value);
});
$('bulk-export').addEventListener('click', async () => {
  const content = $('bulk-output').value;
  if (!content) return toast('Nothing to export');
  const res = await api.exportPasswords(content + '\n', 'passwords.txt');
  if (res.ok) toast('Exported');
});

// ── Hash view ────────────────────────────────────────────────────────────────

$('hash-rounds').addEventListener('input', (e) => {
  $('hash-rounds-val').textContent = e.target.value;
});

$('hash-go').addEventListener('click', async () => {
  const pw = $('hash-input').value;
  if (!pw) return toast('Enter a password first');
  const [bc, dg, sc, pk] = await Promise.all([
    api.bcryptHash(pw, +$('hash-rounds').value),
    api.digests(pw),
    api.scryptHash(pw),
    api.pbkdf2Hash(pw),
  ]);
  $('hash-bcrypt').textContent = bc.hash;
  $('hash-sha256').textContent = dg.sha256;
  $('hash-sha512').textContent = dg.sha512;
  $('hash-scrypt').textContent = sc;
  $('hash-pbkdf2').textContent = pk;
  $('hash-note').textContent = bc.truncated
    ? 'Note: bcrypt only uses the first 72 bytes — your password was truncated for hashing.'
    : `bcrypt cost factor ${bc.rounds}.`;
  $('hash-results').hidden = false;
});

$('verify-go').addEventListener('click', async () => {
  const pw = $('hash-input').value;
  const hash = $('verify-hash').value.trim();
  if (!pw || !hash) return toast('Enter both a password and a hash');
  const res = await api.bcryptVerify(pw, hash);
  const el = $('verify-result');
  if (res.error) {
    el.textContent = `⚠️ ${res.error}`;
    el.className = 'verify-result bad';
  } else if (res.match) {
    el.textContent = '✓ Match — the password produces this hash.';
    el.className = 'verify-result ok';
  } else {
    el.textContent = '✗ No match.';
    el.className = 'verify-result bad';
  }
});

document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', () => copy($(btn.dataset.copy).textContent));
});

// ── Analyze view ─────────────────────────────────────────────────────────────

const CRACK_LABELS = {
  online_throttled: 'Online (throttled, 100/s)',
  online: 'Online (10k/s)',
  offline_slow: 'Offline slow hash (10B/s)',
  offline_fast: 'Offline fast hash (1T/s)',
};

let analyzeTimer = null;
$('an-input').addEventListener('input', () => {
  clearTimeout(analyzeTimer);
  analyzeTimer = setTimeout(analyze, 120);
});

async function analyze() {
  const pw = $('an-input').value;
  const result = await api.evaluateStrength(pw);
  paintMeter($('an-meter-fill'), $('an-meter-label'), $('an-meter-entropy'), result);

  const grid = $('an-crack-grid');
  grid.innerHTML = '';
  if (pw) {
    const cells = [
      ['Length', `${result.length} chars`],
      ['Character set', `${result.charsetSize} symbols`],
      ...Object.entries(result.crackTimes).map(([k, v]) => [CRACK_LABELS[k], v]),
    ];
    for (const [k, v] of cells) {
      const cell = document.createElement('div');
      cell.className = 'analysis-cell';
      cell.innerHTML = `<span class="k"></span><span class="v"></span>`;
      cell.querySelector('.k').textContent = k;
      cell.querySelector('.v').textContent = v;
      grid.appendChild(cell);
    }
  }

  renderNotes($('an-warnings'), result.warnings, '⚠️ ');
  renderNotes($('an-suggestions'), pw ? result.suggestions : [], '💡 ');
}

function renderNotes(container, items, prefix) {
  container.innerHTML = '';
  for (const item of items || []) {
    const div = document.createElement('div');
    div.textContent = prefix + item;
    container.appendChild(div);
  }
}

// ── Settings view ────────────────────────────────────────────────────────────

$('set-theme').addEventListener('change', async (e) => {
  settings = await api.saveSettings({ theme: e.target.value });
  toast('Theme updated');
});
$('set-clip').addEventListener('change', async (e) => {
  settings = await api.saveSettings({ clipboardClearSeconds: +e.target.value });
  toast('Saved');
});
$('set-blur').addEventListener('change', async (e) => {
  settings = await api.saveSettings({ hideOnBlur: e.target.checked });
  toast('Saved');
});
$('set-quitclip').addEventListener('change', async (e) => {
  settings = await api.saveSettings({ clearClipboardOnQuit: e.target.checked });
  toast('Saved');
});

// ── History / QR / shortcuts / blur ─────────────────────────────────────────

$('hist-clear').addEventListener('click', () => {
  history.length = 0;
  renderHistory();
  toast('History cleared');
});
$('qr-close').addEventListener('click', closeQr);
$('qr-modal').addEventListener('click', (e) => {
  if (e.target.id === 'qr-modal') closeQr();
});

// Hide displayed secrets when the window loses focus (if enabled).
window.addEventListener('blur', () => {
  if (settings && settings.hideOnBlur) maskAll();
});

// Keyboard shortcuts: Ctrl/Cmd+G regenerates the active view; Esc closes the
// QR modal or masks secrets.
document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'g') {
    e.preventDefault();
    const active = document.querySelector('.nav-item.active')?.dataset.view;
    if (active === 'password') generatePassword();
    else if (active === 'passphrase') generatePassphrase();
    else if (active === 'pin') generatePin();
    else if (active === 'bulk') generateBulk();
  } else if (e.key === 'Escape') {
    if (!$('qr-modal').hidden) closeQr();
    else maskAll();
  }
});

// ── Init: load settings, apply defaults to controls, first generate ──────────

async function init() {
  settings = await api.getSettings();

  // Settings controls
  $('set-theme').value = settings.theme;
  $('set-clip').value = String(settings.clipboardClearSeconds);
  $('set-blur').checked = !!settings.hideOnBlur;
  $('set-quitclip').checked = settings.clearClipboardOnQuit !== false;

  // Password defaults
  const p = settings.password;
  $('pw-length').value = p.length; $('pw-length-val').textContent = p.length;
  $('pw-upper').checked = p.uppercase;
  $('pw-lower').checked = p.lowercase;
  $('pw-digits').checked = p.digits;
  $('pw-symbols').checked = p.symbols;
  $('pw-ambig').checked = p.excludeAmbiguous;
  $('pw-require').checked = p.requireEach;
  $('pw-pron').checked = !!p.pronounceable;
  $('pw-exclude').value = p.excludeChars || '';
  $('pw-symbolset').value = p.customSymbols || '';
  $('bulk-length').value = p.length; $('bulk-length-val').textContent = p.length;

  // Passphrase defaults
  const pp = settings.passphrase;
  $('pp-words').value = pp.words; $('pp-words-val').textContent = pp.words;
  $('pp-sep').value = pp.separator;
  $('pp-cap').checked = pp.capitalize;
  $('pp-num').checked = pp.includeNumber;
  $('pp-sym').checked = pp.includeSymbol;

  await generatePassword();
  await generatePassphrase();
  await generatePin();

  // Persist generator preferences as the user tweaks them.
  const persistPw = () => api.saveSettings({ password: pwOptions() });
  ['pw-length', 'pw-upper', 'pw-lower', 'pw-digits', 'pw-symbols', 'pw-ambig', 'pw-require',
   'pw-pron', 'pw-exclude', 'pw-symbolset']
    .forEach((id) => $(id).addEventListener('change', persistPw));
  const persistPp = () => api.saveSettings({ passphrase: ppOptions() });
  ['pp-words', 'pp-sep', 'pp-cap', 'pp-num', 'pp-sym']
    .forEach((id) => $(id).addEventListener('change', persistPp));
}

init();
