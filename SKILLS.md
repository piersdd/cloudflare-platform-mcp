---
name: cloudflare-dns
description: >
  Manage Cloudflare DNS records with extreme token efficiency. List zones,
  CRUD records (A, AAAA, CNAME, MX, TXT, SRV, CAA, NS, and more), bulk
  operations, BIND export, and record auditing — all with concise defaults
  that minimize context usage.
version: 1.0.0
author: Piers
triggers:
  - DNS
  - Cloudflare
  - domain
  - record
  - zone
  - nameserver
  - A record
  - AAAA
  - CNAME
  - MX
  - TXT
  - SRV
  - CAA
  - SPF
  - DKIM
  - DMARC
  - proxy
  - orange cloud
  - TTL
  - DNS migration
  - blue-green
  - BIND export
---

# Cloudflare DNS MCP Server — Skill Guide

## Quick Start

This server provides 10 tools prefixed with `cf_dns_`:

| Tool | Purpose | Read/Write |
|------|---------|------------|
| `cf_dns_list_zones` | List domains in your account | Read |
| `cf_dns_get_zone` | Get zone details by ID or name | Read |
| `cf_dns_list_records` | List/filter/audit DNS records | Read |
| `cf_dns_get_record` | Get a single record by ID | Read |
| `cf_dns_export_records` | Export zone as BIND file | Read |
| `cf_dns_create_record` | Create a DNS record | Write |
| `cf_dns_update_record` | Patch a DNS record | Write |
| `cf_dns_delete_record` | Delete (requires confirm=true) | Write |
| `cf_dns_bulk_create` | Create up to 100 records at once | Write |
| `cf_dns_bulk_update` | Update up to 100 records at once | Write |

## Token-Saving Strategies

Every tool defaults to **concise mode** — returning only the fields that matter
for decision-making (id, type, name, content, proxied, ttl). This saves 60-80%
of tokens compared to raw Cloudflare API responses.

### Use the right mode for the job

1. **summary_only=true** (most efficient) — Returns just counts and type
   distribution. Use when you need to understand a zone's shape without
   seeing individual records.

   ```
   cf_dns_list_records(zone_id="...", summary_only=true)
   → { summary: { total: 47, by_type: { A: 12, CNAME: 18, MX: 2, TXT: 15 }, by_proxied: { proxied: 20, dns_only: 27 } } }
   ```

2. **random_sample=true** — Returns N random records for quick auditing.
   Avoids fetching hundreds of records when you just need a representative
   sample.

   ```
   cf_dns_list_records(zone_id="...", random_sample=true, sample_size=5)
   ```

3. **Filtered pagination** (default) — Use filters to narrow before paginating:
   ```
   cf_dns_list_records(zone_id="...", filter_type="CNAME", filter_name="www")
   ```

4. **include_details=true** — Only when you need full Cloudflare metadata
   (tags, meta, settings). Rarely needed.

### General principles

- Always filter by type/name when you know what you're looking for
- Use `per_page=20` for exploratory work, `per_page=100` when you need more
- Prefer `summary_only` first, then drill down into specific record types
- When auditing, use `random_sample` before fetching everything

## Workflows

### 1. Provision a New Web Service

Set up DNS for a new service at `app.example.com`:

```
Step 1: Find the zone
  cf_dns_list_zones(filter_name="example.com")

Step 2: Create the A record (or CNAME)
  cf_dns_create_record(zone_id="...", type="A", name="app", content="203.0.113.10", proxied=true)

Step 3: Verify
  cf_dns_list_records(zone_id="...", filter_name="app")
```

### 2. Blue-Green Deployment Switch

Flip traffic from blue (203.0.113.10) to green (203.0.113.20):

```
Step 1: Find the record
  cf_dns_list_records(zone_id="...", filter_type="A", filter_name="app")

Step 2: Update content
  cf_dns_update_record(zone_id="...", record_id="...", content="203.0.113.20")

Step 3: Verify the change
  cf_dns_get_record(zone_id="...", record_id="...")
```

### 3. Complete Email Setup (MX + SPF + DKIM + DMARC)

```
cf_dns_bulk_create(zone_id="...", records=[
  { type: "MX", name: "@", content: "mx1.mail.example.com", priority: 10 },
  { type: "MX", name: "@", content: "mx2.mail.example.com", priority: 20 },
  { type: "TXT", name: "@", content: "v=spf1 include:_spf.google.com ~all" },
  { type: "TXT", name: "google._domainkey", content: "v=DKIM1; k=rsa; p=MIG..." },
  { type: "TXT", name: "_dmarc", content: "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com" }
])
```

### 4. Bulk DNS Migration

Move records from one zone to another:

```
Step 1: Export source zone
  cf_dns_export_records(zone_id="SOURCE_ZONE_ID")
  (Save the BIND output for reference)

Step 2: List all records from source
  cf_dns_list_records(zone_id="SOURCE_ZONE_ID", per_page=500, include_details=true)

Step 3: Bulk create in target zone
  cf_dns_bulk_create(zone_id="TARGET_ZONE_ID", records=[...adapted records...])

Step 4: Verify with summary
  cf_dns_list_records(zone_id="TARGET_ZONE_ID", summary_only=true)
```

### 5. DNS Record Audit

Check what's in a zone and find potential issues:

```
Step 1: Get the overview
  cf_dns_list_records(zone_id="...", summary_only=true)

Step 2: Check for unproxied A/AAAA records (potential IP exposure)
  cf_dns_list_records(zone_id="...", filter_type="A", filter_proxied=false)

Step 3: Sample TXT records for stale entries
  cf_dns_list_records(zone_id="...", filter_type="TXT", random_sample=true, sample_size=10)

Step 4: Verify MX records are correct
  cf_dns_list_records(zone_id="...", filter_type="MX")
```

### 6. Subdomain Cleanup

Find and remove old subdomains:

```
Step 1: List all CNAME records
  cf_dns_list_records(zone_id="...", filter_type="CNAME")

Step 2: Identify stale records (check content targets)

Step 3: Delete with confirmation
  cf_dns_delete_record(zone_id="...", record_id="...", confirm=true)
```

## Best Practices

### TTL

- Use `ttl=1` (auto) for proxied records — Cloudflare manages the TTL
- Use `ttl=300` (5 min) for records you might change soon
- Use `ttl=3600` (1 hour) for stable records
- Use `ttl=86400` (24 hours) for records that rarely change (MX, NS)

### Proxy Status

- **Proxied (orange cloud)**: A, AAAA, CNAME records that serve web traffic.
  Enables Cloudflare CDN, WAF, DDoS protection. Hides origin IP.
- **DNS only (grey cloud)**: MX, TXT, SRV, and any record where you need
  direct IP resolution (e.g., mail servers, SSH, game servers).
- CNAME records for third-party services should generally be proxied=false
  unless the service explicitly supports Cloudflare proxy.

### Safety

- Always use `cf_dns_get_record` before `cf_dns_delete_record` to verify
- The delete tool requires `confirm=true` — this is non-negotiable
- Use `cf_dns_export_records` to backup before bulk changes
- Bulk operations are sequential — if one fails, others already applied persist

### Record Type Reference

| Type | Use Case | Content Format |
|------|----------|----------------|
| A | IPv4 address | `192.0.2.1` |
| AAAA | IPv6 address | `2001:db8::1` |
| CNAME | Alias to another hostname | `other.example.com` |
| MX | Mail server (needs priority) | `mail.example.com` |
| TXT | SPF, DKIM, DMARC, verification | `"v=spf1 ..."` |
| SRV | Service discovery (use data field) | structured |
| CAA | Certificate authority auth | structured |
| NS | Nameserver delegation | `ns1.example.com` |
| PTR | Reverse DNS | `host.example.com` |

## Troubleshooting

### "401 Unauthorized"
Your API token is invalid or expired. Create a new one at
https://dash.cloudflare.com/profile/api-tokens with **Zone:Read** and
**DNS:Edit** permissions.

### "403 Forbidden"
Your token doesn't have permission for this zone. Edit the token to include
the target zone or use "All zones" scope.

### "409 Conflict"
A record with that name and type already exists. Use `cf_dns_list_records`
with `filter_name` and `filter_type` to find it, then update instead of create.

### "429 Rate Limited"
Cloudflare allows 1,200 API requests per 5-minute window. If doing bulk
operations, use `cf_dns_bulk_create` / `cf_dns_bulk_update` instead of
individual calls. Wait 60 seconds and retry.

### Proxied record showing wrong IP
Proxied records return Cloudflare's edge IPs, not your origin. This is normal.
Use `include_details=true` to see the actual origin content.
