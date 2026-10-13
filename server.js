const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const logPath = path.join(root, "visits.jsonl");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf"
};

function readVisits() {
  try {
    return fs.readFileSync(logPath, "utf8")
      .split("\n")
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .slice(-200)
      .reverse();
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function send(res, status, contentType, body) {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
  });
  res.end(body);
}

function ownerAuthorized(req, res) {
  const password = process.env.OWNER_PASSWORD;

  if (!password) {
    send(
      res,
      503,
      "text/plain; charset=utf-8",
      "Dashboard disabled. Set OWNER_PASSWORD and restart the server."
    );
    return false;
  }

  const actual = req.headers.authorization || "";
  const expected =
    "Basic " + Buffer.from("owner:" + password).toString("base64");

  const a = Buffer.from(actual);
  const b = Buffer.from(expected);

  const matches =
    a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!matches) {
    res.writeHead(401, {
      "WWW-Authenticate": 'Basic realm="Portfolio owner"',
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end("Enter username owner and your dashboard password.");
    return false;
  }

  return true;
}

const server = http.createServer((req, res) => {
  let url;

  try {
    url = new URL(req.url, "http://localhost");
  } catch {
    return send(res, 400, "text/plain; charset=utf-8", "Bad request");
  }

  // PRIVATE OWNER DASHBOARD
  if (url.pathname === "/owner") {
    if (req.method !== "GET") {
      return send(res, 405, "text/plain; charset=utf-8", "Method not allowed");
    }

    if (!ownerAuthorized(req, res)) return;

    const visits = readVisits();

    const rows = visits.map(v => `
      <tr>
        <td>${escapeHtml(v.time)}</td>
        <td>${escapeHtml(v.ip)}</td>
        <td>${escapeHtml(v.page)}</td>
        <td>${escapeHtml(v.userAgent)}</td>
      </tr>
    `).join("");

    const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Portfolio Visitor Dashboard</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#0b1020;color:#f8fafc;
font:15px/1.6 system-ui,sans-serif}
main{max-width:1100px;width:92%;margin:45px auto}
h1{font-size:clamp(2rem,5vw,3rem);margin:0}
p{color:#aab5c7}
.note{background:#17213a;padding:14px;border-radius:10px}
.table-wrap{overflow-x:auto;margin-top:22px;border:1px solid #334155;
border-radius:10px}
table{border-collapse:collapse;width:100%;min-width:700px}
th,td{text-align:left;padding:12px;border-bottom:1px solid #334155;
overflow-wrap:anywhere}
th{color:#93c5fd;background:#111a30}
td{font-size:13px}
a{color:#93c5fd}
</style>
</head>
<body>
<main>
<p>PRIVATE OWNER AREA</p>
<h1>Portfolio Visitors</h1>
<p>Total displayed visits: ${visits.length} (maximum 200)</p>
<div class="note">
This dashboard records the time, requested page, server-observed IP
address and browser user-agent. IP addresses may be shared or masked
and do not identify a person. Inform visitors about this collection
and delete logs when no longer needed.
</div>
<div class="table-wrap">
<table>
<thead>
<tr>
<th>Time (UTC)</th>
<th>IP address received</th>
<th>Page</th>
<th>Browser</th>
</tr>
</thead>
<tbody>
${rows || '<tr><td colspan="4">No visits recorded yet.</td></tr>'}
</tbody>
</table>
</div>
<p><a href="/">Back to portfolio</a></p>
</main>
</body>
</html>`;

    return send(res, 200, "text/html; charset=utf-8", page);
  }

  // RECORD PORTFOLIO VISIT
  if (url.pathname === "/api/visit") {
    if (req.method !== "GET") {
      return send(res, 405, "text/plain; charset=utf-8", "Method not allowed");
    }

    // Use the direct socket address. Forwarded headers are not trusted here.
    let ip = req.socket.remoteAddress || "Not provided";

    // Normalize IPv4-mapped IPv6 addresses.
    if (ip.startsWith("::ffff:")) {
      ip = ip.substring(7);
    }

    // Store only the page path, not query strings or fragments.
    let pagePath = url.searchParams.get("page") || "/";
    if (
      !pagePath.startsWith("/") ||
      pagePath.startsWith("//") ||
      pagePath.length > 200
    ) {
      pagePath = "/";
    }

    const entry = {
      time: new Date().toISOString(),
      ip,
      page: pagePath,
      userAgent: String(req.headers["user-agent"] || "Not provided")
        .slice(0, 300)
    };

    return fs.appendFile(
      logPath,
      JSON.stringify(entry) + "\n",
      err => {
        if (err) {
          console.error("Could not save visit:", err.message);
          return send(
            res, 500, "application/json; charset=utf-8",
            JSON.stringify({ recorded: false })
          );
        }

        return send(
          res, 200, "application/json; charset=utf-8",
          JSON.stringify({ recorded: true })
        );
      }
    );
  }

  // SERVE PORTFOLIO FILES
  let pathname;

  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return send(res, 400, "text/plain; charset=utf-8", "Bad URL");
  }

  if (pathname === "/") pathname = "/index.html";

  const file = path.resolve(root, "." + pathname);

  if (!file.startsWith(root + path.sep)) {
    return send(res, 403, "text/plain; charset=utf-8", "Forbidden");
  }

  fs.readFile(file, (err, body) => {
    if (err) {
      return send(res, 404, "text/plain; charset=utf-8", "Not found");
    }

    return send(
      res,
      200,
      mime[path.extname(file).toLowerCase()] ||
        "application/octet-stream",
      body
    );
  });
});

const firstPort = Number(process.env.PORT) || 3000;

function listenOnAvailablePort(port) {
  server.once("error", error => {
    if (error.code === "EADDRINUSE" && port < firstPort + 20) {
      console.log(`Port ${port} is busy; trying ${port + 1}...`);
      return listenOnAvailablePort(port + 1);
    }

    console.error("Could not start server:", error.message);
    process.exitCode = 1;
  });

  server.listen(port, () => {
    console.log(`Portfolio running at http://localhost:${port}`);
  });
}

listenOnAvailablePort(firstPort);