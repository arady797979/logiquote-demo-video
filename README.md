# LogiQuote demo video

Builds the LogiQuote product video from code (Remotion + Playwright). It lives outside the app repo and only talks to a running dashboard over `DEMO_URL`, so the app's dev and deploy stay untouched.

## Prerequisites

Node 20+, ffmpeg, Xvfb, Docker, and `npx playwright install chromium`.

## 12-second test cut

```bash
cp .env.example .env              # set DEMO_URL / DEMO_THREAD_ID
npm run test12                    # record → stock (skipped without PIXABAY_API_KEY or PEXELS_API_KEY) → render
# → out/logiquote_test12s.mp4
```

## Local demo backend (fictional data, nothing leaves the box)

`demo-env/` runs the real dashboard against a throwaway Postgres instead of Neon:

- `docker-compose.yml`: Postgres plus a local Neon HTTP proxy, so the dashboard's `@neondatabase/serverless` driver works unchanged.
- `neon-local.cjs`: preload that sends Neon HTTP queries to that proxy.
- `drizzle.config.ts`: pushes the app's current schema (`APP_DIR`, with `@logiquote/db` built).
- `seed.sql`: fictional customers, RFQ threads, quote, decision, tags and events.
- `mock-worker.mjs`: stands in for the Cloudflare Worker (Gmail thread bodies, canned Copilot reply). Every mutation is a no-op.

```bash
# in this repo
npm run demo:up
APP_DIR=../Doc-fl npm run demo:schema    # needs: npm run build -w @logiquote/db in Doc-fl
npm run demo:seed                        # re-run before each recording so timestamps read "4m ago"
npm run demo:worker                      # keep running (port 8787)

# in the Doc-fl checkout (no files changed there)
DATABASE_URL=postgres://demo:demo@db.localtest.me/logiquote_demo \
WORKER_API_URL=http://localhost:8787 DASHBOARD_API_SECRET=demo-local \
NODE_OPTIONS="--require $PWD/../logiquote-demo-video/demo-env/neon-local.cjs" \
npm run dev -w @logiquote/dashboard

# back here
DEMO_URL=http://localhost:3000 DEMO_THREAD_ID=thr-demo-1042 npm run test12
```

`npm run demo:down` deletes the database.

## Full video

`npm run studio` previews it. `npm run render` and `npm run render:vertical` render the full storyboard (`storyboard.json`).
