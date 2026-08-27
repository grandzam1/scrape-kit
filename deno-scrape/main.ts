/**
 * HTTP scrape runner: Firecrawl → Groq JSON → Deno markdown → GitHub docs/scrapes/<slug>/page.md
 *
 * Async note: Deno Deploy (new) does not support Kv.enqueue/listenQueue.
 * Default POST /scrape returns 202 + NDJSON progress stream (keeps isolate alive).
 * Clients may also poll GET /runs/:runId while the stream (or WS) is open.
 */

import { corsHeaders, eventPayload, originOk } from "./lib/http.ts";
import {
  hasWaitUntil,
  prepareScrapeJob,
  runQueuedScrapeJob,
  runScrape,
  tryWaitUntil,
} from "./lib/run.ts";
import { getRunSnapshotSafe } from "./lib/store.ts";
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
      runs: "GET /runs/:runId",
      scrapeAsync: "POST /scrape (default 202 + NDJSON stream); sync with {\"async\":false}",
      runsLog: Boolean(Deno.env.get("COMPOSIO_API_KEY") && Deno.env.get("COMPOSIO_USER_ID")),
    });
  }

  const runMatch = url.pathname.match(/^\/runs\/([^/]+)$/);
  if (req.method === "GET" && runMatch) {
    const runId = decodeURIComponent(runMatch[1]);
    const snap = await getRunSnapshotSafe(runId);
    if (!snap) return json({ ok: false, error: "run not found" }, 404);
    return json({ ok: true, ...snap }, 200);
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
    return json({ ok: false, error: "POST /scrape, GET /runs/:runId, or WebSocket /ws" }, 404);
  }

  const secret = Deno.env.get("SCRAPE_SECRET");
  if (secret && req.headers.get("x-scrape-secret") !== secret) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  try {
    const body = await req.json();
    const sourceUrl = String(body.url ?? "").trim();
    if (!sourceUrl) return json({ ok: false, error: "url is required" }, 400);

    const wantAsync = body.async !== false;

    if (!wantAsync) {
      const result = await runScrape(
        sourceUrl,
        body.slug,
        Number(body.waitFor ?? 3000),
        body.onlyMainContent !== false,
        () => {},
      );
      return json({ ok: true, accepted: false, ...result }, 200);
    }

    const prepared = await prepareScrapeJob({
      sourceUrl,
      slugInput: body.slug,
      waitFor: Number(body.waitFor ?? 3000),
      onlyMainContent: body.onlyMainContent !== false,
    });

    const meta = {
      ok: true,
      accepted: true,
      runId: prepared.runId,
      status: "queued",
      slug: prepared.slug,
      pageUrl: prepared.pageUrl,
      sourceUrl: prepared.sourceUrl,
      statusUrl: `/runs/${prepared.runId}`,
    };

    // If waitUntil exists, return compact 202 JSON and finish in background.
    if (hasWaitUntil()) {
      tryWaitUntil(
        runQueuedScrapeJob(prepared.job).catch((err) =>
          console.error("async scrape failed", prepared.runId, err)
        ),
      );
      return json({ ...meta, mode: "waitUntil" }, 202);
    }

    // Otherwise stream NDJSON so Deploy keeps the isolate alive for the job duration.
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(enc.encode(JSON.stringify({ ...meta, mode: "stream" }) + "\n"));

        void runQueuedScrapeJob(prepared.job, (step, extra = {}) => {
          try {
            controller.enqueue(enc.encode(JSON.stringify(eventPayload(step, extra)) + "\n"));
          } catch {
            /* client disconnected */
          }
        }).then(() => {
          try {
            controller.close();
          } catch { /* already closed */ }
        }).catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          try {
            controller.enqueue(enc.encode(JSON.stringify({ step: "error", error: message }) + "\n"));
            controller.close();
          } catch { /* */ }
        });
      },
    });

    return new Response(stream, {
      status: 202,
      headers: {
        ...corsHeaders(req),
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Run-Id": prepared.runId,
        "X-Status-Url": `/runs/${prepared.runId}`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ ok: false, error: message }, 500);
  }
});
