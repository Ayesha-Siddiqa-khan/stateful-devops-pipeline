const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = false;
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT, 10) || 3000;

const BACKEND_URL =
  process.env.BACKEND_URL || "http://backend.stateful-app.svc.cluster.local";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);

    if (parsedUrl.pathname.startsWith("/api/")) {
      const backendPath = parsedUrl.pathname;
      const backendUrl = `${BACKEND_URL}${backendPath}`;

      let body = null;
      if (req.method === "POST" || req.method === "PUT") {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        body = Buffer.concat(chunks);
      }

      try {
        const headers = { ...req.headers };
        delete headers.host;
        headers["host"] = new URL(BACKEND_URL).host;

        const proxyRes = await fetch(backendUrl, {
          method: req.method,
          headers,
          body: body || undefined,
        });

        res.writeHead(proxyRes.status, {
          "content-type": proxyRes.headers.get("content-type") || "application/json",
        });

        const responseBody = await proxyRes.arrayBuffer();
        res.end(Buffer.from(responseBody));
      } catch (err) {
        console.error("Proxy error:", err.message);
        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Backend unavailable" }));
      }
      return;
    }

    await handle(req, res, parsedUrl);
  }).listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> API proxy -> ${BACKEND_URL}`);
  });
});
