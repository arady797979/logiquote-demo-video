import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Broll } from "./Background";
import { Logo } from "./Logo";
import type { SceneProps } from "./types";

export const TitleCard: React.FC<SceneProps> = ({ scene, assets, layout }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = layout === "vertical";
  const words = (scene.headline ?? "").split(" ");
  const sub = interpolate(frame, [fps * 1.6, fps * 2.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Broll src={assets.broll} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: v ? 80 : 160, gap: v ? 56 : 44, flexDirection: "column" }}>
        <Logo size={v ? 92 : 84} delay={Math.round(fps * 0.2)} />
        <h1 style={{ margin: 0, textAlign: "center", fontFamily: theme.fontDisplay, fontWeight: 800, fontSize: v ? 104 : 96, lineHeight: 1.05, letterSpacing: -2.5, color: theme.fg, textShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
          {words.map((w, i) => {
            const s = spring({ frame: frame - fps * 0.6 - i * 3, fps, config: { damping: 16 } });
            return (
              <span key={i} style={{ display: "inline-block", opacity: s, transform: `translateY(${(1 - s) * 30}px)`, marginRight: "0.25em" }}>
                {w}
              </span>
            );
          })}
        </h1>
        {scene.subline ? (
          <p style={{ margin: 0, opacity: sub, fontFamily: theme.fontBody, fontSize: v ? 44 : 38, color: theme.muted, textAlign: "center" }}>{scene.subline}</p>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
