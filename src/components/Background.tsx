import { AbsoluteFill, OffthreadVideo, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { RouteMap } from "./RouteMap";

/** Brand gradient used behind screen recordings and as fallback. */
export const BrandGradient: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(39,176,125,0.28), transparent),
        radial-gradient(ellipse 60% 50% at 100% 100%, rgba(77,143,246,0.16), transparent),
        linear-gradient(160deg, ${theme.bgSoft}, ${theme.bg})`,
    }}
  />
);

/** One colour grade over every stock clip so they look like one shoot. */
export const ColorGrade: React.FC<{ strength?: number }> = ({ strength = 1 }) => (
  <>
    <AbsoluteFill style={{ backgroundColor: theme.bg, opacity: 0.45 * strength, mixBlendMode: "multiply" }} />
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, rgba(7,11,20,0.15) 0%, rgba(7,11,20,0.85) 100%)",
        opacity: strength,
      }}
    />
    <AbsoluteFill style={{ backgroundColor: theme.primary, opacity: 0.08 * strength, mixBlendMode: "overlay" }} />
  </>
);

/** Stock clip with slow push-in + grade; falls back to an animated route map when no clip is downloaded. */
export const Broll: React.FC<{ src?: string; blur?: number; grade?: number }> = ({ src, blur = 0, grade = 1 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1.06, 1.14]);
  if (!src) {
    return (
      <AbsoluteFill>
        <BrandGradient />
        <RouteMap />
        <ColorGrade strength={0.4} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${scale})`, filter: blur ? `blur(${blur}px)` : undefined }}>
        <OffthreadVideo
          src={staticFile(src)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) contrast(1.05)" }}
        />
      </AbsoluteFill>
      <ColorGrade strength={grade} />
    </AbsoluteFill>
  );
};

/** Ken Burns + 2-layer parallax on a generated still. */
export const KenBurns: React.FC<{ src?: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = frame / durationInFrames;
  if (!src) {
    return (
      <AbsoluteFill>
        <BrandGradient />
        <RouteMap />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.08 + 0.08 * p}) translateX(${-20 * p}px)` }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `scale(${1.2 + 0.14 * p}) translateX(${-50 * p}px)`,
          opacity: 0.25,
          mixBlendMode: "screen",
          filter: "blur(6px)",
        }}
      >
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <ColorGrade strength={0.5} />
    </AbsoluteFill>
  );
};
