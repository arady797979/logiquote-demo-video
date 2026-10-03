import "dotenv/config";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { storyboardSchema, type Storyboard } from "../../src/schema.js";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const ASSETS = join(ROOT, "public/assets");
export const STORYBOARDS = ["storyboard.json", "storyboard.test.json"];

export function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : "true";
}

export function loadStoryboard(file = arg("storyboard") ?? "storyboard.json"): Storyboard {
  return storyboardSchema.parse(JSON.parse(readFileSync(join(ROOT, file), "utf8")));
}

export function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
  return v;
}

export function probeDuration(file: string): number {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return Number.parseFloat(out.trim());
}
