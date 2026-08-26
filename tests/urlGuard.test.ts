import { describe, it, expect, vi } from "vitest";
import {
  checkUrl,
  classifyAddress,
  isUrlAllowed,
  safeFetch,
  type Resolver,
} from "../src/server/urlGuard";

/** Resolver that always answers with the given addresses. */
const resolves = (...addresses: string[]): Resolver => async () => addresses;
const publicDns = resolves("93.184.216.34");

async function reject(raw: string, resolver: Resolver = publicDns) {
  const result = await checkUrl(raw, { resolver });
  expect(isUrlAllowed(result), `${raw} must be rejected`).toBe(false);
  return result;
}

describe("address classification", () => {
  it("catches every loopback form, not just 127.0.0.1", () => {
    for (const a of ["127.0.0.1", "127.0.0.2", "127.1.2.3", "127.255.255.254"]) {
      expect(classifyAddress(a), a).toBe("loopback");
    }
  });

  it("catches the private ranges in full", () => {
    expect(classifyAddress("10.0.0.1")).toBe("private");
    expect(classifyAddress("172.16.0.1")).toBe("private");
    expect(classifyAddress("172.31.255.254")).toBe("private");
    expect(classifyAddress("192.168.1.1")).toBe("private");
  });

  it("catches link-local beyond the single metadata address", () => {
    expect(classifyAddress("169.254.169.254")).toContain("link-local");
    expect(classifyAddress("169.254.0.1")).toContain("link-local");
  });

  it("catches ranges both original guards missed entirely", () => {
    expect(classifyAddress("0.0.0.0")).toBe("this network");
    expect(classifyAddress("100.64.0.1")).toBe("carrier-grade NAT");
  });

  it("catches IPv6 loopback and IPv4-mapped loopback", () => {
    expect(classifyAddress("::1")).toBe("loopback");
    expect(classifyAddress("::ffff:127.0.0.1")).toBe("loopback");
    expect(classifyAddress("::ffff:169.254.169.254")).toContain("link-local");
  });

  it("catches IPv6 unique-local and link-local", () => {
    expect(classifyAddress("fd00::1")).toBe("unique local");
    expect(classifyAddress("fe80::1")).toBe("link-local");
  });

  it("passes genuinely public addresses", () => {
    for (const a of ["93.184.216.34", "8.8.8.8", "2606:2800:220:1::1"]) {
      expect(classifyAddress(a), a).toBeNull();
    }
  });
});

describe("scheme handling", () => {
  it("refuses non-http schemes", async () => {
    for (const raw of ["file:///etc/passwd", "gopher://x/", "data:text/plain,hi"]) {
      expect((await reject(raw)).ok).toBe(false);
    }
  });

  it("accepts http and https", async () => {
    expect(isUrlAllowed(await checkUrl("http://example.com", { resolver: publicDns }))).toBe(true);
    expect(isUrlAllowed(await checkUrl("https://example.com", { resolver: publicDns }))).toBe(true);
  });
});

describe("literal addresses", () => {
  it("refuses private literals without a DNS round trip", async () => {
    const resolver = vi.fn(async () => ["93.184.216.34"]) as unknown as Resolver;
    await reject("http://127.0.0.1/", resolver);
    await reject("http://169.254.169.254/latest/meta-data/", resolver);
    await reject("http://[::1]/", resolver);
    expect((resolver as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it("allows a public literal", async () => {
    expect(isUrlAllowed(await checkUrl("http://93.184.216.34/"))).toBe(true);
  });
});

describe("DNS is resolved, not pattern-matched", () => {
  /**
   * The technique a hostname blocklist cannot see: the name is public, the
   * address it points at is not.
   */
  it("refuses a public hostname that resolves to loopback", async () => {
    const result = await reject("https://evil.example.com/", resolves("127.0.0.1"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("127.0.0.1");
  });

  it("refuses when any one of several addresses is private", async () => {
    await reject("https://mixed.example.com/", resolves("93.184.216.34", "10.0.0.5"));
  });

  it("refuses a host that resolves to nothing", async () => {
    const result = await checkUrl("https://void.example.com/", { resolver: resolves() });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unresolvable");
  });

  it("refuses a host whose resolution throws", async () => {
    const result = await checkUrl("https://nx.example.com/", {
      resolver: async () => {
        throw new Error("ENOTFOUND");
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unresolvable");
  });

  it("reports the addresses it cleared, for the audit trail", async () => {
    const result = await checkUrl("https://example.com/", { resolver: publicDns });
    if (isUrlAllowed(result)) expect(result.addresses).toEqual(["93.184.216.34"]);
  });
});

describe("safeFetch validates every hop", () => {
  function redirectTo(location: string) {
    return new Response(null, { status: 302, headers: { location } });
  }

  it("returns a non-redirect response directly", async () => {
    const fetchImpl = vi.fn(async () => new Response("ok", { status: 200 })) as unknown as typeof fetch;
    const res = await safeFetch("https://example.com/", {}, { resolver: publicDns, fetchImpl });
    expect(res.status).toBe(200);
  });

  /**
   * The gap that made the original guards ineffective: they checked the first
   * URL, then let `fetch` follow redirects unchecked.
   */
  it("refuses a redirect into the metadata service", async () => {
    const fetchImpl = vi.fn(async () =>
      redirectTo("http://169.254.169.254/latest/meta-data/")
    ) as unknown as typeof fetch;

    await expect(
      safeFetch("https://benign.example.com/", {}, { resolver: publicDns, fetchImpl })
    ).rejects.toThrow(/link-local|internal networks/i);
  });

  it("refuses a redirect to a public host that resolves privately", async () => {
    const fetchImpl = vi.fn(async () => redirectTo("https://evil.example.com/")) as unknown as typeof fetch;
    const resolver: Resolver = async (host) =>
      host === "evil.example.com" ? ["10.0.0.1"] : ["93.184.216.34"];

    await expect(
      safeFetch("https://benign.example.com/", {}, { resolver, fetchImpl })
    ).rejects.toThrow(/internal networks/i);
  });

  it("follows an allowed redirect", async () => {
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call += 1;
      return call === 1 ? redirectTo("https://elsewhere.example.com/") : new Response("landed", { status: 200 });
    }) as unknown as typeof fetch;

    const res = await safeFetch("https://example.com/", {}, { resolver: publicDns, fetchImpl });
    expect(await res.text()).toBe("landed");
  });

  it("stops after the redirect limit rather than looping", async () => {
    const fetchImpl = vi.fn(async () => redirectTo("https://example.com/next")) as unknown as typeof fetch;
    await expect(
      safeFetch("https://example.com/", {}, { resolver: publicDns, fetchImpl, maxRedirects: 3 })
    ).rejects.toThrow(/Too many redirects/);
  });

  it("never lets fetch follow redirects on its own", async () => {
    const fetchImpl = vi.fn(async () => new Response("ok", { status: 200 })) as unknown as typeof fetch;
    await safeFetch("https://example.com/", {}, { resolver: publicDns, fetchImpl });
    const init = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(init.redirect).toBe("manual");
  });
});
