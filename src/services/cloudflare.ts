import Cloudflare from "cloudflare";

let _client: Cloudflare | null = null;

/**
 * Returns a singleton Cloudflare SDK client.
 * Reads CLOUDFLARE_API_TOKEN from the environment.
 */
export function getClient(): Cloudflare {
  if (_client) return _client;

  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!apiToken) {
    throw new Error(
      "CLOUDFLARE_API_TOKEN environment variable is required. " +
        "Create a token at https://dash.cloudflare.com/profile/api-tokens with Zone:Read and DNS:Edit permissions."
    );
  }

  _client = new Cloudflare({ apiToken });
  return _client;
}

/**
 * Validates the API token on startup by calling the verify endpoint.
 * Returns the token status or throws with an actionable message.
 */
export async function validateToken(): Promise<{ status: string; id: string }> {
  const client = getClient();
  try {
    const result = await client.user.tokens.verify();
    if (result.status !== "active") {
      throw new Error(
        `API token is not active (status: ${result.status}). Create a new token at https://dash.cloudflare.com/profile/api-tokens`
      );
    }
    return { status: result.status, id: result.id };
  } catch (error) {
    if (error instanceof Error && error.message.includes("not active")) {
      throw error;
    }
    throw new Error(
      `Failed to verify API token: ${error instanceof Error ? error.message : String(error)}. ` +
        `Ensure CLOUDFLARE_API_TOKEN is a valid API token (not a global API key).`
    );
  }
}

/**
 * Resets the client singleton (useful for testing).
 */
export function resetClient(): void {
  _client = null;
}
