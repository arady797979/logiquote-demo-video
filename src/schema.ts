import { z } from "zod";

export const sceneSchema = z.object({
  id: z.string(),
  type: z.enum(["title", "kinetic", "still", "screen", "stats", "end"]),
  durationSec: z.number().positive(),
  /** On-screen caption (bottom), revealed word by word. Replaces voiceover for now. */
  caption: z.string().optional(),
  headline: z.string().optional(),
  subline: z.string().optional(),
  /** kinetic: big lines revealed one after another */
  lines: z.array(z.string()).optional(),
  stats: z
    .array(
      z.object({
        value: z.number(),
        prefix: z.string().optional(),
        suffix: z.string().optional(),
        label: z.string(),
      }),
    )
    .optional(),
  /**
   * Stock footage behind title/kinetic/end scenes. `url` = direct mp4 link (no API key needed, e.g. Mixkit/Pexels download link);
   * otherwise `query` is searched via Pixabay/Pexels and `pick` selects a downloaded candidate (1-3).
   */
  broll: z
    .object({
      query: z.string().optional(),
      url: z.string().url().optional(),
      page: z.string().url().optional(),
      pick: z.number().int().min(1).default(1),
    })
    .refine((b) => b.query || b.url, "broll needs `query` or `url`")
    .optional(),
  /** Generated still (Gemini image) for `still` scenes. */
  still: z.object({ prompt: z.string() }).optional(),
  /** Playwright flow name in pipeline/flows for `screen` scenes. */
  flow: z.string().optional(),
  lowerThird: z.string().optional(),
  cta: z.object({ text: z.string(), url: z.string() }).optional(),
});

export const storyboardSchema = z.object({
  title: z.string(),
  fps: z.number().int().default(30),
  transitionSec: z.number().default(0.5),
  scenes: z.array(sceneSchema).min(1),
});

export type Scene = z.infer<typeof sceneSchema>;
export type Storyboard = z.infer<typeof storyboardSchema>;

export type ScreenEvent = {
  /** seconds from start of recording */
  t: number;
  type: "click" | "type" | "focus";
  /** element box in recording pixels (1920x1080) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** how long the camera should stay zoomed on this element */
  holdSec?: number;
  zoom?: number;
};

export type SceneAssets = {
  broll?: string;
  brollDurationSec?: number;
  still?: string;
  screen?: string;
  screenDurationSec?: number;
  events?: ScreenEvent[];
};

export type Manifest = {
  scenes: Record<string, SceneAssets>;
  music?: string;
};

export const emptyManifest: Manifest = { scenes: {} };
