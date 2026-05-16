import { readdirSync, rmSync } from "node:fs";
import path from "node:path";

const LOG_DIR = "logs";

export function setup() {
  let entries: string[];
  try {
    entries = readdirSync(LOG_DIR);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.endsWith("-test.jsonl")) {
      rmSync(path.join(LOG_DIR, entry), { force: true });
    }
  }
}
