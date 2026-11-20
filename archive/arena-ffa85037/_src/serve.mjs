// Local preview server. Mirrors the /WinA/ subpath GitHub Pages uses,
// so links resolve exactly as they do in production.
//   node _src/serve.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2]) || 8080;
const PREFIX = "/WinA";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

http
  .createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);

    // Serve both with and without the /WinA prefix so the preview works
    // whether the platform proxies at root or under the subpath.
    if (p.startsWith(PREFIX)) p = p.slice(PREFIX.length) || "/";
    if (p === "/") p = "/index.html";
    if (p.endsWith("/")) p += "index.html";

    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    fs.readFile(file, (err, buf) => {
      if (err) {
        const nf = path.join(ROOT, "404.html");
        if (fs.existsSync(nf)) {
          res.writeHead(404, { "Content-Type": TYPES[".html"] }).end(fs.readFileSync(nf));
        } else {
          res.writeHead(404).end("Not found");
        }
        return;
      }
      const ext = path.extname(file);
      res.writeHead(200, {
        "Content-Type": TYPES[ext] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      res.end(buf);
    });
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`Preview: http://0.0.0.0:${PORT}${PREFIX}/`);
  });
