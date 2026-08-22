import { describe, it, expect } from "vitest";
import {
  seal,
  open,
  toBase64,
  fromBase64,
  WrongPassphraseError,
  KDF_ITERATIONS,
  type VaultEnvelope,
} from "../src/lib/vault";

// PBKDF2 at the production iteration count is deliberately slow. Tests that are
// not specifically about the cost use a low count; the cost itself is asserted
// separately against the constant.
const FAST = 1_000;

const PROFILE = JSON.stringify({
  name: "Test Candidate",
  location: "Cairo, Egypt",
  tech_stack: ["Playwright", "TypeScript"],
  passportNumber: "X1234567",
});

describe("base64 round-trip", () => {
  it("round-trips arbitrary bytes", () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255, 42]);
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
  });

  it("handles payloads larger than the chunk size", () => {
    const big = new Uint8Array(70_000).map((_, i) => i % 256);
    expect(fromBase64(toBase64(big))).toEqual(big);
  });

  it("round-trips an empty array", () => {
    expect(fromBase64(toBase64(new Uint8Array(0)))).toEqual(new Uint8Array(0));
  });
});

describe("seal and open", () => {
  it("round-trips the plaintext", async () => {
    const envelope = await seal(PROFILE, "correct horse battery staple", FAST);
    expect(await open(envelope, "correct horse battery staple")).toBe(PROFILE);
  });

  it("round-trips unicode without mangling it", async () => {
    const text = "Moayed — Cairo · 日本語 · 🔐";
    const envelope = await seal(text, "pw", FAST);
    expect(await open(envelope, "pw")).toBe(text);
  });

  /**
   * The defect this module replaces: the old vault accepted any non-empty
   * passphrase, so "locked" meant nothing.
   */
  it("rejects a wrong passphrase", async () => {
    const envelope = await seal(PROFILE, "right", FAST);
    await expect(open(envelope, "wrong")).rejects.toBeInstanceOf(WrongPassphraseError);
  });

  it("rejects an empty passphrase against a sealed vault", async () => {
    const envelope = await seal(PROFILE, "right", FAST);
    await expect(open(envelope, "")).rejects.toBeInstanceOf(WrongPassphraseError);
  });

  it("refuses to seal with an empty passphrase", async () => {
    await expect(seal(PROFILE, "", FAST)).rejects.toThrow(/passphrase is required/i);
  });

  it("is case- and whitespace-sensitive", async () => {
    const envelope = await seal(PROFILE, "Passphrase", FAST);
    await expect(open(envelope, "passphrase")).rejects.toBeInstanceOf(WrongPassphraseError);
    await expect(open(envelope, "Passphrase ")).rejects.toBeInstanceOf(WrongPassphraseError);
  });
});

describe("the envelope leaks nothing", () => {
  it("contains no plaintext fragment", async () => {
    const envelope = await seal(PROFILE, "pw", FAST);
    const serialised = JSON.stringify(envelope);
    for (const secret of ["Test Candidate", "Cairo", "Playwright", "X1234567"]) {
      expect(serialised).not.toContain(secret);
    }
  });

  it("does not store the passphrase or a hash of it", async () => {
    const envelope = await seal(PROFILE, "hunter2", FAST);
    expect(JSON.stringify(envelope)).not.toContain("hunter2");
    expect(Object.keys(envelope)).not.toContain("vaultKeyHash");
  });

  it("uses a fresh salt and IV on every seal", async () => {
    const a = await seal(PROFILE, "pw", FAST);
    const b = await seal(PROFILE, "pw", FAST);
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
    // Same plaintext, same passphrase, different ciphertext — no ECB-style leak.
    expect(a.ct).not.toBe(b.ct);
  });
});

describe("tamper detection", () => {
  async function tamper(mutate: (e: VaultEnvelope) => VaultEnvelope) {
    const envelope = await seal(PROFILE, "pw", FAST);
    return open(mutate({ ...envelope }), "pw");
  }

  it("rejects a modified ciphertext", async () => {
    await expect(
      tamper((e) => {
        const bytes = fromBase64(e.ct);
        bytes[0] ^= 0xff;
        return { ...e, ct: toBase64(bytes) };
      })
    ).rejects.toBeInstanceOf(WrongPassphraseError);
  });

  it("rejects a swapped IV", async () => {
    await expect(
      tamper((e) => ({ ...e, iv: toBase64(new Uint8Array(12)) }))
    ).rejects.toBeInstanceOf(WrongPassphraseError);
  });

  it("rejects a swapped salt", async () => {
    await expect(
      tamper((e) => ({ ...e, salt: toBase64(new Uint8Array(16)) }))
    ).rejects.toBeInstanceOf(WrongPassphraseError);
  });

  it("rejects an unsupported envelope version", async () => {
    const envelope = await seal(PROFILE, "pw", FAST);
    await expect(open({ ...envelope, v: 2 as 1 }, "pw")).rejects.toThrow(/Unsupported vault format/);
  });
});

describe("key derivation cost", () => {
  it("defaults to the OWASP floor for PBKDF2-HMAC-SHA256", () => {
    expect(KDF_ITERATIONS).toBeGreaterThanOrEqual(600_000);
  });

  it("records its parameters in the envelope so the cost can be raised later", async () => {
    const envelope = await seal(PROFILE, "pw", FAST);
    expect(envelope).toMatchObject({
      v: 1,
      kdf: "PBKDF2-SHA256",
      cipher: "AES-GCM",
      iterations: FAST,
    });
    // An envelope sealed at one cost still opens at that cost after the default moves.
    expect(await open(envelope, "pw")).toBe(PROFILE);
  });
});
