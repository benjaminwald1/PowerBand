// powerband-quotes: live stock quotes for powerband.fit, readable from the browser.
// GET /?s=AAPL,AXP,KO  ->  { updated, quote_time, prices: { AAPL: 342.37, ... } }
// Quotes come from Yahoo's public chart endpoint (no key). Answers are cached for
// one second at the edge, so any number of open tabs cost Yahoo one fetch a second.
const ORIGINS = ["https://powerband.fit", "https://www.powerband.fit"];
const SYMBOL = /^[A-Z]{1,5}([.-][A-Z])?$/;

function cors(req) {
  const o = req.headers.get("origin");
  return {
    "access-control-allow-origin": ORIGINS.includes(o) ? o : ORIGINS[0],
    "vary": "origin",
    "content-type": "application/json",
  };
}

async function quote(sym) {
  for (const host of ["query1", "query2"]) {
    try {
      const r = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${sym}?range=1d&interval=1m`,
        { headers: { "user-agent": "Mozilla/5.0" }, cf: { cacheTtl: 1, cacheEverything: true } });
      if (!r.ok) continue;
      const m = (await r.json()).chart.result[0].meta;
      return { price: Number(m.regularMarketPrice), time: Number(m.regularMarketTime) || 0 };
    } catch (e) { /* try the other host */ }
  }
  return null;
}

export default {
  async fetch(req, env, ctx) {
    const h = cors(req);
    if (req.method === "OPTIONS") return new Response(null, { headers: { ...h, "access-control-allow-methods": "GET" } });
    const syms = [...new Set((new URL(req.url).searchParams.get("s") || "").toUpperCase().split(",").map((s) => s.trim()).filter(Boolean))];
    if (!syms.length || syms.length > 12 || !syms.every((s) => SYMBOL.test(s)))
      return new Response(JSON.stringify({ error: "bad symbols" }), { status: 400, headers: h });
    const key = new Request("https://powerband-quotes.cache/" + syms.sort().join(","));
    const hit = await caches.default.match(key);
    if (hit) return new Response(hit.body, { headers: { ...h, "cache-control": "no-store", "x-cache": "hit" } });
    const got = await Promise.all(syms.map(quote));
    if (got.some((g) => !g)) return new Response(JSON.stringify({ error: "quote source unavailable" }), { status: 502, headers: h });
    const prices = {}; let stamp = 0;
    syms.forEach((s, i) => { prices[s] = Math.round(got[i].price * 10000) / 10000; stamp = Math.max(stamp, got[i].time); });
    const body = JSON.stringify({ updated: new Date().toISOString(), quote_time: new Date(stamp * 1000).toISOString(), prices });
    ctx.waitUntil(caches.default.put(key, new Response(body, { headers: { "cache-control": "public, max-age=1" } })));
    return new Response(body, { headers: { ...h, "cache-control": "no-store", "x-cache": "miss" } });
  },
};
