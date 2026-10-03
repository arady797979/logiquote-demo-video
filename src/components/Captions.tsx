import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, type Layout } from "../theme";

/**
 * Caption line revealed word-by-word (current word in brand colour).
 * No voiceover yet, so timing is spread across the scene; swap to whisper word timings later.
 */
export const Captions: React.FC<{ text: string; layout: Layout }> = ({ text, layout }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const words = text.split(" ");
  const start = fps * 0.4;
  const end = Math.max(start + 1, durationInFrames - fps * 1.2);
  const progress = interpolate(frame, [start, end], [0, words.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const boxIn = interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const v = layout === "vertical";
  return (
    <AbsoluteFill style={{ justifyContent: v ? "center" : "flex-end", alignItems: "center", paddingBottom: v ? 0 : 56, paddingTop: v ? 1180 : 0 }}>
      <div
        style={{
          opacity: boxIn,
          maxWidth: v ? 960 : 1500,
          padding: v ? "24px 36px" : "16px 30px",
          borderRadius: 18,
          background: "rgba(7,11,20,0.78)",
          border: `1px solid ${theme.border}`,
          backdropFilter: "blur(8px)",
          fontFamily: theme.fontDisplay,
          fontWeight: 600,
          fontSize: v ? 58 : 38,
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {words.map((w, i) => {
          const state = progress >= i + 1 ? "done" : progress > i ? "current" : "todo";
          return (
            <span key={i} style={{ color: state === "current" ? theme.primary : state === "done" ? theme.fg : "rgba(248,250,252,0.35)" }}>
              {w}{" "}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
