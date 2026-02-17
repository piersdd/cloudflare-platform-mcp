/**
 * Zone formatters — concise mode strips account info, plan details,
 * and other metadata that an LLM rarely needs for DNS operations.
 */

interface ConciseZone {
  id: string;
  name: string;
  status: string;
  name_servers: string[];
  created_on?: string;
  modified_on?: string;
}

/**
 * Formats a single zone for output.
 */
export function formatZone(
  zone: Record<string, unknown>,
  concise: boolean = true
): ConciseZone | Record<string, unknown> {
  if (!concise) return zone;

  return {
    id: String(zone.id ?? ""),
    name: String(zone.name ?? ""),
    status: String(zone.status ?? ""),
    name_servers: Array.isArray(zone.name_servers)
      ? (zone.name_servers as string[])
      : [],
    ...(zone.created_on ? { created_on: String(zone.created_on) } : {}),
    ...(zone.modified_on ? { modified_on: String(zone.modified_on) } : {}),
  };
}

/**
 * Formats an array of zones.
 */
export function formatZones(
  zones: Record<string, unknown>[],
  concise: boolean = true
): Array<ConciseZone | Record<string, unknown>> {
  return zones.map((z) => formatZone(z, concise));
}
