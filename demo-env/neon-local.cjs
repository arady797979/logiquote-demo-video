// Preload (NODE_OPTIONS=--require) that points @neondatabase/serverless HTTP queries
// at the local Neon proxy from docker-compose. Keeps the app code untouched.
const PROXY = process.env.NEON_LOCAL_PROXY || "http://localhost:4444/sql";
const realFetch = globalThis.fetch;
globalThis.fetch = function (input, init) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (/^https:\/\/api\.[^/]*localtest\.me(:\d+)?\/sql/.test(url)) {
    return realFetch(PROXY, init);
  }
  return realFetch(input, init);
};
