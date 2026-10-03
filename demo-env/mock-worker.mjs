// Stand-in for the LogiQuote Cloudflare Worker during recordings.
// Serves fictional Gmail threads and no-ops every mutation, so nothing leaves the box.
import http from "node:http";

const PORT = Number(process.env.MOCK_WORKER_PORT ?? 8787);
const MAILBOX = "ops@logiquote.app";
const ago = (min) => new Date(Date.now() - min * 60_000).toISOString();

const threads = {
  "thr-demo-1042": [
    {
      from: "Dana Whitfield <dana.whitfield@northlinefoods.com>",
      subject: "RFQ: 42,000 lb dry van, Chicago → Dallas, pickup Oct 14",
      min: 4,
      body: `Hi team,

Can you quote a full truckload for us?

• Pickup: Northline DC, Chicago IL 60601 — Tue Oct 14, 8:00 AM
• Delivery: Dallas TX 75201 — by Thu Oct 16
• 22 pallets of packaged dry goods, 42,000 lb
• 53' dry van, liftgate at delivery, appointment required

Need a rate today if possible.

Thanks,
Dana Whitfield
Logistics Manager, Northline Foods`,
    },
  ],
};

function threadPayload(threadId) {
  const msgs = threads[threadId] ?? [
    { from: "customer@example.com", subject: "Quote request", min: 30, body: "Could you send pricing for this lane?" },
  ];
  return {
    threadId,
    mailboxEmail: MAILBOX,
    messages: msgs.map((m, i) => ({
      id: `${threadId}-${i}`,
      threadId,
      direction: "INBOUND",
      from: m.from,
      subject: m.subject,
      bodyPlain: m.body,
      snippet: m.body.slice(0, 120),
      internalDate: ago(m.min),
    })),
  };
}

const copilotReply = {
  draft: {
    subject: "Re: RFQ: 42,000 lb dry van, Chicago → Dallas",
    body: "Hi Dana,\n\nThanks for the request. We can cover Chicago → Dallas on Oct 14 in a 53' dry van for $2,318 all-in, including liftgate and delivery appointment. Rate valid for 48 hours.\n\nBest,\nLogiQuote Ops",
    actionTag: "SEND_QUOTE",
  },
  quote: {
    draftedQuote: { buyRate: 1958, sellRate: 2318, margin: 0.184, currency: "USD", validity: "48h", route: "Chicago, IL → Dallas, TX" },
    policyStatus: "HUMAN_APPROVAL_REQUIRED",
  },
  events: [
    { stage: "INTAKE", message: "Parsed RFQ email from Northline Foods" },
    { stage: "SCHEMA", message: "11 freight fields extracted", confidence: 0.97 },
    { stage: "PRICING", message: "Contracted tariff WRN-001 + live fuel surcharge" },
    { stage: "POLICY", message: "Margin 18.4% within VIP band" },
    { stage: "QUOTE", message: "Customer-ready quote drafted" },
    { stage: "APPROVAL", message: "VIP account — human approval required" },
  ],
  pipelineStatus: "PENDING_APPROVAL",
  appliedTags: ["VIP", "HotRFQ"],
};

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (parts[0] === "gmail" && parts[1] === "threads" && parts[2]) {
      if (req.method === "GET" && parts.length === 3) return send(res, 200, threadPayload(parts[2]));
      if (parts[3] === "read") return send(res, 200, { ok: true });
      if (parts[3] === "reply") return send(res, 200, { ok: true, messageId: "mock", sentAt: new Date().toISOString() });
    }
    if (parts[0] === "rfq" && parts[2] === "human-decision") return send(res, 200, { quoteSent: false, workflowSignaled: false });
    if (parts[0] === "copilot" && parts[1] === "chat") return setTimeout(() => send(res, 200, copilotReply), 1200);
    send(res, 404, { error: `mock worker: no route for ${req.method} ${url.pathname}` });
  })
  .listen(PORT, () => console.log(`mock worker on :${PORT}`));
