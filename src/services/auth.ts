import { randomBytes } from "node:crypto";

/**
 * Middleware logic for API key authentication on the HTTP transport.
 *
 * Reads CLOUDFLARE_DNS_MCP_API_KEY from env. If not set, auto-generates
 * a random 32-byte hex key and logs it to stderr on first access.
 */

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

  // Constant-time comparison to prevent timing attacks
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
