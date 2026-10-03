import type { Locator, Page } from "playwright";
import type { ScreenEvent } from "../../src/schema.js";

export type ActOpts = { holdSec?: number; zoom?: number };

export interface Actor {
  click(target: Locator, opts?: ActOpts): Promise<void>;
  type(target: Locator, text: string, opts?: ActOpts): Promise<void>;
  /** Move the cursor to an element and zoom the camera on it without clicking. */
  focus(target: Locator, opts?: ActOpts): Promise<void>;
  scroll(dy: number): Promise<void>;
  pause(ms: number): Promise<void>;
}

export type FlowEnv = { baseUrl: string; threadId?: string; allowMutations: boolean };

export type Flow = {
  /** Resolve the start URL path (may browse the app first, before recording starts). */
  start(page: Page, env: FlowEnv): Promise<string>;
  /** Wait until the start page is fully rendered. */
  ready(page: Page): Promise<void>;
  run(page: Page, act: Actor, env: FlowEnv): Promise<void>;
};

export type RawEvent = Omit<ScreenEvent, "t"> & { at: number };
