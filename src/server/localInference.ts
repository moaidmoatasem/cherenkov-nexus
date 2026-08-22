/**
 * The zero-trust boundary.
 *
 * "PII must never hit a cloud LLM" is the project's first stated principle, and
 * for a long time it was enforced by the shape of one `if` statement buried in
 * a 1,900-line route handler:
 *
 *     if (localResponse.ok) { ...; return res.json(...) }
 *     // no else — a non-2xx response fell straight through to the cloud branch
 *
 * Ollama answers 404 when the requested model has not been pulled. That is not
 * an exception, so it did not reach the catch, so the request continued into
 * the Gemini branch carrying whatever the user had marked sensitive. Silently.
 *
 * This module exists so that boundary is a named unit with its own tests rather
 * than an implicit property of control flow someone can edit away.
 */

export interface LocalRoutingInputs {
  /** 'local' | 'gemini' | 'hybrid' */
  provider?: string;
  useLocalModel?: boolean;
  containsSensitiveData?: boolean;
}

/**
 * Whether this request must be served by local inference.
 *
 * Deliberately permissive: any signal that the caller wants local, or that the
 * payload is sensitive, routes local. The failure mode of routing local
 * unnecessarily is a slower response. The failure mode of the reverse is a
 * privacy breach, and they are not comparable.
 */
export function shouldRouteLocal(inputs: LocalRoutingInputs): boolean {
  const { provider, useLocalModel, containsSensitiveData } = inputs;
  if (provider === "local") return true;
  if (useLocalModel === true) return true;
  if (containsSensitiveData === true) return true;
  return false;
}

export interface LocalInferenceRequest {
  endpoint: string;
  model: string;
  apiKey?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export interface LocalInferenceSuccess {
  ok: true;
  content: string;
}

export interface LocalInferenceFailure {
  ok: false;
  reason: string;
}

export type LocalInferenceResult = LocalInferenceSuccess | LocalInferenceFailure;

/**
 * Explicit type guards rather than a bare `if (!result.ok)`.
 *
 * This project compiles without `strict`, so `strictNullChecks` is off and
 * TypeScript will not narrow a discriminated union on its discriminant. A
 * user-defined guard narrows regardless, which keeps the boundary type-safe
 * without requiring a repo-wide strictness change to land first.
 */
export function isLocalFailure(result: LocalInferenceResult): result is LocalInferenceFailure {
  return result.ok === false;
}

export function isLocalSuccess(result: LocalInferenceResult): result is LocalInferenceSuccess {
  return result.ok === true;
}

/** Normalise an endpoint into a chat-completions URL. */
export function chatCompletionsUrl(endpoint: string): string {
  return endpoint.includes("/chat/completions")
    ? endpoint
    : `${endpoint.replace(/\/$/, "")}/chat/completions`;
}

/**
 * Call a local OpenAI-compatible endpoint.
 *
 * Never throws, and never returns anything a caller could mistake for success.
 * Every failure — unreachable host, non-2xx status, unparseable body, empty
 * completion — comes back as `{ ok: false }` with a reason fit to show a user.
 *
 * The point of the total return type is that a caller cannot accidentally fall
 * through on failure: there is no path that leaves the result undefined.
 */
export async function callLocalModel(
  request: LocalInferenceRequest,
  fetchImpl: typeof fetch = fetch
): Promise<LocalInferenceResult> {
  const url = chatCompletionsUrl(request.endpoint);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(request.apiKey ? { Authorization: `Bearer ${request.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt },
        ],
        temperature: request.temperature ?? 0.2,
        stream: false,
      }),
    });
  } catch (err) {
    return {
      ok: false,
      reason: `Local endpoint ${url} was unreachable: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // The case that used to leak.
  if (!response.ok) {
    return {
      ok: false,
      reason:
        `Local endpoint ${url} returned ${response.status}${response.statusText ? ` ${response.statusText}` : ""}. ` +
        `If you are running Ollama, check the model "${request.model}" has been pulled.`,
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (err) {
    return {
      ok: false,
      reason: `Local endpoint ${url} returned a body that is not JSON: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const content = (payload as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]
    ?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    return {
      ok: false,
      reason: `Local endpoint ${url} returned no completion text.`,
    };
  }

  return { ok: true, content };
}

/** Strip markdown fencing a local model may wrap JSON in. */
export function stripJsonFence(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/, "")
    .trim();
}
