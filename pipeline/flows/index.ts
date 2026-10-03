import type { Flow } from "./types.js";
import { inbox } from "./inbox.js";
import { quote } from "./quote.js";
import { copilot } from "./copilot.js";
import { sourcing } from "./sourcing.js";

export const flows: Record<string, Flow> = { inbox, quote, copilot, sourcing };
