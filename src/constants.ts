/** Maximum characters in a single tool response before truncation. */
export const CHARACTER_LIMIT = 25_000;

/** Default number of records per page (lower than CF's 100 to save tokens). */
export const DEFAULT_PER_PAGE = 50;

/** Default random sample size. */
export const DEFAULT_SAMPLE_SIZE = 5;

/** Minimum fields returned in concise mode for a DNS record. */
export const CONCISE_RECORD_FIELDS = [
  "id",
  "type",
  "name",
  "content",
  "proxied",
  "ttl",
  "created_on",
  "modified_on",
] as const;

/** Minimum fields returned in concise mode for a zone. */
export const CONCISE_ZONE_FIELDS = [
  "id",
  "name",
  "status",
  "name_servers",
  "created_on",
  "modified_on",
] as const;

/** All DNS record types supported by Cloudflare. */
export const DNS_RECORD_TYPES = [
  "A",
  "AAAA",
  "CAA",
  "CERT",
  "CNAME",
  "DNSKEY",
  "DS",
  "HTTPS",
  "LOC",
  "MX",
  "NAPTR",
  "NS",
  "PTR",
  "SMIMEA",
  "SRV",
  "SSHFP",
  "SVCB",
  "TLSA",
  "TXT",
  "URI",
] as const;

export type DnsRecordType = (typeof DNS_RECORD_TYPES)[number];
