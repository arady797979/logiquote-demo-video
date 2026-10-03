/**
 * Re-encodes a Remotion render in place for maximum playback compatibility:
 * limited-range yuv420p (Remotion's JPEG frames yield full-range yuvj420p, which many players reject),
 * BT.709 tags, H.264 High@4.1, faststart. Usage: tsx pipeline/finalize.ts out/file.mp4
 */
import { spawnSync } from "node:child_process";
import { renameSync } from "node:fs";

const file = process.argv[2];
if (!file) throw new Error("usage: finalize.ts <file.mp4>");
const tmp = file.replace(/\.mp4$/, ".tmp.mp4");
const r = spawnSync(
  "ffmpeg",
  [
    "-loglevel", "error", "-y", "-i", file,
    "-vf", "scale=in_range=full:out_range=tv,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-level", "4.1",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
    tmp,
  ],
  { stdio: "inherit" },
);
if (r.status !== 0) throw new Error(`ffmpeg failed (${r.status})`);
renameSync(tmp, file);
console.log(`✓ finalized ${file}`);
