/**
 * DNS record formatters — the core token-efficiency layer.
 *
 * concise=true (default): Returns only the essential fields an LLM needs
 * to make decisions. This alone saves 60-80% of tokens vs. full Cloudflare
 * API responses which include zone_id, zone_name, meta, settings, etc.
 *
 * include_details=true: Returns the full record object.
 */

interface ConciseRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
  ttl: number | string;
  comment?: string;
  created_on?: string;
  modified_on?: string;
  [key: string]: unknown; // allow dynamic fields for MX priority, SRV data, etc.
}

/**
 * Formats a single DNS record for output.
 * When concise (default), strips all Cloudflare metadata.
 */
export function formatRecord(
  record: Record<string, unknown>,
  concise: boolean = true
): ConciseRecord | Record<string, unknown> {
  if (!concise) return record;

  const result: ConciseRecord = {
    id: String(record.id ?? ""),
    type: String(record.type ?? ""),
    name: String(record.name ?? ""),
    content: String(record.content ?? ""),
    ttl: record.ttl === 1 ? "auto" : Number(record.ttl ?? 0),
  };

  // Only include proxied for proxy-eligible types
  if (["A", "AAAA", "CNAME"].includes(result.type)) {
    result.proxied = Boolean(record.proxied);
  }

  // Include comment only if present
  if (record.comment) {
    result.comment = String(record.comment);
  }

  if (record.created_on) result.created_on = String(record.created_on);
  if (record.modified_on) result.modified_on = String(record.modified_on);

  // For MX, include priority
  if (result.type === "MX" && record.priority !== undefined) {
    result.priority = Number(record.priority);
  }

  // For SRV, include priority, weight, port
  if (result.type === "SRV" && record.data) {
    const data = record.data as Record<string, unknown>;
    result.priority = data.priority;
    result.weight = data.weight;
    result.port = data.port;
  }

  return result;
}

/**
 * Formats an array of DNS records.
 */
export function formatRecords(
  records: Record<string, unknown>[],
  concise: boolean = true
): Array<ConciseRecord | Record<string, unknown>> {
  return records.map((r) => formatRecord(r, concise));
}

/**
 * Builds a type-distribution summary for a set of records.
 * E.g. { A: 12, AAAA: 4, CNAME: 8, MX: 2, TXT: 6 }
 */
export function buildRecordSummary(records: Record<string, unknown>[]): {
  total: number;
  by_type: Record<string, number>;
  by_proxied: { proxied: number; dns_only: number };
} {
  const byType: Record<string, number> = {};
  let proxied = 0;
  let dnsOnly = 0;

  for (const r of records) {
    const type = String(r.type ?? "UNKNOWN");
    byType[type] = (byType[type] ?? 0) + 1;
    if (r.proxied) proxied++;
    else dnsOnly++;
  }

  return {
    total: records.length,
    by_type: byType,
    by_proxied: { proxied, dns_only: dnsOnly },
  };
}
