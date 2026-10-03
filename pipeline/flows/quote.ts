import type { Flow } from "./types.js";
import { resolveThreadId, threadPath } from "./helpers.js";

/** Thread sidecar: Quote breakdown → Decision (policy rules) → Approve (only with DEMO_ALLOW_MUTATIONS). */
export const quote: Flow = {
  async start(page, env) {
    return threadPath(await resolveThreadId(page, env));
  },
  async ready(page) {
    await page.getByRole("button", { name: "Decision", exact: true }).waitFor();
  },
  async run(page, act, env) {
    await act.pause(500);
    await act.click(page.getByRole("button", { name: "Quote", exact: true }), { holdSec: 0.4 });
    await act.focus(page.locator("aside").last(), { holdSec: 2, zoom: 1.4 });
    await act.pause(1600);
    await act.click(page.getByRole("button", { name: "Decision", exact: true }), { holdSec: 0.4 });
    await act.focus(page.locator("aside").last(), { holdSec: 2, zoom: 1.4 });
    await act.pause(1500);
    const approve = page.getByRole("button", { name: /approve/i }).first();
    if (await approve.isVisible().catch(() => false)) {
      if (env.allowMutations) await act.click(approve, { holdSec: 1.4 });
      else await act.focus(approve, { holdSec: 1.4, zoom: 1.7 });
      await act.pause(1500);
    }
  },
};
