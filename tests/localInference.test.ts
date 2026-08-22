import { describe, it, expect, vi } from "vitest";
import {
  callLocalModel,
  chatCompletionsUrl,
  isLocalFailure,
  shouldRouteLocal,
  stripJsonFence,
} from "../src/server/localInference";

const REQ = {
  endpoint: "http://localhost:11434/v1",
  model: "qwen2.5-coder:7b-instruct",
  systemPrompt: "system",
  userPrompt: "user",
};

function respond(body: unknown, init: { status?: number; statusText?: string } = {}) {
  return vi.fn(async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status: init.status ?? 200,
      statusText: init.statusText ?? "",
      headers: { "Content-Type": "application/json" },
    })
  ) as unknown as typeof fetch;
}

describe("shouldRouteLocal", () => {
  it("routes local when the provider is local", () => {
    expect(shouldRouteLocal({ provider: "local" })).toBe(true);
  });

  it("routes local when the caller asks for the local model", () => {
    expect(shouldRouteLocal({ useLocalModel: true })).toBe(true);
  });

  /**
   * The frontend never sent this flag, so the server's PII route was dead code
   * and hybrid mode always resolved to cloud.
   */
  it("routes local whenever the payload is marked sensitive", () => {
    expect(shouldRouteLocal({ containsSensitiveData: true })).toBe(true);
    expect(shouldRouteLocal({ provider: "hybrid", containsSensitiveData: true })).toBe(true);
    expect(shouldRouteLocal({ provider: "gemini", containsSensitiveData: true })).toBe(true);
  });

  it("stays on cloud only when nothing asks for local", () => {
    expect(shouldRouteLocal({ provider: "gemini" })).toBe(false);
    expect(shouldRouteLocal({ provider: "hybrid" })).toBe(false);
    expect(shouldRouteLocal({})).toBe(false);
  });

  it("treats absent flags as absent rather than truthy", () => {
    expect(shouldRouteLocal({ useLocalModel: false, containsSensitiveData: false })).toBe(false);
  });
});

describe("chatCompletionsUrl", () => {
  it("appends the path when it is missing", () => {
    expect(chatCompletionsUrl("http://localhost:11434/v1")).toBe(
      "http://localhost:11434/v1/chat/completions"
    );
  });

  it("tolerates a trailing slash", () => {
    expect(chatCompletionsUrl("http://localhost:11434/v1/")).toBe(
      "http://localhost:11434/v1/chat/completions"
    );
  });

  it("leaves a full path alone", () => {
    const full = "http://localhost:1234/v1/chat/completions";
    expect(chatCompletionsUrl(full)).toBe(full);
  });
});

describe("callLocalModel never reports success it did not get", () => {
  it("returns the completion on a well-formed response", async () => {
    const fetchImpl = respond({ choices: [{ message: { content: '{"ok":true}' } }] });
    const result = await callLocalModel(REQ, fetchImpl);
    expect(result).toEqual({ ok: true, content: '{"ok":true}' });
  });

  /**
   * The exact defect. Ollama answers 404 when the model has not been pulled.
   * That is not an exception, so the old code fell past its own catch and into
   * the cloud branch carrying the sensitive payload.
   */
  it("fails closed on a 404 from a reachable endpoint", async () => {
    const fetchImpl = respond({ error: "model not found" }, { status: 404, statusText: "Not Found" });
    const result = await callLocalModel(REQ, fetchImpl);
    expect(result.ok).toBe(false);
    if (isLocalFailure(result)) {
      expect(result.reason).toContain("404");
      expect(result.reason).toContain("qwen2.5-coder:7b-instruct");
    }
  });

  it("fails closed on every other non-2xx status", async () => {
    for (const status of [400, 401, 403, 429, 500, 502, 503]) {
      const result = await callLocalModel(REQ, respond({}, { status }));
      expect(result.ok, `status ${status} must not report success`).toBe(false);
    }
  });

  it("fails closed when the host is unreachable", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    const result = await callLocalModel(REQ, fetchImpl);
    expect(result.ok).toBe(false);
    if (isLocalFailure(result)) expect(result.reason).toMatch(/unreachable/i);
  });

  it("fails closed on a non-JSON body", async () => {
    const fetchImpl = vi.fn(async () => new Response("<html>proxy error</html>", { status: 200 })) as unknown as typeof fetch;
    const result = await callLocalModel(REQ, fetchImpl);
    expect(result.ok).toBe(false);
    if (isLocalFailure(result)) expect(result.reason).toMatch(/not JSON/i);
  });

  it("fails closed on a 200 with no completion text", async () => {
    for (const body of [{}, { choices: [] }, { choices: [{ message: {} }] }, { choices: [{ message: { content: "   " } }] }]) {
      const result = await callLocalModel(REQ, respond(body));
      expect(result.ok, `${JSON.stringify(body)} must not report success`).toBe(false);
    }
  });

  it("sends an Authorization header only when a key is configured", async () => {
    const withKey = respond({ choices: [{ message: { content: "x" } }] });
    await callLocalModel({ ...REQ, apiKey: "secret" }, withKey);
    const headers = (withKey as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers.Authorization).toBe("Bearer secret");

    const withoutKey = respond({ choices: [{ message: { content: "x" } }] });
    await callLocalModel(REQ, withoutKey);
    const bare = (withoutKey as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(bare.Authorization).toBeUndefined();
  });

  it("posts to the local endpoint and nowhere else", async () => {
    const fetchImpl = respond({ choices: [{ message: { content: "x" } }] });
    await callLocalModel(REQ, fetchImpl);
    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(1);
    expect(String(calls[0][0])).toBe("http://localhost:11434/v1/chat/completions");
    expect(String(calls[0][0])).not.toMatch(/googleapis|google|generativelanguage/i);
  });
});

describe("stripJsonFence", () => {
  it("removes a ```json fence", () => {
    expect(stripJsonFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("removes a bare fence", () => {
    expect(stripJsonFence('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("leaves unfenced JSON untouched", () => {
    expect(stripJsonFence('{"a":1}')).toBe('{"a":1}');
  });
});
