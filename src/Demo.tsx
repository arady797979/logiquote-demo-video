import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import type { Manifest, Scene, SceneAssets, Storyboard } from "./schema";
import { theme, type Layout } from "./theme";
import { TitleCard } from "./components/TitleCard";
import { KineticText } from "./components/KineticText";
import { StillScene } from "./components/StillScene";
import { ScreenScene } from "./components/ScreenScene";
import { StatCounter } from "./components/StatCounter";
import { EndCard } from "./components/EndCard";
import { Captions } from "./components/Captions";
import { Music } from "./components/Music";

export type DemoProps = {
  storyboard: Storyboard;
  manifest: Manifest;
  layout: Layout;
};

function SceneView({ scene, assets, layout }: { scene: Scene; assets: SceneAssets; layout: Layout }) {
  switch (scene.type) {
    case "title":
      return <TitleCard scene={scene} assets={assets} layout={layout} />;
    case "kinetic":
      return <KineticText scene={scene} assets={assets} layout={layout} />;
    case "still":
      return <StillScene scene={scene} assets={assets} layout={layout} />;
    case "screen":
      return <ScreenScene scene={scene} assets={assets} layout={layout} />;
    case "stats":
      return <StatCounter scene={scene} assets={assets} layout={layout} />;
    case "end":
      return <EndCard scene={scene} assets={assets} layout={layout} />;
  }
}

export const Demo: React.FC<DemoProps> = ({ storyboard, manifest, layout }) => {
  const { fps } = storyboard;
  const transitionFrames = Math.round(storyboard.transitionSec * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <TransitionSeries>
        {storyboard.scenes.flatMap((scene, i) => {
          const frames = Math.round(scene.durationSec * fps);
          const assets = manifest.scenes[scene.id] ?? {};
          const items = [
            <TransitionSeries.Sequence key={scene.id} durationInFrames={frames}>
              <SceneView scene={scene} assets={assets} layout={layout} />
              {scene.caption ? <Captions text={scene.caption} layout={layout} /> : null}
            </TransitionSeries.Sequence>,
          ];
          if (i < storyboard.scenes.length - 1) {
            const next = storyboard.scenes[i + 1];
            const useSlide = scene.type === "screen" && next.type === "screen";
            items.push(
              <TransitionSeries.Transition
                key={`${scene.id}-t`}
                presentation={useSlide ? slide({ direction: "from-right" }) : fade()}
                timing={linearTiming({ durationInFrames: transitionFrames })}
              />,
            );
          }
          return items;
        })}
      </TransitionSeries>
      {manifest.music ? <Music src={manifest.music} /> : null}
    </AbsoluteFill>
  );
};
