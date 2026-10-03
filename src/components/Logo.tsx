import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/** Same mark as apps/dashboard/src/components/brand/logo.tsx, animated (stroke draw-on). */
export const Logo: React.FC<{ size?: number; delay?: number; wordmark?: boolean }> = ({ size = 96, delay = 0, wordmark = true }) => {
  const frame = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14 } });
  const draw = interpolate(frame, [4, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const text = interpolate(frame, [14, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.28 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.3,
          transform: `scale(${pop})`,
          background: `linear-gradient(135deg, rgba(39,176,125,0.35), rgba(39,176,125,0.06))`,
          boxShadow: `0 0 0 2px rgba(39,176,125,0.3), 0 0 60px -10px rgba(39,176,125,0.6)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 32 32" width={size * 0.56} height={size * 0.56} fill="none">
          <path d="M6 22 L16 8 L26 22" stroke={theme.primary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
          <path d="M9 22 H23" stroke={theme.primary} strokeWidth={2.4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
          <circle cx="16" cy="24" r={2 * draw} fill={theme.primary} />
        </svg>
      </div>
      {wordmark ? (
        <div style={{ opacity: text, transform: `translateX(${(1 - text) * -16}px)`, fontFamily: theme.fontDisplay, fontWeight: 700, fontSize: size * 0.62, color: theme.fg, letterSpacing: -1 }}>
          Logi<span style={{ color: theme.primary }}>Quote</span>
        </div>
      ) : null}
    </div>
  );
};
