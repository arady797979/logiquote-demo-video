/**
 * Downloads up to 3 b-roll candidates per scene → public/assets/broll/<scene>-<n>.mp4 (+ credits.json).
 * Uses Pixabay when PIXABAY_API_KEY is set, else Pexels (PEXELS_API_KEY). Without a key, scenes keep the route-map fallback.
 */
import { createWriteStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ASSETS, arg, ensureDir, loadStoryboard } from "./lib/common.js";

type Candidate = { file: string; page: string; author: string; authorUrl: string };
type Provider = { name: string; search(query: string, minSec: number): Promise<Candidate[]> };

type PexelsFile = { link: string; width: number; file_type: string };
type PexelsVideo = { url: string; duration: number; width: number; user: { name: string; url: string }; video_files: PexelsFile[] };

function pexels(key: string): Provider {
  return {
    name: "Pexels",
    async search(query, minSec) {
      const url = new URL("https://api.pexels.com/videos/search");
      url.search = new URLSearchParams({ query, orientation: "landscape", size: "large", per_page: "20" }).toString();
      const res = await fetch(url, { headers: { Authorization: key } });
      if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`);
      const { videos } = (await res.json()) as { videos: PexelsVideo[] };
      return videos
        .filter((v) => v.duration >= minSec && v.width >= 1920)
        .flatMap((v) => {
          const f = v.video_files.filter((x) => x.file_type === "video/mp4" && x.width >= 1920).sort((a, b) => a.width - b.width)[0];
          return f ? [{ file: f.link, page: v.url, author: v.user.name, authorUrl: v.user.url }] : [];
        });
    },
  };
}

type PixabayRendition = { url: string; width: number; height: number };
type PixabayHit = { pageURL: string; duration: number; user: string; user_id: number; videos: Record<"large" | "medium" | "small" | "tiny", PixabayRendition> };

function pixabay(key: string): Provider {
  return {
    name: "Pixabay",
    async search(query, minSec) {
      const url = new URL("https://pixabay.com/api/videos/");
      url.search = new URLSearchParams({ key, q: query.slice(0, 100), per_page: "30", safesearch: "true", order: "popular" }).toString();
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Pixabay ${res.status}: ${await res.text()}`);
      const { hits } = (await res.json()) as { hits: PixabayHit[] };
      return hits
        .filter((h) => h.duration >= minSec)
        .flatMap((h) => {
          const r = [h.videos.large, h.videos.medium].find((x) => x?.url && x.width >= 1920 && x.width > x.height);
          return r ? [{ file: r.url, page: h.pageURL, author: h.user, authorUrl: `https://pixabay.com/users/${h.user}-${h.user_id}/` }] : [];
        });
    },
  };
}

const provider = process.env.PIXABAY_API_KEY
  ? pixabay(process.env.PIXABAY_API_KEY)
  : process.env.PEXELS_API_KEY
    ? pexels(process.env.PEXELS_API_KEY)
    : null;
if (!provider) {
  console.warn("No PIXABAY_API_KEY or PEXELS_API_KEY: skipping b-roll download (scenes fall back to the animated route map).");
  process.exit(0);
}

const sb = loadStoryboard();
const only = arg("scene");
const force = arg("force") === "true";
const dir = ensureDir(join(ASSETS, "broll"));
const creditsPath = join(ASSETS, "credits.json");
const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, "utf8")) : { broll: {}, music: null };

for (const scene of sb.scenes) {
  if (!scene.broll || (only && scene.id !== only)) continue;
  const picks = (await provider.search(scene.broll.query, scene.durationSec + 1)).slice(0, 3);
  if (!picks.length) console.warn(`! ${scene.id}: no ≥1080p ${provider.name} clips ≥${scene.durationSec}s for "${scene.broll.query}"`);
  for (const [i, c] of picks.entries()) {
    const name = `${scene.id}-${i + 1}`;
    const out = join(dir, `${name}.mp4`);
    if (existsSync(out) && !force) continue;
    const dl = await fetch(c.file);
    if (!dl.ok || !dl.body) throw new Error(`download failed ${c.file}`);
    await pipeline(Readable.fromWeb(dl.body as never), createWriteStream(out));
    credits.broll[name] = { source: provider.name, page: c.page, author: c.author, authorUrl: c.authorUrl };
    console.log(`✓ ${name}  ${c.page}`);
  }
}
writeFileSync(creditsPath, JSON.stringify(credits, null, 2));
console.log("Pick a candidate per scene via storyboard `broll.pick` (preview in `npm run studio`).");
