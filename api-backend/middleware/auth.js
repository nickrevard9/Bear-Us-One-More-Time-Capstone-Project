const { findSession } = require("../models/session");

async function auth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "No token provided" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid format" });

  const session = await findSession(token);
  if (!session) return res.status(401).json({ error: "Invalid or expired token" });

  req.userId = session.user_id;
  next();
}

module.exports = auth;
