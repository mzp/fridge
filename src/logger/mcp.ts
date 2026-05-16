import pino, { type Logger } from "pino";
import { fileDestination, isTestEnv, logFilename } from "@/logger/base.js";

export const logger: Logger = pino(
  { base: null },
  fileDestination(logFilename("mcp"), isTestEnv()),
);
