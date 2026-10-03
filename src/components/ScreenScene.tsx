import { useMemo } from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { ScreenEvent } from "../schema";
import { theme, type Layout } from "../theme";
import { BrandGradient } from "./Background";
import type { SceneProps } from "./types";

const REC_W = 1920;
const REC_H = 1080;
const BAR = 44;
const LEAD_SEC = 0.45;
const MAX_SPEEDUP = 1.6;

const LAYOUTS: Record<Layout, { frameW: number; pull: number; zoomBoost: number; minZoom: number; maxZoom: number }> = {
  landscape: { frameW: 1600, pull: 0.35, zoomBoost: 1, minZoom: 1.25, maxZoom: 1.9 },
  vertical: { frameW: 1000, pull: 1, zoomBoost: 1.5, minZoom: 1.8, maxZoom: 2.8 },
};

type Cam = { x: number; y: number; s: number };

function targetAt(t: number, events: ScreenEvent[], layout: Layout): Cam {
  const cfg = LAYOUTS[layout];
  let active: ScreenEvent | undefined;
  for (const e of events) {
    const hold = e.holdSec ?? 1.4;
    if (t >= e.t - LEAD_SEC && t < e.t + hold) active = e;
  }
  if (!active) return { x: REC_W / 2, y: REC_H / 2, s: 1 };
  const auto = Math.min((REC_W * 0.55) / Math.max(active.w, 1), (REC_H * 0.5) / Math.max(active.h, 1));
  const s = Math.min(cfg.maxZoom, Math.max(cfg.minZoom, (active.zoom ?? auto) * cfg.zoomBoost));
  return { x: active.x + active.w / 2, y: active.y + active.h / 2, s };
}

/** Critically-damped spring over the per-frame targets: smooth Screen-Studio-style camera. */
function cameraTrack(frames: number, fps: number, rate: number, events: ScreenEvent[], layout: Layout): Cam[] {
  const omega = 6.5;
  const out: Cam[] = [];
  let cam: Cam = { x: REC_W / 2, y: REC_H / 2, s: 1 };
  let vel: Cam = { x: 0, y: 0, s: 0 };
  const sub = 4;
  const dt = 1 / fps / sub;
  for (let f = 0; f < frames; f++) {
    const target = targetAt((f / fps) * rate, events, layout);
    for (let i = 0; i < sub; i++) {
      for (const k of ["x", "y", "s"] as const) {
        const a = -omega * omega * (cam[k] - target[k]) - 2 * omega * vel[k];
        vel = { ...vel, [k]: vel[k] + a * dt };
        cam = { ...cam, [k]: cam[k] + vel[k] * dt };
      }
    }
    out.push(cam);
  }
  return out;
}

const WindowChrome: React.FC<{ width: number }> = ({ width }) => (
  <div style={{ height: BAR, width, display: "flex", alignItems: "center", gap: 9, padding: "0 18px", background: "#111827", borderBottom: `1px solid ${theme.border}` }}>
    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
      <div key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c }} />
    ))}
    <div style={{ marginLeft: 18, flex: 1, maxWidth: 520, height: 26, borderRadius: 8, background: "#0b1220", border: `1px solid ${theme.border}`, color: theme.muted, fontFamily: theme.fontBody, fontSize: 14, display: "flex", alignItems: "center", paddingLeft: 12 }}>
      LogiQuote · Freight RFQ Command Center
    </div>
  </div>
);

const Ripple: React.FC<{ e: ScreenEvent; frame: number; fps: number; rate: number }> = ({ e, frame, fps, rate }) => {
  const local = frame - (e.t / rate) * fps;
  if (local < 0 || local > fps * 0.6) return null;
  const p = local / (fps * 0.6);
  const size = 30 + 90 * p;
  return (
    <div style={{ position: "absolute", left: e.x + e.w / 2 - size / 2, top: e.y + e.h / 2 - size / 2, width: size, height: size, borderRadius: 999, border: `4px solid ${theme.primary}`, background: "rgba(39,176,125,0.18)", opacity: 1 - p }} />
  );
};

const LowerThird: React.FC<{ text: string; layout: Layout }> = ({ text, layout }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame: frame - fps * 0.3, fps, config: { damping: 18 } });
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const v = layout === "vertical";
  return (
    <div style={{ position: "absolute", left: v ? 60 : 80, top: v ? 300 : 36, opacity: s * out, transform: `translateX(${(1 - s) * -40}px)`, display: "flex", alignItems: "center", gap: 14, padding: v ? "16px 28px" : "12px 22px", borderRadius: 999, background: "rgba(7,11,20,0.85)", border: `1px solid rgba(39,176,125,0.4)`, fontFamily: theme.fontDisplay, fontWeight: 700, fontSize: v ? 40 : 28, color: theme.fg }}>
      <div style={{ width: 12, height: 12, borderRadius: 99, background: theme.primary, boxShadow: "0 0 16px rgba(39,176,125,0.9)" }} />
      {text}
    </div>
  );
};

export const ScreenScene: React.FC<SceneProps> = ({ scene, assets, layout }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const cfg = LAYOUTS[layout];
  const events = assets.events ?? [];
  const recDur = assets.screenDurationSec ?? scene.durationSec;
  const rate = Math.min(MAX_SPEEDUP, Math.max(1, recDur / scene.durationSec));
  const lastFrame = Math.max(0, Math.floor(((recDur - 0.05) / rate) * fps));
  const track = useMemo(() => cameraTrack(durationInFrames, fps, rate, events, layout), [durationInFrames, fps, rate, events, layout]);
  const cam = track[Math.min(frame, track.length - 1)];

  const k = cfg.frameW / REC_W;
  const frameH = BAR + REC_H * k;
  const left = (width - cfg.frameW) / 2;
  const top = (height - frameH) / 2;
  const cx = cam.x * k;
  const cy = BAR + cam.y * k;
  const zoomAmt = Math.min(1, Math.max(0, (cam.s - 1) / 0.4));
  const offX = (width / 2 - (left + cx)) * cfg.pull * zoomAmt;
  const offY = (height / 2 - (top + cy)) * cfg.pull * zoomAmt;
  const enter = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill>
      <BrandGradient />
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: cfg.frameW,
          height: frameH,
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 40px 120px -20px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)",
          transformOrigin: `${cx}px ${cy}px`,
          transform: `translate(${offX}px, ${offY + (1 - enter) * 40}px) scale(${cam.s * (0.96 + 0.04 * enter)})`,
          opacity: enter,
          background: theme.card,
        }}
      >
        <WindowChrome width={cfg.frameW} />
        <div style={{ position: "relative", width: REC_W, height: REC_H, transform: `scale(${k})`, transformOrigin: "0 0" }}>
          {assets.screen ? (
            <Freeze frame={lastFrame} active={(f) => f >= lastFrame}>
              <OffthreadVideo src={staticFile(assets.screen)} muted playbackRate={rate} style={{ width: REC_W, height: REC_H }} />
            </Freeze>
          ) : (
            <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", color: theme.muted, fontFamily: theme.fontBody, fontSize: 40 }}>
              No recording yet — run: npm run record -- --flow {scene.flow}
            </AbsoluteFill>
          )}
          {events.filter((e) => e.type === "click").map((e, i) => (
            <Ripple key={i} e={e} frame={frame} fps={fps} rate={rate} />
          ))}
        </div>
      </div>
      {scene.lowerThird ? <LowerThird text={scene.lowerThird} layout={layout} /> : null}
    </AbsoluteFill>
  );
};
