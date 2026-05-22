import { mkdirSync } from "node:fs";
import path from "node:path";
import pino from "pino";

const LOG_DIR = "logs";

export function isTestEnv(): boolean {
  return process.env["NODE_ENV"] === "test" || process.env["VITEST"] === "true";
}

export function isProductionEnv(): boolean {
  return process.env["NODE_ENV"] === "production";
}

export function logFilename(base: string): string {
  if (isTestEnv()) return `${base}-test.jsonl`;
  if (isProductionEnv()) return `${base}-production.jsonl`;
  return `${base}.jsonl`;
}

export function fileDestination(filename: string, sync: boolean) {
  mkdirSync(LOG_DIR, { recursive: true });
  return pino.destination({
    dest: path.join(LOG_DIR, filename),
    sync,
    mkdir: true,
  });
}
