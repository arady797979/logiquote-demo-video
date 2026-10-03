/** Downloads up to 3 Pexels candidates per b-roll scene → public/assets/broll/<scene>-<n>.mp4 (+ credits.json). */
import { createWriteStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ASSETS, arg, ensureDir, loadStoryboard, requireEnv } from "./lib/common.js";

type PexelsFile = { link: string; width: number; height: number; file_type: string };
type PexelsVideo = { id: number; url: string; duration: number; width: number; user: { name: string; url: string }; video_files: PexelsFile[] };

const key = requireEnv("PEXELS_API_KEY");
const sb = loadStoryboard();
const only = arg("scene");
const force = arg("force") === "true";
const dir = ensureDir(join(ASSETS, "broll"));
const creditsPath = join(ASSETS, "credits.json");
const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, "utf8")) : { broll: {}, music: null };

for (const scene of sb.scenes) {
  if (!scene.broll || (only && scene.id !== only)) continue;
  const url = new URL("https://api.pexels.com/videos/search");
  url.search = new URLSearchParams({ query: scene.broll.query, orientation: "landscape", size: "large", per_page: "20" }).toString();
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`);
  const { videos } = (await res.json()) as { videos: PexelsVideo[] };
  const picks = videos
    .filter((v) => v.duration >= scene.durationSec + 1 && v.width >= 1920)
    .map((v) => {
      const files = v.video_files.filter((f) => f.file_type === "video/mp4" && f.width >= 1920).sort((a, b) => a.width - b.width);
      return { v, file: files[0] };
    })
    .filter((x) => x.file)
    .slice(0, 3);
  if (!picks.length) console.warn(`! ${scene.id}: no ≥1080p clips ≥${scene.durationSec}s for "${scene.broll.query}"`);
  for (const [i, { v, file }] of picks.entries()) {
    const out = join(dir, `${scene.id}-${i + 1}.mp4`);
    if (existsSync(out) && !force) continue;
    const dl = await fetch(file.link);
    if (!dl.ok || !dl.body) throw new Error(`download failed ${file.link}`);
    await pipeline(Readable.fromWeb(dl.body as never), createWriteStream(out));
    credits.broll[`${scene.id}-${i + 1}`] = { source: "Pexels", page: v.url, author: v.user.name, authorUrl: v.user.url };
    console.log(`✓ ${scene.id}-${i + 1}  ${v.url}`);
  }
}
writeFileSync(creditsPath, JSON.stringify(credits, null, 2));
console.log("Pick a candidate per scene via storyboard `broll.pick` (preview in `npm run studio`).");
