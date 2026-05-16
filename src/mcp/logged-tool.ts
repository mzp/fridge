import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodRawShape } from "zod";
import { logger } from "@/logger/mcp.js";

const SUMMARY_LIMIT = 200;

function summarize(result: unknown): string {
  const text = (result as { content?: Array<{ text?: unknown }> } | null)?.content?.[0]?.text;
  if (typeof text !== "string") return "";
  return text.length > SUMMARY_LIMIT ? `${text.slice(0, SUMMARY_LIMIT)}…` : text;
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { value: String(err) };
}

export function loggedTool<Args extends ZodRawShape>(
  server: McpServer,
  name: string,
  description: string,
  paramsSchema: Args,
  cb: ToolCallback<Args>,
): void {
  const wrapped = (async (...args: Parameters<ToolCallback<Args>>) => {
    const [input] = args;
    const started = Date.now();
    try {
      const result = await (cb as (...a: unknown[]) => unknown)(...args);
      logger.info(
        {
          tool: name,
          params: input,
          duration_ms: Date.now() - started,
          summary: summarize(result),
        },
        "mcp_tool_ok",
      );
      return result;
    } catch (err) {
      logger.error(
        {
          tool: name,
          params: input,
          duration_ms: Date.now() - started,
          err: serializeError(err),
        },
        "mcp_tool_err",
      );
      throw err;
    }
  }) as ToolCallback<Args>;

  server.tool(name, description, paramsSchema, wrapped);
}
