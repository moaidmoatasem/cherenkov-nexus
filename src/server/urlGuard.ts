/**
 * One SSRF guard, shared by every endpoint that fetches a user-supplied URL.
 *
 * There were two, and they disagreed. `/api/scrape` checked a hostname string
 * blocklist; `/api/ats/job` checked a shorter one that omitted the private
 * ranges entirely. Both missed the same things:
 *
 *   - IPv6 literals other than `::1`, including IPv4-mapped (`::ffff:127.0.0.1`)
 *   - decimal, octal and hex IPv4 encodings (`http://2130706433/` is localhost)
 *   - the rest of 127.0.0.0/8, and 0.0.0.0/8
 *   - link-local 169.254.0.0/16 beyond the single metadata address
 *   - carrier-grade NAT 100.64.0.0/10
 *   - any DNS name that *resolves* to a private address, which is the whole
 *     technique — a public hostname is not a public destination
 *   - redirects: only the first URL was checked, and fetch follows by default
 *
 * A string blocklist cannot fix the last two. The address has to be resolved
 * and checked, and every hop has to be checked, so this module does both.
 */

import { lookup } from "node:dns/promises";

export type UrlRejection =
  | "invalid_url"
  | "unsupported_scheme"
  | "private_address"
  | "unresolvable"
  | "too_many_redirects";

export interface UrlCheckOk {
  ok: true;
  url: URL;
  /** Addresses the hostname resolved to, for the audit trail. */
  addresses: string[];
}

export interface UrlCheckFail {
  ok: false;
  reason: UrlRejection;
  message: string;
}

export type UrlCheck = UrlCheckOk | UrlCheckFail;

export function isUrlAllowed(check: UrlCheck): check is UrlCheckOk {
  return check.ok === true;
}

/** Injectable so the guard is testable without touching real DNS. */
export type Resolver = (hostname: string) => Promise<string[]>;

export const dnsResolver: Resolver = async (hostname) => {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((r) => r.address);
};

// ─────────────────────────────────────────────────────────────────────────────
// Address classification
// ─────────────────────────────────────────────────────────────────────────────

function ipv4ToInt(address: string): number | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value >>> 0;
}

/** CIDR blocks that must never be reachable from a user-supplied URL. */
const BLOCKED_V4: Array<[string, number, string]> = [
  ["0.0.0.0", 8, "this network"],
  ["10.0.0.0", 8, "private"],
  ["100.64.0.0", 10, "carrier-grade NAT"],
  ["127.0.0.0", 8, "loopback"],
  ["169.254.0.0", 16, "link-local, includes cloud metadata"],
  ["172.16.0.0", 12, "private"],
  ["192.0.0.0", 24, "IETF protocol assignments"],
  ["192.168.0.0", 16, "private"],
  ["198.18.0.0", 15, "benchmarking"],
  ["224.0.0.0", 4, "multicast"],
  ["240.0.0.0", 4, "reserved"],
];

export function classifyIpv4(address: string): string | null {
  const value = ipv4ToInt(address);
  if (value === null) return null;
  for (const [base, bits, label] of BLOCKED_V4) {
    const baseValue = ipv4ToInt(base);
    if (baseValue === null) continue;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    if ((value & mask) === (baseValue & mask)) return label;
  }
  return null;
}

export function classifyIpv6(address: string): string | null {
  const lower = address.toLowerCase().replace(/^\[|\]$/g, "");

  // IPv4-mapped and IPv4-compatible forms carry a v4 address inside a v6
  // literal — `::ffff:127.0.0.1` reaches loopback and reads as v6.
  const mapped = lower.match(/^::(?:ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return classifyIpv4(mapped[1]);

  if (lower === "::" ) return "unspecified";
  if (lower === "::1") return "loopback";
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return "link-local";
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return "unique local";
  if (/^ff[0-9a-f]{2}:/.test(lower)) return "multicast";
  return null;
}

/** Returns a human label when the address is not publicly routable. */
export function classifyAddress(address: string): string | null {
  return address.includes(":") ? classifyIpv6(address) : classifyIpv4(address);
}

// ─────────────────────────────────────────────────────────────────────────────
// The guard
// ─────────────────────────────────────────────────────────────────────────────

export interface GuardOptions {
  resolver?: Resolver;
  /** Schemes permitted. Anything else — file:, gopher:, data: — is rejected. */
  allowedSchemes?: string[];
}

/**
 * Validate a single URL: scheme, then the addresses its host resolves to.
 *
 * DNS is resolved rather than pattern-matched, because `evil.example.com`
 * pointing at 127.0.0.1 is the attack a hostname blocklist cannot see.
 */
export async function checkUrl(raw: string, options: GuardOptions = {}): Promise<UrlCheck> {
  const { resolver = dnsResolver, allowedSchemes = ["http:", "https:"] } = options;

  // Parse as given first. Unconditionally prefixing "https://" onto anything
  // that does not start with "http" defeats the scheme check below — it turns
  // `data:text/plain,x` into a URL whose protocol reads as https.
  // Only fall back to prefixing when the input genuinely carries no scheme.
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    try {
      url = new URL(`https://${raw}`);
    } catch {
      return { ok: false, reason: "invalid_url", message: "That is not a valid URL." };
    }
  }

  if (!allowedSchemes.includes(url.protocol)) {
    return {
      ok: false,
      reason: "unsupported_scheme",
      message: `Only ${allowedSchemes.join(" and ")} URLs are accepted; got ${url.protocol}`,
    };
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  // A bare IP literal needs no resolution — and must not get a DNS round trip
  // that could fail open.
  const literal = classifyAddress(hostname);
  if (literal) {
    return {
      ok: false,
      reason: "private_address",
      message: `${hostname} is a ${literal} address; requests to internal networks are refused.`,
    };
  }

  // If it parsed as an IP at all, it is public and there is nothing to resolve.
  const isLiteral = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
  if (isLiteral) return { ok: true, url, addresses: [hostname] };

  let addresses: string[];
  try {
    addresses = await resolver(hostname);
  } catch {
    return {
      ok: false,
      reason: "unresolvable",
      message: `${hostname} could not be resolved.`,
    };
  }

  if (addresses.length === 0) {
    return { ok: false, reason: "unresolvable", message: `${hostname} resolved to no addresses.` };
  }

  // Every address, not just the first. A host with one public and one private
  // A-record is still a way in.
  for (const address of addresses) {
    const label = classifyAddress(address);
    if (label) {
      return {
        ok: false,
        reason: "private_address",
        message: `${hostname} resolves to ${address}, a ${label} address; requests to internal networks are refused.`,
      };
    }
  }

  return { ok: true, url, addresses };
}

/**
 * Fetch a user-supplied URL with every hop checked.
 *
 * Redirects are followed manually so each `Location` is validated before it is
 * requested. The original guards checked only the URL the user typed, and
 * `fetch` follows redirects by default — so a public host answering `302
 * http://169.254.169.254/` walked straight past them.
 */
export async function safeFetch(
  raw: string,
  init: RequestInit = {},
  options: GuardOptions & { maxRedirects?: number; fetchImpl?: typeof fetch } = {}
): Promise<Response> {
  const { maxRedirects = 5, fetchImpl = fetch, ...guard } = options;

  let target = raw;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const check = await checkUrl(target, guard);
    if (!isUrlAllowed(check)) throw new Error(check.message);

    const response = await fetchImpl(check.url.toString(), { ...init, redirect: "manual" });

    const isRedirect = response.status >= 300 && response.status < 400;
    if (!isRedirect) return response;

    const location = response.headers.get("location");
    if (!location) return response;

    target = new URL(location, check.url).toString();
  }

  throw new Error(`Too many redirects (more than ${maxRedirects}).`);
}
