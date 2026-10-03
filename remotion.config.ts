import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setConcurrency(4);
// Limited-range 4:2:0 + an audio track: the most broadly playable MP4 (browsers, QuickTime, Windows, Slack).
Config.setPixelFormat("yuv420p");
