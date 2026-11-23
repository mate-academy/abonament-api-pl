// Zaślepka catalog-api dla lokalnego środowiska testowego: aktywne rezerwacje z holds.json.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const holds = JSON.parse(readFileSync(new URL("./holds.json", import.meta.url), "utf8"));
const port = Number(process.env.PORT ?? 4000);

createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const match = url.pathname.match(/^\/books\/(\d+)\/holds$/);
  if (url.pathname === "/health") return send(res, 200, { status: "ok" });
  if (req.method !== "GET" || !match) return send(res, 404, { error: "not found" });
  const bookId = Number(match[1]);
  send(res, 200, holds.filter((h) => h.bookId === bookId));
}).listen(port, () => console.log(`catalog-api stub on :${port}`));

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
