/**
 * Optional: rewrite storyboard.json from input/plan.md with gemini-2.5-flash (structured JSON).
 * Writes to --out (default storyboard.draft.json) so your hand-edited storyboard is never overwritten.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GoogleGenAI } from "@google/genai";
import { storyboardSchema } from "../src/schema.js";
import { ROOT, arg, requireEnv } from "./lib/common.js";

const ai = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
const plan = readFileSync(join(ROOT, arg("plan") ?? "input/plan.md"), "utf8");
const targetSec = Number(arg("seconds") ?? 75);
const out = arg("out") ?? "storyboard.draft.json";
const flows = ["inbox", "quote", "copilot", "sourcing"];

const scene = {
  type: "object",
  properties: {
    id: { type: "string" },
    type: { type: "string", enum: ["title", "kinetic", "still", "screen", "stats", "end"] },
    durationSec: { type: "number" },
    caption: { type: "string" },
    headline: { type: "string" },
    subline: { type: "string" },
    lines: { type: "array", items: { type: "string" } },
    stats: { type: "array", items: { type: "object", properties: { value: { type: "number" }, suffix: { type: "string" }, label: { type: "string" } }, required: ["value", "label"] } },
    broll: { type: "object", properties: { query: { type: "string" }, pick: { type: "integer" } }, required: ["query"] },
    still: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] },
    flow: { type: "string", enum: flows },
    lowerThird: { type: "string" },
    cta: { type: "object", properties: { text: { type: "string" }, url: { type: "string" } }, required: ["text", "url"] },
  },
  required: ["id", "type", "durationSec"],
};

const prompt = `You write storyboards for a ${targetSec}-second B2B SaaS product video for LogiQuote. There is NO voiceover: on-screen captions and kinetic text carry the story.
Rules: scene durations sum to ${targetSec + 0.5 * 8}s (0.5s crossfades overlap); hook in the first 4s; exactly one CTA in the final "end" scene;
"screen" scenes must use one of these Playwright flows: ${flows.join(", ")}; captions ≤ 16 words; only claim features that appear in the plan below;
broll.query = short Pexels search (e.g. "aerial truck highway sunset"); still.prompt = abstract brand visual, no text.

PLAN:
${plan}`;

const res = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseJsonSchema: {
      type: "object",
      properties: { title: { type: "string" }, fps: { type: "integer" }, transitionSec: { type: "number" }, scenes: { type: "array", items: scene } },
      required: ["title", "scenes"],
    },
  },
});
const sb = storyboardSchema.parse(JSON.parse(res.text ?? "{}"));
writeFileSync(join(ROOT, out), JSON.stringify(sb, null, 2));
console.log(`✓ ${out} (${sb.scenes.length} scenes). Review, then copy over storyboard.json.`);
