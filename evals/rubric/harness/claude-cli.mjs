/* eslint-disable -- eval-only harness run by Bun, outside the app lint rules. */
// Eval-only shim: runs one model call through the local Claude Code CLI (`claude -p`)
// instead of the Anthropic API. Never imported by production code.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';

/** Per-item context so concurrent eval items can read back their own raw model output. */
export const EVAL_CTX = new AsyncLocalStorage();

export const CALL_LOG = [];
// Empty cwd so no project CLAUDE.md or git context is picked up.
const CWD = mkdtempSync(join(tmpdir(), 'cli-eval-'));

function systemText(system) {
  if (!system) return '';
  if (typeof system === 'string') return system;
  return system
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n\n');
}

function hasNonText(messages) {
  return messages.some((m) => Array.isArray(m.content) && m.content.some((b) => b.type !== 'text'));
}

function flattenText(messages) {
  // Single-turn apps: join user text. Multi-turn is rendered as a transcript.
  if (messages.length === 1) {
    const c = messages[0].content;
    return typeof c === 'string'
      ? c
      : c
          .filter((b) => b.type === 'text')
          .map((b) => b.text)
          .join('\n\n');
  }
  return messages
    .map((m) => {
      const c =
        typeof m.content === 'string'
          ? m.content
          : m.content
              .filter((b) => b.type === 'text')
              .map((b) => b.text)
              .join('\n\n');
      return `${m.role.toUpperCase()}:\n${c}`;
    })
    .join('\n\n');
}

/**
 * req: { model, system, messages, schema (object|undefined), label }
 * returns { ok, structured, text, envelope, ms }
 */
export function callClaude({ model, system, messages, schema, label = '' }) {
  const args = [
    '-p',
    '--tools',
    '',
    '--strict-mcp-config',
    '--setting-sources',
    '',
    '--no-session-persistence',
    '--output-format',
    'json',
    '--system-prompt',
    systemText(system),
  ];
  if (model) args.push('--model', model);
  if (schema) args.push('--json-schema', JSON.stringify(schema));
  const multimodal = hasNonText(messages);
  let stdin;
  if (multimodal) {
    const i = args.indexOf('json');
    args[i] = 'stream-json';
    args.push('--input-format', 'stream-json', '--verbose');
    const content = messages[messages.length - 1].content;
    stdin = JSON.stringify({ type: 'user', message: { role: 'user', content } }) + '\n';
  } else {
    stdin = flattenText(messages);
  }
  const t0 = Date.now();
  return new Promise((resolve) => {
    const p = spawn('claude', args, {
      cwd: CWD,
      env: { ...process.env, CLAUDE_CODE_DISABLE_CLAUDE_MDS: '1' },
    });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.stdin.end(stdin);
    p.on('close', (code) => {
      const ms = Date.now() - t0;
      let env = null;
      try {
        env = JSON.parse(out);
      } catch {}
      if (!env && multimodal) {
        // stream-json input can still emit a single json result; be lenient
        for (const line of out.trim().split('\n')) {
          try {
            const o = JSON.parse(line);
            if (o.type === 'result') env = o;
          } catch {}
        }
      }
      const usage = env?.usage
        ? {
            input_tokens: env.usage.input_tokens,
            output_tokens: env.usage.output_tokens,
            cache_read_input_tokens: env.usage.cache_read_input_tokens,
            cache_creation_input_tokens: env.usage.cache_creation_input_tokens,
            thinking_tokens: env.usage.output_tokens_details?.thinking_tokens,
          }
        : null;
      const models = env?.modelUsage ? Object.keys(env.modelUsage) : [];
      const rec = {
        label,
        ms,
        exit: code,
        is_error: env?.is_error ?? true,
        result_head: (env?.result ?? err ?? '').slice(0, 300),
        models,
        usage,
        cost_usd_list: env?.total_cost_usd ?? null,
        num_turns: env?.num_turns,
      };
      CALL_LOG.push(rec);
      // Only an error envelope can mean a usage limit; model output may legitimately mention "rate limit".
      const limitHit =
        (!env || env.is_error) &&
        /usage limit|rate limit|limit reached|out of extra usage/i.test((env?.result ?? '') + err);
      if (limitHit) {
        rec.limit_hit = true;
      }
      resolve({
        ok: !!env && !env.is_error,
        structured: env?.structured_output ?? null,
        text: env?.result ?? '',
        envelope: env,
        ms,
        rec,
        limitHit,
      });
    });
  });
}

/** Minimal drop-in for the parts of @anthropic-ai/sdk the apps use. */
class APIError extends Error {}
class AuthenticationError extends APIError {}
class RateLimitError extends APIError {}
class APIConnectionError extends APIError {}

export default class Anthropic {
  static APIError = APIError;
  static AuthenticationError = AuthenticationError;
  static RateLimitError = RateLimitError;
  static APIConnectionError = APIConnectionError;
  constructor(_opts) {
    this.messages = {
      create: async (req) => {
        const schema = req.output_config?.format?.schema;
        const canned = EVAL_CTX.getStore()?.canned;
        if (canned) {
          // Offline adversarial check: no CLI call, feed a fixed hostile response to the app's post-processing.
          EVAL_CTX.getStore().last = { structured: canned, rec: null };
          return {
            stop_reason: 'end_turn',
            content: [{ type: 'text', text: JSON.stringify(canned) }],
          };
        }
        const r = await callClaude({
          model: process.env.EVAL_MODEL || req.model,
          system: req.system,
          messages: req.messages,
          schema,
          label: EVAL_CTX.getStore()?.label || '',
        });
        if (r.limitHit) {
          const e = new RateLimitError('CLI usage limit');
          throw e;
        }
        if (!r.ok) throw new APIError('CLI error: ' + r.text.slice(0, 200));
        const ctx = EVAL_CTX.getStore();
        if (ctx) {
          ctx.last = { structured: r.structured, rec: r.rec };
        }
        const text = r.structured ? JSON.stringify(r.structured) : r.text;
        return {
          stop_reason: 'end_turn',
          content: [{ type: 'text', text }],
          usage: r.rec.usage,
          model: r.rec.models[0],
        };
      },
    };
  }
}
export { APIError, AuthenticationError, RateLimitError, APIConnectionError };
