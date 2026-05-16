import type { MiddlewareHandler } from "hono";
import { logger } from "@/logger/web.js";

const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { value: String(err) };
}

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const started = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  let body: unknown;
  if (STATE_CHANGING.has(method)) {
    try {
      body = await c.req.parseBody();
    } catch {
      body = "<unparseable>";
    }
  }

  try {
    await next();
    logger.info(
      {
        method,
        path,
        status: c.res.status,
        duration_ms: Date.now() - started,
        ...(body === undefined ? {} : { body }),
      },
      "web_req",
    );
  } catch (err) {
    logger.error(
      {
        method,
        path,
        duration_ms: Date.now() - started,
        ...(body === undefined ? {} : { body }),
        err: serializeError(err),
      },
      "web_err",
    );
    throw err;
  }
};
