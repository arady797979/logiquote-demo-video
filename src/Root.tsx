import { Composition, staticFile, type CalculateMetadataFunction } from "remotion";
import { Demo, type DemoProps } from "./Demo";
import { emptyManifest, storyboardSchema, type Manifest, type Storyboard } from "./schema";
import fullStoryboard from "../storyboard.json";
import testStoryboard from "../storyboard.test.json";

async function loadManifest(): Promise<Manifest> {
  try {
    const res = await fetch(staticFile("assets/manifest.json"));
    if (!res.ok) return emptyManifest;
    return (await res.json()) as Manifest;
  } catch {
    return emptyManifest;
  }
}

export function totalFrames(sb: Storyboard): number {
  const t = Math.round(sb.transitionSec * sb.fps);
  const scenes = sb.scenes.reduce((sum, s) => sum + Math.round(s.durationSec * sb.fps), 0);
  return scenes - t * (sb.scenes.length - 1);
}

const calculateMetadata: CalculateMetadataFunction<DemoProps> = async ({ props }) => {
  const storyboard = storyboardSchema.parse(props.storyboard);
  const manifest = await loadManifest();
  return {
    durationInFrames: totalFrames(storyboard),
    fps: storyboard.fps,
    props: { ...props, storyboard, manifest },
  };
};

const full = storyboardSchema.parse(fullStoryboard);
const test = storyboardSchema.parse(testStoryboard);

const variants = [
  { id: "Demo16x9", sb: full, layout: "landscape" as const },
  { id: "Demo9x16", sb: full, layout: "vertical" as const },
  { id: "Test12s", sb: test, layout: "landscape" as const },
  { id: "Test12sVertical", sb: test, layout: "vertical" as const },
];

export const RemotionRoot: React.FC = () => (
  <>
    {variants.map((v) => (
      <Composition
        key={v.id}
        id={v.id}
        component={Demo}
        width={v.layout === "landscape" ? 1920 : 1080}
        height={v.layout === "landscape" ? 1080 : 1920}
        fps={v.sb.fps}
        durationInFrames={totalFrames(v.sb)}
        defaultProps={{ storyboard: v.sb, manifest: emptyManifest, layout: v.layout }}
        calculateMetadata={calculateMetadata}
      />
    ))}
  </>
);
