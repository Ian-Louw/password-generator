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
    requireEach: $('pw-require').checked,
  };
}

async function generatePassword() {
  try {
    const pw = await api.generatePassword(pwOptions());
    $('pw-output').textContent = pw;
    const result = await api.evaluateStrength(pw);
    paintMeter($('pw-meter-fill'), $('pw-meter-label'), $('pw-meter-entropy'), result);
    $('pw-crack').textContent = `Offline crack time (fast GPU): ${result.crackTimes.offline_fast}`;
  } catch (err) {
    $('pw-output').textContent = err.message || 'Error';
    toast(err.message || 'Error');
  }
}

$('pw-length').addEventListener('input', (e) => {
  $('pw-length-val').textContent = e.target.value;
});
$('pw-length').addEventListener('change', generatePassword);
['pw-upper', 'pw-lower', 'pw-digits', 'pw-symbols', 'pw-ambig', 'pw-require'].forEach((id) =>
  $(id).addEventListener('change', generatePassword)
);
$('pw-exclude').addEventListener('change', generatePassword);
$('pw-generate').addEventListener('click', generatePassword);
$('pw-regen').addEventListener('click', generatePassword);
$('pw-copy').addEventListener('click', () => copy($('pw-output').textContent));
$('pw-output').addEventListener('click', () => copy($('pw-output').textContent));

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
  $('pp-output').textContent = phrase;
  const result = await api.evaluateStrength(phrase);
  const baseEntropy = await api.passphraseEntropy(+$('pp-words').value);
  paintMeter($('pp-meter-fill'), $('pp-meter-label'), $('pp-meter-entropy'), result);
  $('pp-meter-entropy').textContent = `~${baseEntropy} bits from words`;
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
  const [bc, dg] = await Promise.all([
    api.bcryptHash(pw, +$('hash-rounds').value),
    api.digests(pw),
  ]);
  $('hash-bcrypt').textContent = bc.hash;
  $('hash-sha256').textContent = dg.sha256;
  $('hash-sha512').textContent = dg.sha512;
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

// ── Init: load settings, apply defaults to controls, first generate ──────────

async function init() {
  settings = await api.getSettings();

  // Settings controls
  $('set-theme').value = settings.theme;
  $('set-clip').value = String(settings.clipboardClearSeconds);

  // Password defaults
  const p = settings.password;
  $('pw-length').value = p.length; $('pw-length-val').textContent = p.length;
  $('pw-upper').checked = p.uppercase;
  $('pw-lower').checked = p.lowercase;
  $('pw-digits').checked = p.digits;
  $('pw-symbols').checked = p.symbols;
  $('pw-ambig').checked = p.excludeAmbiguous;
  $('pw-require').checked = p.requireEach;
  $('pw-exclude').value = p.excludeChars || '';
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
  ['pw-length', 'pw-upper', 'pw-lower', 'pw-digits', 'pw-symbols', 'pw-ambig', 'pw-require', 'pw-exclude']
    .forEach((id) => $(id).addEventListener('change', persistPw));
  const persistPp = () => api.saveSettings({ passphrase: ppOptions() });
  ['pp-words', 'pp-sep', 'pp-cap', 'pp-num', 'pp-sym']
    .forEach((id) => $(id).addEventListener('change', persistPp));
}

init();
