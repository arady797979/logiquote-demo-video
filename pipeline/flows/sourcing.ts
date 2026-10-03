import type { Flow } from "./types.js";

/** Sourcing: vendor registry → rate tables. */
export const sourcing: Flow = {
  async start() {
    return "/sourcing";
  },
  async ready(page) {
    await page.getByRole("button", { name: "Registry", exact: true }).waitFor();
  },
  async run(page, act) {
    await act.pause(500);
    await act.click(page.getByRole("button", { name: "Registry", exact: true }), { holdSec: 0.4 });
    await act.focus(page.locator("main"), { holdSec: 2, zoom: 1.3 });
    await act.pause(1800);
    await act.click(page.getByRole("button", { name: "Rates", exact: true }), { holdSec: 0.4 });
    await act.focus(page.locator("main"), { holdSec: 2, zoom: 1.3 });
    await act.pause(1800);
  },
};
