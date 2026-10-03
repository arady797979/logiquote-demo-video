import type { Flow } from "./types.js";
import { resolveThreadId } from "./helpers.js";

/** Quote Copilot: ask a lane question and show the answer. Needs the Worker (or demo-env mock worker). */
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
    await page.keyboard.press("Enter");
    const answer = page.locator(".justify-start .whitespace-pre-wrap").first();
    await answer.waitFor({ timeout: 45_000 });
    await act.pause(400);
    await act.focus(answer, { holdSec: 2.5, zoom: 1.35 });
    await act.pause(2500);
  },
};
