/**
 * security.js — Frontend security utilities for Kranely
 *
 * Covers OWASP Top 10 relevant to a React + Convex SPA:
 *  A03 Injection / XSS  → sanitizeText, sanitizeHtml
 *  A04 Insecure Design   → validateFile, validateEmail, validatePhone
 *  A05 Misconfiguration  → CSP meta helpers
 *  A07 Auth failures     → handled by Clerk (external)
 *  A08 Data integrity    → validatePositiveNumber
 */

// ─── Text sanitisation ──────────────────────────────────────────────────────

/**
 * Strip all HTML tags and dangerous characters from a plain-text string.
 * Use this before inserting user input into any DOM text node.
 */
export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Remove script tags and on* event handlers from HTML strings.
 * Use when you must allow limited HTML (e.g. rich-text previews).
 * Prefer sanitizeText for plain inputs.
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript\s*:/gi, '');
}

/**
 * Truncate a string to a safe maximum length to prevent oversized payloads.
 * Default max is 5 000 characters (adjust per field).
 */
export function truncate(value, max = 5000) {
  if (typeof value !== 'string') return '';
  return value.slice(0, max);
}

/**
 * Combined: sanitise + truncate. Use for every user text input sent to Convex.
 */
export function sanitizeInput(value, max = 2000) {
  return sanitizeText(truncate(value, max));
}

// ─── Validation helpers ─────────────────────────────────────────────────────

/** Returns true if the string looks like a valid email address. */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(email.trim());
}

/** Returns true if value is a positive finite number (>0). */
export function validatePositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

/** Returns true if the string is a plausible Italian phone number. */
export function validatePhone(phone) {
  if (!phone) return true; // optional field
  return /^[+]?[\d\s\-().]{6,20}$/.test(phone.trim());
}

/** Returns true if value length is within [min, max]. */
export function validateLength(value, min = 1, max = 2000) {
  if (typeof value !== 'string') return false;
  const len = value.trim().length;
  return len >= min && len <= max;
}

// ─── File upload security ────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES    = ['application/pdf', 'application/msword',
                               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                               'text/plain'];
const ALLOWED_ALL_TYPES    = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

const MAX_FILE_SIZE_BYTES   = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGE_SIZE_BYTES  =  5 * 1024 * 1024; //  5 MB

/**
 * Validates a File object for upload.
 *
 * @param {File} file
 * @param {'image'|'document'|'any'} kind
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateFile(file, kind = 'any') {
  if (!file || !(file instanceof File)) {
    return { ok: false, error: 'File non valido.' };
  }

  const allowed = kind === 'image'    ? ALLOWED_IMAGE_TYPES
                : kind === 'document' ? ALLOWED_DOC_TYPES
                :                       ALLOWED_ALL_TYPES;

  if (!allowed.includes(file.type)) {
    return { ok: false, error: `Tipo di file non consentito: ${file.type || 'sconosciuto'}.` };
  }

  const maxBytes = kind === 'image' ? MAX_IMAGE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
  if (file.size > maxBytes) {
    const mb = (maxBytes / 1024 / 1024).toFixed(0);
    return { ok: false, error: `File troppo grande. Massimo ${mb} MB.` };
  }

  if (file.size === 0) {
    return { ok: false, error: 'Il file è vuoto.' };
  }

  return { ok: true };
}

/**
 * Validate an array of files, returning the first error found or null.
 *
 * @param {File[]} files
 * @param {'image'|'document'|'any'} kind
 * @returns {string|null} error message or null if all valid
 */
export function validateFiles(files, kind = 'any') {
  for (const file of files) {
    const result = validateFile(file, kind);
    if (!result.ok) return result.error;
  }
  return null;
}

// ─── URL safety ─────────────────────────────────────────────────────────────

/**
 * Returns true only for http/https URLs (blocks javascript:, data:, etc.)
 */
export function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// ─── Client-side rate limiter ────────────────────────────────────────────────

/**
 * In-memory rate limiter for frontend form submissions.
 * Use one instance per form / action.
 *
 * @example
 *   const rl = new RateLimiter(3, 10 * 60 * 1000); // 3 per 10 min
 *   if (!rl.allow()) { setError('Too many requests'); return; }
 */
export class RateLimiter {
  constructor(maxCalls, windowMs) {
    this._max = maxCalls;
    this._window = windowMs;
    this._count = 0;
    this._windowStart = 0;
  }

  /** Returns true if the action is allowed, false if rate-limited. */
  allow() {
    const now = Date.now();
    if (now - this._windowStart > this._window) {
      this._count = 0;
      this._windowStart = now;
    }
    if (this._count >= this._max) return false;
    this._count += 1;
    return true;
  }

  /** Seconds until the current window resets. */
  retryAfterSeconds() {
    const elapsed = Date.now() - this._windowStart;
    return Math.max(0, Math.ceil((this._window - elapsed) / 1000));
  }
}

// ─── Content Security Policy meta helper ────────────────────────────────────

/**
 * Injects a <meta http-equiv="Content-Security-Policy"> into the document head.
 * Call once at app startup. Adjust the policy to your actual CDN/API origins.
 *
 * NOTE: A real CSP should be set via HTTP headers (Vercel headers config).
 *       This meta-tag CSP is a fallback for shared hosting.
 */
export function injectCSPMeta() {
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return;
  const meta = document.createElement('meta');
  meta.setAttribute('http-equiv', 'Content-Security-Policy');
  meta.setAttribute('content', [
    "default-src 'self'",
    "script-src  'self' 'unsafe-inline' 'unsafe-eval' https://clerk.kranely.app https://*.clerk.accounts.dev https://challenges.cloudflare.com",
    "style-src   'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src    'self' https://fonts.gstatic.com",
    "img-src     'self' data: blob: https:",
    "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://api.clerk.com https://*.clerk.accounts.dev",
    "frame-src   'none'",
    "object-src  'none'",
    "base-uri    'self'",
  ].join('; '));
  document.head.prepend(meta);
}

