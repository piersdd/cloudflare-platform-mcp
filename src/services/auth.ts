import { randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Authentication for the HTTP transport.
 *
 * Two independent auth layers:
 *
 * 1. **Bearer token** (remote / tunnel access):
 *    Set `MCP_API_TOKEN` env var.  Every HTTP request must include
 *    `Authorization: Bearer <token>`.  If the env var is unset or empty,
 *    bearer auth is disabled — localhost-only setups work without config.
 *
 * 2. **X-API-Key** (existing, local convenience):
 *    Set `CLOUDFLARE_DNS_MCP_API_KEY` env var (or let it auto-generate).
 *    Checked via `X-API-Key` header or `?api_key=` query param.
 *    Only enforced when bearer auth is *not* active.
 */

// ─── Bearer token auth (MCP_API_TOKEN) ──────────────────────────

let _bearerToken: string | null | undefined = undefined; // undefined = not yet checked

export function getBearerToken(): string | null {
  if (_bearerToken !== undefined) return _bearerToken;
  const token = (process.env.MCP_API_TOKEN || "").trim();
  _bearerToken = token || null;
  return _bearerToken;
}

/**
 * Validate an Authorization: Bearer header value against MCP_API_TOKEN.
 * Returns true if valid, false if invalid. Returns null if bearer auth
 * is not configured (caller should fall through to other auth).
 */
export function validateBearerToken(authHeader: string | null | undefined): boolean | null {
  const expected = getBearerToken();
  if (!expected) return null; // Bearer auth not configured

  if (!authHeader) return false;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  const provided = match[1];
  return safeCompare(provided, expected);
}

// ─── X-API-Key auth (CLOUDFLARE_DNS_MCP_API_KEY) ────────────────

let _apiKey: string | null = null;

export function getOrCreateApiKey(): string {
  if (_apiKey) return _apiKey;

  const envKey = process.env.CLOUDFLARE_DNS_MCP_API_KEY;
  if (envKey && envKey.length >= 16) {
    _apiKey = envKey;
    return _apiKey;
  }

  // Auto-generate and warn
  _apiKey = randomBytes(32).toString("hex");
  console.error(
    `\n⚠️  No CLOUDFLARE_DNS_MCP_API_KEY set. Auto-generated key:\n\n    ${_apiKey}\n\n` +
      `Set this in your environment to persist it:\n` +
      `  export CLOUDFLARE_DNS_MCP_API_KEY="${_apiKey}"\n`
  );
  return _apiKey;
}

/**
 * Validates a request's API key. Checks X-API-Key header first, then
 * falls back to ?api_key query parameter.
 *
 * Returns true if valid, false otherwise.
 */
export function validateApiKey(
  headerValue: string | null | undefined,
  queryValue: string | null | undefined
): boolean {
  const expected = getOrCreateApiKey();
  const provided = headerValue || queryValue;
  if (!provided) return false;

  return safeCompare(provided, expected);
}

// ─── Helpers ────────────────────────────────────────────────────

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
