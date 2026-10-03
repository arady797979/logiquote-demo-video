/**
 * Records each screen-scene flow: headed Chromium on Xvfb (1920x1080, 125% zoom) captured by ffmpeg x11grab.
 * Writes public/assets/screen/<flow>.mp4 and <flow>.events.json (click/type/focus boxes for auto-zoom).
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, type BrowserContext, type Locator, type Page } from "playwright";
import type { ScreenEvent } from "../src/schema.js";
import { flows } from "./flows/index.js";
import type { ActOpts, Actor, FlowEnv, RawEvent } from "./flows/types.js";
import { ASSETS, arg, ensureDir, loadStoryboard, probeDuration, requireEnv } from "./lib/common.js";

const W = 1920;
const H = 1080;
const DISPLAY = process.env.RECORD_DISPLAY ?? ":99";
const ZOOM = Number(process.env.RECORD_ZOOM ?? 1.25);
const outDir = ensureDir(join(ASSETS, "screen"));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Hide the Next.js dev-mode indicator when recording against `next dev`. */
const HIDE_DEV_OVERLAY_SCRIPT = `
(() => {
  const s = document.createElement('style');
  s.textContent = 'nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }';
  (document.head || document.documentElement).appendChild(s);
})();
`;

/** In-page cursor (x11grab can't see Playwright's synthetic pointer). */
const CURSOR_SCRIPT = `
(() => {
  const install = () => {
    if (document.getElementById('__demo_cursor')) return;
    const c = document.createElement('div');
    c.id = '__demo_cursor';
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28"><path d="M4 2 L4 22 L9.5 17 L13 25 L16.5 23.5 L13 15.8 L20.5 15.8 Z" fill="white" stroke="#0b1220" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0px', top: '0px', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(-4px,-2px)', transition: 'transform 90ms ease-out', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.45))' });
    document.documentElement.appendChild(c);
    const pos = window.__demoCursorPos || { x: innerWidth / 2, y: innerHeight / 2 };
    c.style.left = pos.x + 'px'; c.style.top = pos.y + 'px';
    addEventListener('mousemove', (e) => { window.__demoCursorPos = { x: e.clientX, y: e.clientY }; c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => { c.style.transform = 'translate(-4px,-2px) scale(0.82)'; }, true);
    addEventListener('mouseup', () => { c.style.transform = 'translate(-4px,-2px)'; }, true);
    const s = document.createElement('style');
    s.textContent = '*{cursor:none!important} ::-webkit-scrollbar{display:none} html{scrollbar-width:none;scroll-behavior:smooth}';
    document.head.appendChild(s);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();`;

function startXvfb(): ChildProcess | undefined {
  if (process.env.RECORD_USE_EXISTING_DISPLAY === "true") return undefined;
  const lock = `/tmp/.X${DISPLAY.replace(":", "")}-lock`;
  if (existsSync(lock)) return undefined;
  return spawn("Xvfb", [DISPLAY, "-screen", "0", `${W}x${H}x24`, "-nolisten", "tcp", "-ac"], { stdio: "ignore" });
}

class RecordingActor implements Actor {
  events: RawEvent[] = [];
  private mouse = { x: W / 2 / ZOOM, y: H / 2 / ZOOM };
  constructor(private page: Page) {}

  private async box(target: Locator) {
    await target.scrollIntoViewIfNeeded();
    const b = await target.boundingBox();
    if (!b) throw new Error(`Element not visible: ${target}`);
    return b;
  }

  /** Eased, human-like cursor glide. */
  private async glide(x: number, y: number) {
    const from = { ...this.mouse };
    const dist = Math.hypot(x - from.x, y - from.y);
    const steps = Math.max(12, Math.min(40, Math.round(dist / 18)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      await this.page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
      await sleep(14);
    }
    this.mouse = { x, y };
  }

  private log(type: ScreenEvent["type"], b: { x: number; y: number; width: number; height: number }, opts: ActOpts = {}) {
    this.events.push({ at: Date.now(), type, x: b.x * ZOOM, y: b.y * ZOOM, w: b.width * ZOOM, h: b.height * ZOOM, ...opts });
  }

  async click(target: Locator, opts?: ActOpts) {
    const b = await this.box(target);
    await this.glide(b.x + b.width / 2, b.y + b.height / 2);
    await sleep(220);
    this.log("click", b, opts);
    await this.page.mouse.down();
    await sleep(70);
    await this.page.mouse.up();
  }

  async type(target: Locator, text: string, opts?: ActOpts) {
    const b = await this.box(target);
    await this.glide(b.x + Math.min(40, b.width / 2), b.y + b.height / 2);
    await sleep(200);
    this.log("type", b, { holdSec: text.length * 0.075 + 1, ...opts });
    await this.page.mouse.down();
    await this.page.mouse.up();
    for (const ch of text) {
      await this.page.keyboard.type(ch);
      await sleep(55 + Math.random() * 40);
    }
  }

  async focus(target: Locator, opts?: ActOpts) {
    const b = await this.box(target);
    await this.glide(b.x + b.width / 2, b.y + Math.min(b.height / 2, 60));
    this.log("focus", b, opts);
  }

  async scroll(dy: number) {
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      await this.page.mouse.wheel(0, dy / steps);
      await sleep(16);
    }
  }

  async pause(ms: number) {
    await sleep(ms);
  }
}

function startFfmpeg(out: string) {
  const ff = spawn(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-f", "x11grab", "-draw_mouse", "0", "-video_size", `${W}x${H}`, "-framerate", "30", "-i", `${DISPLAY}.0`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const done = new Promise<void>((resolve, reject) => ff.on("exit", (c) => (c === 0 || c === 255 ? resolve() : reject(new Error(`ffmpeg exited ${c}`)))));
  return {
    async stop() {
      ff.stdin.write("q");
      await done;
      return Date.now();
    },
  };
}

async function recordFlow(name: string, env: FlowEnv) {
  const flow = flows[name];
  if (!flow) throw new Error(`Unknown flow "${name}". Available: ${Object.keys(flows).join(", ")}`);
  // Persistent context so the kiosk window Chromium opens at launch is the one we drive and record.
  // Window size is in DIPs, so divide by the scale factor to fill the WxH display exactly.
  const userDataDir = mkdtempSync(join(tmpdir(), "lq-rec-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: null,
    colorScheme: "dark",
    env: { ...process.env, DISPLAY },
    ignoreDefaultArgs: ["--enable-automation"],
    args: [`--window-size=${Math.round(W / ZOOM)},${Math.round(H / ZOOM)}`, "--window-position=0,0", "--kiosk", `--force-device-scale-factor=${ZOOM}`, "--hide-scrollbars",
      "--disable-infobars", "--no-first-run", "--no-default-browser-check", "--disable-features=Translate,MediaRouter", "--disable-notifications"],
  });
  try {
    await guardMutations(context, env.allowMutations);
    await context.addInitScript(CURSOR_SCRIPT);
    await context.addInitScript(HIDE_DEV_OVERLAY_SCRIPT);
    const page = context.pages()[0] ?? (await context.newPage());
    const path = await flow.start(page, env);
    await page.goto(env.baseUrl + path, { waitUntil: "networkidle" }).catch(() => page.goto(env.baseUrl + path));
    await flow.ready(page, env);
    await page.mouse.move((W / 2) / ZOOM, (H / 2) / ZOOM);
    await sleep(1200);

    const out = join(outDir, `${name}.mp4`);
    const actor = new RecordingActor(page);
    const rec = startFfmpeg(out);
    await sleep(300);
    await flow.run(page, actor, env);
    await sleep(700);
    const stoppedAt = await rec.stop();

    // ffmpeg's start-up latency is unknown; derive the true start from the final duration.
    const duration = probeDuration(out);
    const t0 = stoppedAt - duration * 1000;
    const events: ScreenEvent[] = actor.events.map(({ at, ...e }) => ({ ...e, t: Math.max(0, (at - t0) / 1000) }));
    writeFileSync(join(outDir, `${name}.events.json`), JSON.stringify(events, null, 2));
    console.log(`✓ ${name}.mp4  ${duration.toFixed(1)}s, ${events.length} events`);
  } finally {
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
}

/** tRPC mutations that only read or are needed for the story (Copilot chat). Everything else is blocked unless DEMO_ALLOW_MUTATIONS=true. */
const SAFE_MUTATIONS = new Set(["copilot.chat", "conversation.markRead", "sourcing.runCandidates"]);

async function guardMutations(context: BrowserContext, allow: boolean) {
  if (allow) return;
  await context.route("**/api/trpc/**", (route) => {
    const req = route.request();
    if (req.method() !== "POST") return route.continue();
    const procs = decodeURIComponent(new URL(req.url()).pathname.split("/api/trpc/")[1] ?? "").split(",");
    const blocked = procs.filter((p) => !SAFE_MUTATIONS.has(p));
    if (!blocked.length) return route.continue();
    console.warn(`! blocked mutation ${blocked.join(", ")} (set DEMO_ALLOW_MUTATIONS=true on a disposable DB to allow)`);
    return route.abort();
  });
}

const baseUrl = requireEnv("DEMO_URL").replace(/\/$/, "");
const env: FlowEnv = { baseUrl, threadId: process.env.DEMO_THREAD_ID || undefined, allowMutations: process.env.DEMO_ALLOW_MUTATIONS === "true" };
const only = arg("flow");
const sb = loadStoryboard();
const names = only ? [only] : [...new Set(sb.scenes.map((s) => s.flow).filter((f): f is string => Boolean(f)))];

const xvfb = startXvfb();
await sleep(800);
try {
  for (const name of names) await recordFlow(name, { ...env });
} finally {
  xvfb?.kill();
}
