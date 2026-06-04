import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodRawShape } from "zod";
import { logger } from "@/logger/mcp.js";

const SUMMARY_LIMIT = 200;

// Tools return only their structured payload; the text content (for backwards
// compatibility and logging) is derived from it here, so there is a single
// hand-maintained representation per tool.
export type StructuredResult = { structuredContent: Record<string, unknown> };

function summarize(structuredContent: Record<string, unknown>): string {
  const text = JSON.stringify(structuredContent);
  return text.length > SUMMARY_LIMIT ? `${text.slice(0, SUMMARY_LIMIT)}…` : text;
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { value: String(err) };
}

export function loggedTool<Args extends ZodRawShape, Out extends ZodRawShape>(
  server: McpServer,
  name: string,
  description: string,
  inputSchema: Args,
  outputSchema: Out,
  cb: (...args: Parameters<ToolCallback<Args>>) => StructuredResult | Promise<StructuredResult>,
): void {
  const wrapped = (async (...args: Parameters<ToolCallback<Args>>) => {
    const [input] = args;
    const started = Date.now();
    try {
      const { structuredContent } = await cb(...args);
      logger.info(
        {
          tool: name,
          params: input,
          duration_ms: Date.now() - started,
          summary: summarize(structuredContent),
        },
        "mcp_tool_ok",
      );
      return {
        structuredContent,
        content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }],
      };
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

  server.registerTool(name, { description, inputSchema, outputSchema }, wrapped);
}
