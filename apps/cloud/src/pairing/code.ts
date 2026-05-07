// 6-digit pair code minting. Per ADR 0021 we use a 30-character alphabet —
// digits + uppercase A–Z minus the ambiguous-glyph set (O/0/1/I/L) — for a
// total space of 30^6 ≈ 729M. crypto.getRandomValues() drives the picks.

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const PAIR_CODE_LENGTH = 6;
export const PAIR_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes per ADR 0021.

export function generatePairCode(): string {
  const buf = new Uint8Array(PAIR_CODE_LENGTH);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < PAIR_CODE_LENGTH; i++) {
    const byte = buf[i] ?? 0;
    const ch = ALPHABET.charAt(byte % ALPHABET.length);
    out += ch;
  }
  return out;
}

/**
 * 256-bit relay secret per ADR 0021 — base64url-encoded so the addon can store
 * it in `/data/options.json` (JSON-safe).
 */
export function generateRelaySecret(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return base64urlEncode(buf);
}

function base64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const standard = btoa(binary);
  return standard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
