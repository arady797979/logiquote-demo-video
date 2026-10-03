import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { KenBurns } from "./Background";
import { Logo } from "./Logo";
import type { SceneProps } from "./types";

export const StillScene: React.FC<SceneProps> = ({ scene, assets, layout }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - fps * 0.5, fps, config: { damping: 16 } });
  const v = layout === "vertical";
  return (
    <AbsoluteFill>
      <KenBurns src={assets.still} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 28 }}>
        <Logo size={v ? 120 : 110} wordmark={false} />
        {scene.headline ? (
          <h1 style={{ margin: 0, opacity: s, transform: `translateY(${(1 - s) * 24}px)`, fontFamily: theme.fontDisplay, fontWeight: 800, fontSize: v ? 110 : 120, letterSpacing: -3, color: theme.fg, textAlign: "center" }}>
            {scene.headline}
          </h1>
        ) : null}
        {scene.subline ? <p style={{ margin: 0, opacity: s, fontFamily: theme.fontBody, fontSize: v ? 44 : 42, color: theme.muted, textAlign: "center" }}>{scene.subline}</p> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
