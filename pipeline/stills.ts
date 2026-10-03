/** Generates stills with gemini-2.5-flash-image → public/assets/stills/<scene>.png */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GoogleGenAI } from "@google/genai";
import { ASSETS, arg, ensureDir, loadStoryboard, requireEnv } from "./lib/common.js";

const ai = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
const sb = loadStoryboard();
const only = arg("scene");
const force = arg("force") === "true";
const dir = ensureDir(join(ASSETS, "stills"));
const style = "Brand palette: deep navy #070b14 background, emerald #27b07d and soft blue #4d8ff6 accents. Clean, premium, cinematic lighting. Absolutely no text, letters, logos or UI.";

for (const scene of sb.scenes) {
  if (!scene.still || (only && scene.id !== only)) continue;
  const out = join(dir, `${scene.id}.png`);
  if (existsSync(out) && !force) continue;
  const res = await ai.models.generateContent({
    model: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image",
    contents: `${scene.still.prompt}\n\n${style}`,
    config: { imageConfig: { aspectRatio: "16:9" } },
  });
  const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) throw new Error(`${scene.id}: no image returned`);
  writeFileSync(out, Buffer.from(part.inlineData.data, "base64"));
  console.log(`✓ ${scene.id}.png`);
}
