import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { KenBurns } from "./Background";
import type { SceneProps } from "./types";

export const StatCounter: React.FC<SceneProps> = ({ scene, assets, layout }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = layout === "vertical";
  const stats = scene.stats ?? [];
  const head = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill>
      <KenBurns src={assets.still} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: v ? 70 : 80, padding: 80 }}>
        {scene.headline ? (
          <h2 style={{ margin: 0, opacity: head, fontFamily: theme.fontDisplay, fontWeight: 700, fontSize: v ? 64 : 58, color: theme.fg, textAlign: "center", letterSpacing: -1.5 }}>{scene.headline}</h2>
        ) : null}
        <div style={{ display: "flex", flexDirection: v ? "column" : "row", gap: v ? 60 : 120 }}>
          {stats.map((st, i) => {
            const start = fps * 0.6 + i * fps * 0.5;
            const p = interpolate(frame, [start, start + fps * 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
            const s = spring({ frame: frame - start, fps, config: { damping: 14 } });
            return (
              <div key={i} style={{ textAlign: "center", opacity: s, transform: `scale(${0.8 + 0.2 * s})` }}>
                <div style={{ fontFamily: theme.fontDisplay, fontWeight: 800, fontSize: v ? 150 : 160, color: theme.primary, letterSpacing: -4, fontVariantNumeric: "tabular-nums", textShadow: "0 0 60px rgba(39,176,125,0.45)" }}>
                  {st.prefix ?? ""}
                  {Math.round(st.value * p)}
                  {st.suffix ?? ""}
                </div>
                <div style={{ fontFamily: theme.fontBody, fontSize: v ? 40 : 34, color: theme.muted }}>{st.label}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
