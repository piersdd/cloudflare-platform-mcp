import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerZoneTools } from "./tools/zones.js";
import { registerRecordReadTools } from "./tools/records-read.js";
import { registerRecordWriteTools } from "./tools/records-write.js";
import { registerBulkTools } from "./tools/records-bulk.js";

/**
 * Creates and configures the MCP server with all DNS tools registered.
 *
 * 10 tools total:
 *   Read:  cf_dns_list_zones, cf_dns_get_zone, cf_dns_list_records,
 *          cf_dns_get_record, cf_dns_export_records
 *   Write: cf_dns_create_record, cf_dns_update_record, cf_dns_delete_record
 *   Bulk:  cf_dns_bulk_create, cf_dns_bulk_update
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "cloudflare-dns-mcp-server",
    version: "1.0.0",
  });

  registerZoneTools(server);
  registerRecordReadTools(server);
  registerRecordWriteTools(server);
  registerBulkTools(server);

  return server;
}
