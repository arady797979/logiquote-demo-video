// Pushes the app's current Drizzle schema to the disposable local Postgres.
// APP_DIR points at a LogiQuote (Doc-fl) checkout with @logiquote/db built (npm run build -w @logiquote/db).
// Nothing is written there.
import { defineConfig } from "drizzle-kit";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const appDir = resolve(process.env.APP_DIR ?? "../Doc-fl");
const schemaDir = join(appDir, "packages/db/dist/schema");

export default defineConfig({
  schema: readdirSync(schemaDir)
    .filter((f) => f.endsWith(".js") && f !== "index.js")
    .map((f) => join(schemaDir, f)),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DEMO_PG_URL ?? "postgres://demo:demo@localhost:55432/logiquote_demo",
  },
});
