// models/session.js
const db = require("../controllers/dbConnect");
const crypto = require("crypto");

async function createSession(userId) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await db.query(
    `INSERT INTO session (user_id, token_hash, expires_at)
     VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))`,
    [userId, tokenHash]
  );

  return rawToken; // return raw token to frontend
}

async function findSession(token) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const [rows] = await db.query(
    `SELECT user_id FROM session 
     WHERE token_hash = ? AND revoked = 0 AND expires_at > UTC_TIMESTAMP()`,
    [tokenHash]
  );
  return rows[0];
}

async function revokeSession(token) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await db.query(`UPDATE session SET revoked = 1 WHERE token_hash = ?`, [tokenHash]);
}

module.exports = { createSession, findSession, revokeSession };
