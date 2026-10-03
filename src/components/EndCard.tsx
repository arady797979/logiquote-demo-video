import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Broll } from "./Background";
import { Logo } from "./Logo";
import type { SceneProps } from "./types";

export const EndCard: React.FC<SceneProps> = ({ scene, assets, layout }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = layout === "vertical";
  const s1 = spring({ frame: frame - 6, fps, config: { damping: 16 } });
  const s2 = spring({ frame: frame - 14, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill>
      <Broll src={assets.broll} blur={14} grade={1.4} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: v ? 60 : 44 }}>
        <Logo size={v ? 100 : 92} />
        {scene.headline ? (
          <h1 style={{ margin: 0, opacity: s1, transform: `translateY(${(1 - s1) * 20}px)`, fontFamily: theme.fontDisplay, fontWeight: 800, fontSize: v ? 96 : 88, letterSpacing: -2.5, color: theme.fg, textAlign: "center", padding: "0 60px" }}>
            {scene.headline}
          </h1>
        ) : null}
        {scene.cta ? (
          <div style={{ opacity: s2, transform: `scale(${0.9 + 0.1 * s2})`, display: "flex", flexDirection: v ? "column" : "row", alignItems: "center", gap: 28 }}>
            <div style={{ background: theme.primary, color: "#04140d", fontFamily: theme.fontDisplay, fontWeight: 700, fontSize: v ? 48 : 40, padding: "22px 48px", borderRadius: 999, boxShadow: "0 20px 60px -20px rgba(39,176,125,0.8)" }}>
              {scene.cta.text}
            </div>
            <div style={{ fontFamily: theme.fontBody, fontWeight: 500, fontSize: v ? 44 : 38, color: theme.fg }}>{scene.cta.url}</div>
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
