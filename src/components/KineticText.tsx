import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Broll } from "./Background";
import type { SceneProps } from "./types";

export const KineticText: React.FC<SceneProps> = ({ scene, assets, layout }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const lines = scene.lines ?? [];
  const per = (durationInFrames - fps) / Math.max(lines.length, 1);
  const v = layout === "vertical";
  return (
    <AbsoluteFill>
      <Broll src={assets.broll} grade={1.3} />
      <AbsoluteFill style={{ justifyContent: "center", padding: v ? 80 : 180, flexDirection: "column", gap: 18 }}>
        {lines.map((line, i) => {
          const s = spring({ frame: frame - i * per, fps, config: { damping: 18, mass: 0.7 } });
          const active = frame >= i * per && (i === lines.length - 1 || frame < (i + 1) * per);
          return (
            <div key={i} style={{ fontFamily: theme.fontDisplay, fontWeight: 800, fontSize: v ? 96 : 110, letterSpacing: -3, lineHeight: 1.05, color: active ? theme.fg : "rgba(248,250,252,0.35)", opacity: s, transform: `translateX(${(1 - s) * -60}px)` }}>
              {line}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
