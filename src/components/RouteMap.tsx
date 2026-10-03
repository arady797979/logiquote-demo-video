import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

// Stylised lanes between hub cities (normalised 0-100 coords). Used as a fallback visual.
const nodes = [
  [14, 38], [24, 62], [38, 30], [46, 55], [58, 40], [66, 66], [78, 34], [86, 58],
] as const;
const lanes = [[0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [2, 3], [4, 7], [0, 1], [6, 7]];

export const RouteMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width, height, opacity: 0.9 }}>
        <defs>
          <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M 4 0 L 0 0 0 4" fill="none" stroke={theme.border} strokeWidth="0.08" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" opacity={0.6} />
        {lanes.map(([a, b], i) => {
          const [x1, y1] = nodes[a];
          const [x2, y2] = nodes[b];
          const mx = (x1 + x2) / 2;
          const my = Math.min(y1, y2) - 8;
          const p = interpolate(frame, [i * 4, i * 4 + fps * 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
              fill="none"
              stroke={i % 3 === 0 ? theme.blue : theme.primary}
              strokeWidth={0.25}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
              opacity={0.85}
              vectorEffect="non-scaling-stroke"
              style={{ strokeWidth: 2.5 }}
            />
          );
        })}
      </svg>
      {nodes.map(([x, y], i) => {
        const pulse = (Math.sin((frame / fps) * 3 + i) + 1) / 2;
        const appear = interpolate(frame, [i * 3, i * 3 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 14,
              height: 14,
              marginLeft: -7,
              marginTop: -7,
              borderRadius: 99,
              background: theme.primary,
              opacity: appear,
              boxShadow: `0 0 ${12 + pulse * 18}px ${4 + pulse * 6}px rgba(39,176,125,0.45)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
