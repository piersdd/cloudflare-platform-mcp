# cloudflare-dns-mcp-server

A best-of-breed MCP server for Cloudflare DNS management. Designed for extreme token efficiency, full CRUD coverage, and easy deployment as both a local MCP server and a Cloudflare Worker.

## Features

- **10 DNS tools** covering zones, records, bulk operations, and BIND export
- **Token-efficient by default** — concise output strips 60-80% of Cloudflare API bloat
- **Summary mode** — get record counts + type distribution without fetching individual records
- **Random sampling** — audit large zones without loading everything
- **Safety gates** — deletes require explicit `confirm: true`
- **Dual transport** — stdio for Claude Desktop, Streamable HTTP for remote access
- **Worker-ready** — deploy to Cloudflare Workers with `npm run deploy`

## Quick Start

### 1. Create a Cloudflare API Token

Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) and create a token with:

- **Zone → Zone → Read**
- **Zone → DNS → Edit**
- Scope: All zones (or specific zones you want to manage)

### 2. Install

```bash
git clone https://github.com/piersdd/cloudflare-platform-mcp.git
cd cloudflare-platform-mcp
npm install
npm run build
```

### 3. Configure Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "cloudflare-dns": {
      "command": "node",
      "args": ["/path/to/cloudflare-platform-mcp/dist/index.js"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

Restart Claude Desktop. The server validates your token on startup.

## Tools

### Read Tools

| Tool | Description |
|------|-------------|
| `cf_dns_list_zones` | List zones with optional name/status/account filters |
| `cf_dns_get_zone` | Get zone by ID or domain name |
| `cf_dns_list_records` | List records with filters, pagination, summary mode, random sampling |
| `cf_dns_get_record` | Get a single record by ID |
| `cf_dns_export_records` | Export zone as BIND zonefile |

### Write Tools

| Tool | Description |
|------|-------------|
| `cf_dns_create_record` | Create any DNS record type (A, AAAA, CNAME, MX, TXT, SRV, CAA, etc.) |
| `cf_dns_update_record` | Partial update (PATCH) — only changed fields |
| `cf_dns_delete_record` | Delete with mandatory `confirm: true` safety gate |
| `cf_dns_bulk_create` | Create up to 100 records in one call |
| `cf_dns_bulk_update` | Update up to 100 records in one call |

## Token Efficiency

Every tool defaults to concise output. Here's what that means:

**Concise (default)** — only the fields an LLM needs:
```json
{ "id": "abc123", "type": "A", "name": "www.example.com", "content": "203.0.113.10", "proxied": true, "ttl": "auto" }
```

**Full Cloudflare response** (with `include_details=true`) — includes zone_id, zone_name, meta, settings, proxiable, locked, etc. ~5x more tokens.

### Efficiency Modes for `cf_dns_list_records`

| Mode | Tokens | Use Case |
|------|--------|----------|
| `summary_only=true` | ~50 | "How many records? What types?" |
| `random_sample=true` | ~200 | "Show me a few records to check" |
| Filtered + concise | ~500 | "Show me all CNAME records" |
| Full details | ~2500 | "I need all metadata for debugging" |

## Example Prompts

```
"List all my Cloudflare zones"
"Show me the DNS records for example.com"
"How many DNS records does example.com have, broken down by type?"
"Create an A record for app.example.com pointing to 203.0.113.10 with proxy enabled"
"Set up email DNS for example.com with Google Workspace MX records"
"Switch the A record for api.example.com from 10.0.0.1 to 10.0.0.2"
"Delete the old staging CNAME record"
"Export all DNS records for example.com as a BIND file"
"Audit example.com for unproxied A records that might expose our origin IP"
```

## HTTP Transport (Remote Access)

Run as an HTTP server instead of stdio:

```bash
TRANSPORT=http CLOUDFLARE_API_TOKEN=your-token node dist/index.js
```

The server starts on port 8787 (configurable via `PORT` env var). An API key is auto-generated and printed to stderr on first run. Set `CLOUDFLARE_DNS_MCP_API_KEY` to persist it.

**Endpoints:**
- `POST /mcp` — MCP Streamable HTTP (requires `X-API-Key` header)
- `GET /health` — Health check

### Remote MCP Client Config

```json
{
  "mcpServers": {
    "cloudflare-dns": {
      "url": "http://localhost:8787/mcp",
      "headers": {
        "X-API-Key": "your-mcp-api-key"
      }
    }
  }
}
```

## Deploy as a Cloudflare Worker

The same codebase deploys to Cloudflare Workers for always-on remote access:

```bash
# Set secrets
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put CLOUDFLARE_DNS_MCP_API_KEY

# Deploy
npm run deploy
```

Your MCP server is now at `https://cloudflare-dns-mcp.your-subdomain.workers.dev/mcp`.

### Public Exposure with Custom Domain

For production use behind a custom domain:

1. Add a custom domain in the Cloudflare dashboard for your Worker
2. TLS is automatic via Cloudflare's edge certificates
3. Optionally put it behind Cloudflare Access for SSO authentication

### Bearer Token Authentication

When exposing the server through a tunnel or reverse proxy, set `MCP_API_TOKEN` to require a bearer token on every request:

```bash
export MCP_API_TOKEN=your-secret-token-here
```

All HTTP requests must then include the header:

```
Authorization: Bearer your-secret-token-here
```

Requests without a valid token receive `401 Unauthorized`. If the env var is **unset or empty**, bearer auth is disabled and the server falls back to the existing `X-API-Key` mechanism (suitable for localhost-only access).

### Via Cloudflare Tunnel

For exposing a local instance:

```bash
cloudflared tunnel --url http://localhost:8787
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLOUDFLARE_API_TOKEN` | Yes | — | Cloudflare API token with Zone:Read + DNS:Edit |
| `TRANSPORT` | No | `stdio` | `stdio` or `http` |
| `PORT` | No | `8787` | HTTP server port (http transport only) |
| `MCP_API_TOKEN` | No | (none) | Bearer token for HTTP auth — if set, requires `Authorization: Bearer <token>` |
| `CLOUDFLARE_DNS_MCP_API_KEY` | No | auto-generated | API key for HTTP transport authentication (X-API-Key header) |

## Development

```bash
npm run dev          # stdio mode with auto-reload
npm run dev:http     # HTTP mode with auto-reload
npm run build        # Compile TypeScript
npm run typecheck    # Type-check without emitting
npm run deploy       # Build + deploy to Workers
```

## License

MIT
