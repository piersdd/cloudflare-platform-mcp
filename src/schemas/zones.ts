import { z } from "zod";
import { OutputFlagsSchema, PaginationSchema } from "./common.js";

export const ListZonesSchema = OutputFlagsSchema.merge(PaginationSchema)
  .extend({
    filter_name: z
      .string()
      .optional()
      .describe("Filter zones by domain name (substring match)."),
    filter_status: z
      .enum(["active", "pending", "initializing", "moved", "deleted", "deactivated"])
      .optional()
      .describe("Filter zones by status."),
    filter_account_id: z
      .string()
      .optional()
      .describe("Filter zones by Cloudflare account ID."),
  })
  .strict();

export type ListZonesInput = z.infer<typeof ListZonesSchema>;

export const GetZoneSchema = z
  .object({
    zone_id: z
      .string()
      .optional()
      .describe("Zone ID (32-char hex). Provide either zone_id or zone_name."),
    zone_name: z
      .string()
      .optional()
      .describe("Domain name (e.g. 'example.com'). Looked up if zone_id not provided."),
  })
  .merge(OutputFlagsSchema)
  .strict()
  .refine((data) => data.zone_id || data.zone_name, {
    message: "Provide either zone_id or zone_name.",
  });

export type GetZoneInput = z.infer<typeof GetZoneSchema>;
