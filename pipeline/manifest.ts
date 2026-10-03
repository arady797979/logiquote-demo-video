/** Scans public/assets and writes manifest.json, which Remotion reads at render time. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Manifest, ScreenEvent } from "../src/schema.js";
import { ASSETS, STORYBOARDS, loadStoryboard, probeDuration } from "./lib/common.js";

const manifest: Manifest = { scenes: {} };
const rel = (p: string) => `assets/${p}`;

for (const file of STORYBOARDS) {
  const sb = loadStoryboard(file);
  for (const scene of sb.scenes) {
    const entry: Manifest["scenes"][string] = {};
    if (scene.broll) {
      const p = `broll/${scene.id}-${scene.broll.pick}.mp4`;
      if (existsSync(join(ASSETS, p))) {
        entry.broll = rel(p);
        entry.brollDurationSec = probeDuration(join(ASSETS, p));
      }
    }
    if (scene.still) {
      const p = `stills/${scene.id}.png`;
      if (existsSync(join(ASSETS, p))) entry.still = rel(p);
    }
    if (scene.flow) {
      const p = `screen/${scene.flow}.mp4`;
      if (existsSync(join(ASSETS, p))) {
        entry.screen = rel(p);
        entry.screenDurationSec = probeDuration(join(ASSETS, p));
        const ev = join(ASSETS, `screen/${scene.flow}.events.json`);
        if (existsSync(ev)) entry.events = JSON.parse(readFileSync(ev, "utf8")) as ScreenEvent[];
      }
    }
    manifest.scenes[scene.id] = entry;
  }
}
if (existsSync(join(ASSETS, "music/track.mp3"))) manifest.music = rel("music/track.mp3");

writeFileSync(join(ASSETS, "manifest.json"), JSON.stringify(manifest, null, 2));
const missing = Object.entries(manifest.scenes).filter(([, a]) => Object.keys(a).length === 0).map(([id]) => id);
console.log(`manifest.json written (${Object.keys(manifest.scenes).length} scenes${manifest.music ? ", music" : ", no music"})`);
if (missing.length) console.log(`  using fallbacks for: ${missing.join(", ")}`);
