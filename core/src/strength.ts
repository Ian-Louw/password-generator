// Self-contained password strength estimator: charset entropy plus practical
// penalties for the weaknesses attackers exploit first. No external dependency.

const COMMON_PASSWORDS = new Set([
  "password", "passw0rd", "password1", "123456", "12345678", "123456789",
  "1234567890", "qwerty", "qwertyuiop", "abc123", "letmein", "admin",
  "welcome", "monkey", "master", "dragon", "login", "princess", "football",
  "shadow", "sunshine", "trustno1", "iloveyou", "1234", "0000", "1111",
  "aaaa", "superman", "batman", "starwars", "whatever", "hello", "freedom",
  "ninja", "azerty", "solo", "access", "flower", "hottie", "loveme", "zaq12wsx",
]);

const KEYBOARD_RUNS = [
  "qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890",
  "qwerty", "azerty", "qazwsx", "qwertz",
];

const SEQUENCES = ["abcdefghijklmnopqrstuvwxyz", "0123456789"];

const SCENARIOS: Record<string, number> = {
  online_throttled: 100,
  online: 1e4,
  offline_slow: 1e10,
  offline_fast: 1e12,
};

export type CrackTimes = Record<string, string>;

export interface StrengthResult {
  score: number;
  label: string;
  color: string;
  entropy: number;
  length: number;
  charsetSize: number;
  warnings: string[];
  suggestions: string[];
  crackTimes: CrackTimes;
}

export function charsetSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += 33;
  return size;
}

export function rawEntropy(password: string): number {
  if (!password) return 0;
  const size = charsetSize(password);
  if (size === 0) return 0;
  return password.length * Math.log2(size);
}

function hasSequence(lower: string): boolean {
  for (const seq of SEQUENCES) {
    for (let i = 0; i + 3 <= seq.length; i++) {
      const sub = seq.slice(i, i + 3);
      const rev = sub.split("").reverse().join("");
      if (lower.includes(sub) || lower.includes(rev)) return true;
    }
  }
  return false;
}

function hasKeyboardRun(lower: string): boolean {
  for (const run of KEYBOARD_RUNS) {
    for (let i = 0; i + 4 <= run.length; i++) {
      if (lower.includes(run.slice(i, i + 4))) return true;
    }
  }
  return false;
}

const hasRepeats = (password: string) => /(.)\1\1/.test(password);
const looksLikeDate = (password: string) =>
  /(19|20)\d{2}/.test(password) || /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(password);
const uniqueRatio = (password: string) =>
  password.length ? new Set(password).size / password.length : 0;

export function evaluateStrength(password: string): StrengthResult {
  password = password || "";
  const length = password.length;
  const lower = password.toLowerCase();
  const warnings: string[] = [];
  const suggestions: string[] = [];

  let entropy = rawEntropy(password);

  if (COMMON_PASSWORDS.has(lower)) {
    entropy = Math.min(entropy, 8);
    warnings.push("This is one of the most common passwords in the world.");
  }
  for (const common of COMMON_PASSWORDS) {
    if (common.length >= 5 && lower.includes(common)) {
      entropy *= 0.5;
      warnings.push(`Contains a well-known word ("${common}").`);
      break;
    }
  }
  if (hasSequence(lower)) {
    entropy *= 0.75;
    warnings.push('Contains a character sequence (e.g. "abc", "123").');
  }
  if (hasKeyboardRun(lower)) {
    entropy *= 0.75;
    warnings.push('Contains a keyboard pattern (e.g. "qwerty").');
  }
  if (hasRepeats(password)) {
    entropy *= 0.8;
    warnings.push('Contains repeated characters (e.g. "aaa").');
  }
  if (looksLikeDate(password)) {
    entropy *= 0.85;
    warnings.push("Looks like it contains a year or date.");
  }
  if (length > 0 && uniqueRatio(password) < 0.5) {
    entropy *= 0.7;
    warnings.push("Uses very few distinct characters.");
  }

  entropy = Math.round(entropy);

  if (length < 12) suggestions.push("Use at least 12–16 characters.");
  if (!/[A-Z]/.test(password)) suggestions.push("Add uppercase letters.");
  if (!/[a-z]/.test(password)) suggestions.push("Add lowercase letters.");
  if (!/[0-9]/.test(password)) suggestions.push("Add numbers.");
  if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push("Add symbols.");
  if (warnings.length === 0 && entropy >= 75 && suggestions.length === 0) {
    suggestions.push("Looks great — store it in a password manager.");
  }

  const score = Math.max(0, Math.min(100, Math.round((entropy / 128) * 100)));

  let label: string, color: string;
  if (length === 0) {
    label = "Empty";
    color = "#9aa0a6";
  } else if (entropy < 28) {
    label = "Very Weak";
    color = "#e74c3c";
  } else if (entropy < 50) {
    label = "Weak";
    color = "#e67e22";
  } else if (entropy < 70) {
    label = "Fair";
    color = "#f1c40f";
  } else if (entropy < 100) {
    label = "Strong";
    color = "#2ecc71";
  } else {
    label = "Very Strong";
    color = "#27ae60";
  }

  const guesses = Math.pow(2, entropy) / 2;
  const crackTimes: CrackTimes = {};
  for (const [name, rate] of Object.entries(SCENARIOS)) {
    crackTimes[name] = humanizeTime(guesses / rate);
  }

  return { score, label, color, entropy, length, charsetSize: charsetSize(password), warnings, suggestions, crackTimes };
}

export function humanizeTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "centuries";
  if (seconds < 1e-3) return "instant";
  if (seconds < 1) return "less than a second";
  const units: [string, number][] = [
    ["second", 1],
    ["minute", 60],
    ["hour", 3600],
    ["day", 86400],
    ["month", 2629800],
    ["year", 31557600],
    ["century", 3155760000],
  ];
  for (let i = units.length - 1; i >= 0; i--) {
    const [name, secs] = units[i];
    if (seconds >= secs) {
      const value = seconds / secs;
      if (name === "century") {
        if (value > 1000) return "effectively forever";
        return `${Math.round(value).toLocaleString("en-US")} centuries`;
      }
      const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
      return `${rounded.toLocaleString("en-US")} ${name}${rounded !== 1 ? "s" : ""}`;
    }
  }
  return "instant";
}
