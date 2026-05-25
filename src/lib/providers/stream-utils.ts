// Helpers for consuming streaming HTTP responses from upstream AI providers.

// Yield each complete line from a streaming response body, decoded as UTF-8.
// Used by the OpenAI/Groq/Anthropic SSE formats and Ollama's NDJSON.
export async function* lines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).replace(/\r$/, '');
        buf = buf.slice(nl + 1);
        yield line;
      }
    }
  } finally {
    reader.releaseLock();
  }
  if (buf.length) yield buf;
}

// Walk OpenAI-shaped SSE lines (`data: { ... }` + `data: [DONE]`) and yield
// each parsed JSON payload. Skips empty lines and the [DONE] sentinel.
export async function* sseData(body: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  for await (const line of lines(body)) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      yield JSON.parse(payload);
    } catch {
      // Ignore malformed event line; provider may emit keepalives or comments.
    }
  }
}
