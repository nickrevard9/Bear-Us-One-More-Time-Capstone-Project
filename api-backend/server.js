// fileName : server.js
const http = require("http");
const { parse } = require("url");

const register = require("./routes/register.js");
const login = require("./routes/login.js");
// optional session support (comment out if not using sessions)
let createSession;
try {
  ({ createSession } = require("./models/session"));
} catch (_) {
  // models/session not present; we'll skip token issuance
}

const HOST = "0.0.0.0";
const PORT = 8888;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const server = http.createServer((req, res) => {
  setCors(res);

  const { pathname } = parse(req.url || "", true);

  // Preflight for fetch()
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // Simple healthcheck
  if (req.method === "GET" && pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }

  // Helper: collect body
  const readBody = () =>
    new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
        if (body.length > 1e6) {
          // ~1MB guard
          req.socket.destroy();
          reject(new Error("Payload too large"));
        }
      });
      req.on("end", () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(new Error("Invalid JSON body"));
        }
      });
      req.on("error", reject);
    });

  // POST /register
  if (req.method === "POST" && pathname === "/register") {
    return readBody()
      .then(async (data) => {
        const result = await register(data);
        if (typeof result === "string") {
          res.writeHead(201, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: result }));
        } else if (result?.error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: result.error }));
        }
        res.writeHead(201, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "User created!" }));
      })
      .catch((err) => {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });
  }

  // POST /login
  if (req.method === "POST" && pathname === "/login") {
    return readBody()
      .then(async (data) => {
        const result = await login(data); // expects { error } OR { message, user }

        if (result?.error) {
          res.writeHead(401, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: result.error }));
        }

        // optional: create opaque session token if models/session exists
        let accessToken = undefined;
        if (createSession && result?.user?.id) {
          try {
            accessToken = await createSession(result.user.id);
          } catch (e) {
            // fall through without token
            console.error("Session create failed:", e);
          }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            message: result.message || "Login successful",
            user: result.user,
            ...(accessToken ? { accessToken } : {}),
          })
        );
      })
      .catch((err) => {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });
  }

  // default
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, HOST, () => {
  console.log(`HTTP server listening on http://${HOST}:${PORT}`);
});
