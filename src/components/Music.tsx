import { Audio, interpolate, staticFile, useVideoConfig } from "remotion";

/** Background track: fades in/out. No voiceover yet, so no ducking. */
export const Music: React.FC<{ src: string }> = ({ src }) => {
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <Audio
      src={staticFile(src)}
      volume={(f) =>
        interpolate(f, [0, fps, durationInFrames - fps * 2, durationInFrames], [0, 0.45, 0.45, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
  );
};
