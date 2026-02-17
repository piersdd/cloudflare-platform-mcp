import { CHARACTER_LIMIT } from "../constants.js";

export interface PaginationMeta {
  total: number;
  count: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

/**
 * Builds a pagination metadata object from Cloudflare's result_info or
 * from a known total and current page of items.
 */
export function buildPaginationMeta(
  total: number,
  items: unknown[],
  page: number,
  perPage: number
): PaginationMeta {
  return {
    total,
    count: items.length,
    page,
    per_page: perPage,
    has_more: page * perPage < total,
  };
}

/**
 * Truncates a string response to CHARACTER_LIMIT and appends guidance.
 */
export function truncateIfNeeded(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;

  const truncated = text.slice(0, CHARACTER_LIMIT);
  const lastNewline = truncated.lastIndexOf("\n");
  const cleanCut = lastNewline > CHARACTER_LIMIT * 0.8 ? truncated.slice(0, lastNewline) : truncated;

  return (
    cleanCut +
    "\n\n--- TRUNCATED ---\nResponse exceeded token limit. Use `page`, `per_page`, or filter parameters (filter_type, filter_name) to narrow results."
  );
}

/**
 * Picks N random items from an array without replacement.
 */
export function randomSample<T>(items: T[], n: number): T[] {
  if (n >= items.length) return items;
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}
