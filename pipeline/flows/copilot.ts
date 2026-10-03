import type { Flow } from "./types.js";
import { resolveThreadId } from "./helpers.js";

/** Quote Copilot: ask a lane question and show the answer. Needs the Worker (+ Gemini) running. */
export const copilot: Flow = {
  async start(page, env) {
    return `/quote-desk?threadId=${encodeURIComponent(await resolveThreadId(page, env))}`;
  },
  async ready(page) {
    await page.getByPlaceholder(/Ask for missing fields/).waitFor();
  },
  async run(page, act) {
    await act.pause(600);
    const box = page.getByPlaceholder(/Ask for missing fields/);
    await act.type(box, "Can we hold a 15% margin on this lane?", { zoom: 1.5 });
    await act.pause(300);
    await act.click(page.getByRole("button", { name: /send/i }).last(), { holdSec: 0.6 });
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
    await act.pause(800);
    await act.focus(page.locator("main"), { holdSec: 2.5, zoom: 1.3 });
    await act.pause(2500);
  },
};
