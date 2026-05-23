import pino, { type Logger, multistream, type StreamEntry } from "pino";
import pretty from "pino-pretty";
import { fileDestination, isProductionEnv, isTestEnv, logFilename } from "@/logger/base.js";

export const logger: Logger = (() => {
  if (isTestEnv()) {
    return pino({ base: null }, fileDestination(logFilename("web"), true));
  }
  if (isProductionEnv()) {
    return pino({ base: null }, fileDestination(logFilename("web"), false));
  }
  const streams: StreamEntry[] = [
    { stream: fileDestination(logFilename("web"), false) },
    { stream: pretty({ colorize: true, translateTime: "HH:MM:ss", singleLine: true }) },
  ];
  return pino({ base: null }, multistream(streams));
})();
