/**
 * HTTP scrape runner: Firecrawl → Groq JSON → Deno markdown → GitHub docs/scrapes/<slug>/page.md
 */

import { corsHeaders, eventPayload, originOk } from "./lib/http.ts";
import { runScrape } from "./lib/run.ts";
import { json } from "./lib/util.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
    return json({
      ok: true,
      service: "zamplandoc-scrape",
      ws: "/ws",
      runsLog: Boolean(Deno.env.get("COMPOSIO_API_KEY") && Deno.env.get("COMPOSIO_USER_ID")),
    });
  }

  if (url.pathname === "/ws" && req.headers.get("upgrade")?.toLowerCase() === "websocket") {
    if (!originOk(req)) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }
    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.onmessage = async (ev) => {
      try {
        const body = JSON.parse(String(ev.data));
        const sourceUrl = String(body.url ?? "").trim();
        if (!sourceUrl) {
          socket.send(JSON.stringify({ step: "error", error: "url is required" }));
          socket.close();
          return;
        }
        await runScrape(
          sourceUrl,
          body.slug,
          Number(body.waitFor ?? 3000),
          body.onlyMainContent !== false,
          (step, extra = {}) => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify(eventPayload(step, extra)));
            }
          },
          true,
        );
        socket.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ step: "error", error: message }));
          socket.close();
        }
      }
    };
    return response;
  }

  if (req.method !== "POST" || url.pathname !== "/scrape") {
    return json({ ok: false, error: "POST /scrape or WebSocket /ws" }, 404);
  }

  const secret = Deno.env.get("SCRAPE_SECRET");
  if (secret && req.headers.get("x-scrape-secret") !== secret) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  try {
    const body = await req.json();
    const sourceUrl = String(body.url ?? "").trim();
    if (!sourceUrl) return json({ ok: false, error: "url is required" }, 400);

    const result = await runScrape(
      sourceUrl,
      body.slug,
      Number(body.waitFor ?? 3000),
      body.onlyMainContent !== false,
      () => {},
    );

    return json({ ok: true, ...result }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ ok: false, error: message }, 500);
  }
});
