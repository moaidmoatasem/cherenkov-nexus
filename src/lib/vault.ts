/**
 * Client-side vault — real AES-GCM, or nothing.
 *
 * The Identity Vault used to raise a toast reading "Master Profile encrypted
 * with AES-GCM client-side key" while doing no encryption at all: it set a
 * boolean in localStorage, left the profile in plaintext beside it, and
 * accepted any non-empty passphrase as the unlock. A product whose first stated
 * principle is that PII never leaves the machine cannot make a cryptographic
 * claim it does not implement.
 *
 * This module implements the claim. Everything here runs in the browser against
 * WebCrypto; no key, passphrase, or plaintext is ever sent anywhere.
 *
 * Envelope format is versioned and self-describing, so the KDF cost can be
 * raised later without stranding vaults sealed under the old parameters.
 */

export const VAULT_ENVELOPE_KEY = "cherenkov_vault_envelope";
export const MASTER_PROFILE_KEY = "cherenkov_master_profile";

/**
 * PBKDF2-HMAC-SHA256 iterations.
 *
 * OWASP's current floor for this construction. Costs roughly half a second in a
 * browser, which is the right trade for an interaction a user performs once per
 * session — and the whole point of a KDF is that it is slow.
 */
export const KDF_ITERATIONS = 600_000;

export interface VaultEnvelope {
  /** Format version. Bump when the envelope shape changes. */
  v: 1;
  kdf: "PBKDF2-SHA256";
  cipher: "AES-GCM";
  iterations: number;
  /** base64 */
  salt: string;
  /** base64 */
  iv: string;
  /** base64 ciphertext, including the GCM authentication tag */
  ct: string;
  /** ISO timestamp the vault was sealed. Not secret, useful in the UI. */
  sealedAt: string;
}

export class WrongPassphraseError extends Error {
  constructor() {
    super("That passphrase did not open the vault. The passphrase is wrong, or the vault data has been altered.");
    this.name = "WrongPassphraseError";
  }
}

export class VaultUnavailableError extends Error {
  constructor(detail: string) {
    super(`Encryption is unavailable in this browser: ${detail}`);
    this.name = "VaultUnavailableError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Encoding — works identically in Node and the browser
// ─────────────────────────────────────────────────────────────────────────────

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  // Chunked so a large profile cannot blow the argument limit on spread.
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Crypto
// ─────────────────────────────────────────────────────────────────────────────

function subtle(): SubtleCrypto {
  const c = globalThis.crypto;
  if (!c?.subtle) {
    // WebCrypto requires a secure context. localhost counts; plain http:// on a
    // LAN address does not, which is exactly where someone self-hosting would
    // hit this.
    throw new VaultUnavailableError(
      "window.crypto.subtle is not available. This needs a secure context (https, or localhost)."
    );
  }
  return c.subtle;
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await subtle().importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return subtle().deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt a string under a passphrase. Fresh salt and IV every time. */
export async function seal(
  plaintext: string,
  passphrase: string,
  iterations: number = KDF_ITERATIONS
): Promise<VaultEnvelope> {
  if (passphrase.length === 0) {
    throw new Error("A passphrase is required to seal the vault.");
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, iterations);

  const ct = await subtle().encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    new TextEncoder().encode(plaintext)
  );

  return {
    v: 1,
    kdf: "PBKDF2-SHA256",
    cipher: "AES-GCM",
    iterations,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ct: toBase64(new Uint8Array(ct)),
    sealedAt: new Date().toISOString(),
  };
}

/**
 * Decrypt an envelope.
 *
 * A wrong passphrase and tampered ciphertext both surface as
 * `WrongPassphraseError` — GCM's authentication tag cannot distinguish them,
 * and pretending otherwise would be a lie about what was verified.
 */
export async function open(envelope: VaultEnvelope, passphrase: string): Promise<string> {
  if (envelope.v !== 1) {
    throw new Error(`Unsupported vault format v${envelope.v}.`);
  }
  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const key = await deriveKey(passphrase, salt, envelope.iterations);

  let plaintext: ArrayBuffer;
  try {
    plaintext = await subtle().decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      fromBase64(envelope.ct) as BufferSource
    );
  } catch {
    throw new WrongPassphraseError();
  }
  return new TextDecoder().decode(plaintext);
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────────────────────

export function readEnvelope(): VaultEnvelope | null {
  try {
    const raw = localStorage.getItem(VAULT_ENVELOPE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VaultEnvelope;
    return parsed && parsed.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function isSealed(): boolean {
  return readEnvelope() !== null;
}

/**
 * Seal the profile: write the envelope, then remove the plaintext.
 *
 * Order matters. Writing the envelope first means a failure between the two
 * steps leaves a recoverable vault plus a stale plaintext, rather than an
 * unrecoverable profile.
 */
export async function sealProfile(profileJson: string, passphrase: string): Promise<VaultEnvelope> {
  const envelope = await seal(profileJson, passphrase);
  localStorage.setItem(VAULT_ENVELOPE_KEY, JSON.stringify(envelope));
  localStorage.removeItem(MASTER_PROFILE_KEY);
  return envelope;
}

/** Open the vault and restore the plaintext profile for this browser. */
export async function openProfile(passphrase: string): Promise<string> {
  const envelope = readEnvelope();
  if (!envelope) throw new Error("There is no sealed vault in this browser.");
  const profileJson = await open(envelope, passphrase);
  localStorage.setItem(MASTER_PROFILE_KEY, profileJson);
  localStorage.removeItem(VAULT_ENVELOPE_KEY);
  return profileJson;
}
