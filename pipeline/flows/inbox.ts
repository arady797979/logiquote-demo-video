import type { Flow } from "./types.js";
import { resolveThreadId, threadPath } from "./helpers.js";

/** Inbox list → open RFQ thread → Extracted tab → Quote tab. */
export const inbox: Flow = {
  async start(page, env) {
    const id = await resolveThreadId(page, env);
    env.threadId = id;
    return "/inbox";
  },
  async ready(page, env) {
    // Warm-up off camera: open the thread once via client-side navigation so the case is cached,
    // then go back. The recorded click then renders instantly instead of flashing "Loading case…".
    const open = page.locator(`a[href="${threadPath(env.threadId!)}"]`).first();
    await open.click();
    await page.getByRole("button", { name: "Extracted", exact: true }).waitFor();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.goBack();
    await page.getByRole("link", { name: "Open", exact: true }).first().waitFor();
  },
  async run(page, act, env) {
    await act.pause(400);
    const open = page.locator(`a[href="${threadPath(env.threadId!)}"]`).first();
    await act.focus(open.locator("xpath=ancestor::tr"), { holdSec: 0.9, zoom: 1.35 });
    await act.click(open, { holdSec: 0.5 });
    const extracted = page.getByRole("button", { name: "Extracted", exact: true });
    await extracted.waitFor();
    await act.pause(500);
    await act.click(extracted, { holdSec: 0.4 });
    await act.focus(page.locator("aside").last(), { holdSec: 1.6, zoom: 1.4 });
    await act.pause(900);
    await act.click(page.getByRole("button", { name: "Quote", exact: true }), { holdSec: 0.4 });
    await act.focus(page.locator("aside").last(), { holdSec: 1.8, zoom: 1.4 });
    await act.pause(1200);
  },
};
