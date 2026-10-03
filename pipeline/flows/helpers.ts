import type { Page } from "playwright";
import type { FlowEnv } from "./types.js";

/** Thread to feature: DEMO_THREAD_ID, else the first RFQ row in the inbox. */
export async function resolveThreadId(page: Page, env: FlowEnv): Promise<string> {
  if (env.threadId) return env.threadId;
  await page.goto(`${env.baseUrl}/inbox`);
  const open = page.getByRole("link", { name: "Open", exact: true }).first();
  await open.waitFor({ timeout: 30_000 });
  const href = await open.getAttribute("href");
  if (!href) throw new Error("No inbox threads found. Seed demo data or set DEMO_THREAD_ID.");
  return decodeURIComponent(href.replace(/^\/inbox\//, ""));
}

export const threadPath = (id: string) => `/inbox/${encodeURIComponent(id)}`;
