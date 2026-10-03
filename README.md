# LogiQuote demo video

The LogiQuote product video, built as code. Playwright records the **real dashboard**. Remotion (React/TypeScript) then combines those recordings with branded motion graphics, stock footage and captions, and renders an MP4. When the UI changes, re-record and re-render with one command.

> This repo is deliberately **separate from the app** (`Doc-fl`). It isn't an npm workspace of the app, never imports app code, and isn't part of the app's dev or deploy. It only talks to a running dashboard through `DEMO_URL`.

**Sample:** [`samples/logiquote_test12s.mp4`](samples/logiquote_test12s.mp4) is the approved 12-second test cut.

---

## Contents

- [How it works](#how-it-works)
- [Requirements](#requirements)
- [Quick start: 12 s test cut](#quick-start-12-s-test-cut)
- [Local demo backend (fictional data)](#local-demo-backend-fictional-data)
- [Commands](#commands)
- [Storyboards](#storyboards)
- [Screen recordings](#screen-recordings)
- [Stock footage, stills, music](#stock-footage-stills-music)
- [Rendering](#rendering)
- [Going from the 12 s test to the full demo](#going-from-the-12-s-test-to-the-full-demo)
- [Project layout](#project-layout)
- [Licensing](#licensing)

---

## How it works

```
storyboard.json ─┬─► record.ts ─► public/assets/screen/<flow>.mp4 + <flow>.events.json   (Playwright + Xvfb + ffmpeg x11grab)
 (source of      ├─► stock.ts ──► public/assets/broll/<scene>-<n>.mp4 + credits.json     (direct links, or Pixabay/Pexels search)
  truth)         ├─► stills.ts ─► public/assets/stills/<scene>.png                        (optional, Gemini image)
                 └─► manifest.ts ─► public/assets/manifest.json                            (what exists → what Remotion uses)
                                   │
                                   ▼
               Remotion (src/) ─► out/*.mp4 ─► finalize.ts (yuv420p, AAC, faststart: plays everywhere)
```

- **Real UI only.** Screen scenes show recordings of the actual dashboard. Each click/focus is logged with its on-screen box, and Remotion uses those boxes to auto-zoom and draw a click ripple.
- **Every asset is optional.** Missing b-roll or stills fall back to an animated brand route map, and a missing recording shows a placeholder frame. A render always succeeds.
- **No voiceover for now.** Captions and kinetic text carry the story.

## Requirements

- Node 20+
- ffmpeg, Xvfb (`sudo apt install ffmpeg xvfb`)
- Playwright Chromium: `npx playwright install chromium`
- Docker (only for the local demo backend)

```bash
npm install
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `DEMO_URL` | Dashboard to record (local or staging). **Never production data.** |
| `DEMO_THREAD_ID` | Inbox thread to feature (default: first row). Demo seed uses `thr-demo-1042`. |
| `DEMO_ALLOW_MUTATIONS` | `false` (default) blocks every mutating tRPC call during recording. |
| `PIXABAY_API_KEY` / `PEXELS_API_KEY` | Optional: keyword search for b-roll. Not needed when the storyboard uses `broll.url`. |
| `GEMINI_API_KEY` | Optional: `storyboard.ts` and `stills.ts`. |
| `RECORD_DISPLAY`, `RECORD_ZOOM` | Xvfb display (`:99`) and page zoom (`1.25`). |

## Quick start: 12 s test cut

With a dashboard running (see the next section for a local one):

```bash
DEMO_URL=http://localhost:3000 DEMO_THREAD_ID=thr-demo-1042 npm run test12
# → out/logiquote_test12s.mp4
```

`test12` records the flows used in `storyboard.test.json`, downloads its b-roll, then renders the `Test12s` composition.

## Local demo backend (fictional data)

`demo-env/` runs the **real dashboard code** against a throwaway Postgres, so no Neon, Gmail or Cloudflare account is needed and no real customer data is involved. Nothing in `Doc-fl` is modified.

| File | Role |
| --- | --- |
| `docker-compose.yml` | Postgres 16 plus a local Neon HTTP proxy, so the dashboard's `@neondatabase/serverless` driver works unchanged |
| `neon-local.cjs` | `NODE_OPTIONS --require` preload that routes Neon HTTP queries to that proxy |
| `drizzle.config.ts` | Pushes the app's current Drizzle schema (from `Doc-fl/packages/db/dist`) |
| `seed.sql` | Fictional customers, RFQ threads, quote, decision, tags and pipeline events (Northline Foods, Chicago → Dallas, $2,318) |
| `mock-worker.mjs` | Stands in for the Cloudflare Worker on :8787: Gmail thread bodies plus a canned Copilot reply. All mutations are no-ops |

```bash
# 1. backend (this repo)
npm run demo:up
(cd ../Doc-fl && npm install && npm run build -w @logiquote/shared -w @logiquote/db -w @logiquote/sourcing)
APP_DIR=../Doc-fl npm run demo:schema
npm run demo:seed            # re-run before recording so timestamps read "4m ago"
npm run demo:worker          # keep running

# 2. dashboard (in the Doc-fl checkout, unchanged)
DATABASE_URL=postgres://demo:demo@db.localtest.me/logiquote_demo \
WORKER_API_URL=http://localhost:8787 DASHBOARD_API_SECRET=demo-local \
NODE_OPTIONS="--require $PWD/../logiquote-demo-video/demo-env/neon-local.cjs" \
NEXT_TELEMETRY_DISABLED=1 npm run dev -w @logiquote/dashboard

# 3. record + render (this repo)
DEMO_URL=http://localhost:3000 DEMO_THREAD_ID=thr-demo-1042 npm run test12

npm run demo:down            # removes the database
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run test12` | Record, fetch stock, render the 12 s test (`storyboard.test.json`) |
| `npm run full` | Record, fetch stock and stills, render 16:9 and 9:16 (`storyboard.json`) |
| `npm run record [-- --flow inbox] [-- --storyboard file]` | Re-record one or all flows |
| `npm run stock [-- --scene id] [-- --force true]` | Download b-roll |
| `npm run stills` | Generate stills with Gemini (optional) |
| `npm run storyboard` | Draft `storyboard.json` with Gemini (optional, then edit by hand) |
| `npm run studio` | Live preview and tweak in Remotion Studio |
| `npm run render` / `render:vertical` / `render:test` | Render `Demo16x9` / `Demo9x16` / `Test12s` |
| `npm run check` | Type-check |

## Storyboards

- `storyboard.test.json`: the 12 s test (title, inbox recording, end card).
- `storyboard.json`: the full ~75 s demo (hook, problem, reveal, inbox, quote, copilot, sourcing, stats, end).

Schema: [`src/schema.ts`](src/schema.ts). Scene types:

| `type` | Uses |
| --- | --- |
| `title` | `headline`, `subline`, `broll` |
| `kinetic` | `lines[]`, `broll` |
| `still` | `headline`, `subline`, `still.prompt` |
| `screen` | `flow`, `lowerThird`, `caption` |
| `stats` | `headline`, `stats[] {value, suffix?, label}` |
| `end` | `headline`, `cta {text, url}`, `broll` |

All scenes accept `durationSec` and `caption`. Consecutive scenes overlap by `transitionSec`, so total length = sum of durations − transitions.

## Screen recordings

`pipeline/record.ts` launches headed Chromium in kiosk mode on Xvfb at 1920×1080 with 125% zoom, then captures it with ffmpeg `x11grab`. Scrollbars and the Next.js dev indicator are hidden, and a soft cursor is drawn.

Flows live in `pipeline/flows/`, one per scene:

| Flow | Shows |
| --- | --- |
| `inbox` | Inbox → open RFQ → Extracted tab → Quote tab (pre-warmed so there's no loading flash) |
| `quote` | Thread sidecar: Quote breakdown → Decision rules → Approve button (focused, not clicked) |
| `copilot` | Quote Copilot: types a margin question and shows the drafted reply |
| `sourcing` | Sourcing → vendor registry → rate tables |

To write a new flow, use `act.click / act.type / act.focus / act.pause` (see `flows/types.ts`). Each `act.*` is logged for auto-zoom: `zoom` sets how far the camera pushes in and `holdSec` how long it stays.

**Safety:** unless `DEMO_ALLOW_MUTATIONS=true`, the recorder blocks every tRPC mutation except read-only ones (`copilot.chat`, `conversation.markRead`, `sourcing.runCandidates`). An accidental click can't approve a quote or send an email.

## Stock footage, stills, music

**B-roll:** set it per scene in the storyboard, in one of two ways:

```jsonc
"broll": { "url": "https://assets.mixkit.co/videos/52010/52010-1080.mp4", "page": "https://mixkit.co/free-stock-video/…-52010/" }  // direct link, no key
"broll": { "query": "aerial truck highway sunset", "pick": 1 }                                                                      // search (needs PIXABAY_API_KEY or PEXELS_API_KEY)
```

Sources are recorded in `public/assets/credits.json`. One colour grade is applied over every clip so they look like one shoot.

**Stills:** `npm run stills` with `GEMINI_API_KEY`. Without it, scenes use the animated route map.

**Music:** put a licensed track at `public/assets/music/track.mp3` (e.g. Pixabay Music, 100–120 BPM) and add its page URL to `credits.json`. It fades in and out automatically.

## Rendering

Renders go to `out/` at 1920×1080 (or 1080×1920 for vertical) and 30 fps. `finalize.ts` then re-encodes to H.264 High 4.1, `yuv420p`, AAC, with `+faststart`. Remotion's raw output is full-range `yuvj420p`, which many players won't open, so this step is what makes the file play everywhere.

## Going from the 12 s test to the full demo

The full storyboard and all four flows already exist and record against the demo backend. To finish:

1. Rewrite the copy in `storyboard.json` (headlines, captions, stats) with real claims.
2. Run `npm run full`, then review in `npm run studio` and tune `durationSec`, `zoom` and `holdSec`.
3. Optional: add a music track and stills (`GEMINI_API_KEY`).
4. Do a quality pass: watch with the sound off, check every UI moment is readable on a phone, and make sure no real customer data appears.

## Project layout

```
demo-env/            local disposable backend (Postgres, Neon proxy, seed, mock Worker)
pipeline/
  record.ts          Playwright + Xvfb + ffmpeg recorder (with mutation guard)
  flows/             one file per screen scene
  stock.ts           b-roll download (direct URL / Pixabay / Pexels)
  stills.ts          Gemini image stills (optional)
  storyboard.ts      Gemini storyboard draft (optional)
  manifest.ts        maps available assets to scenes for Remotion
  finalize.ts        broad-compatibility re-encode
src/
  Root.tsx           compositions: Demo16x9, Demo9x16, Test12s, Test12sVertical
  Demo.tsx           storyboard → TransitionSeries of scenes
  components/        TitleCard, KineticText, StillScene, ScreenScene, StatCounter, EndCard, Captions, Music, RouteMap…
  theme.ts           LogiQuote colours and fonts (matches the dashboard)
public/assets/       generated assets (gitignored except brand/ and music/README.md)
samples/             approved reference renders
storyboard.json      full demo
storyboard.test.json 12 s test
```

## Licensing

- **Remotion** is free for individuals and companies of up to 3 people. Larger companies need a company license (remotion.dev/license).
- **Mixkit** clips are under the Mixkit free license (commercial use allowed). Pixabay and Pexels are also free for commercial use. Sources are kept in `credits.json`.
- **Music:** keep the track page URL in `credits.json` in case of Content ID claims.
