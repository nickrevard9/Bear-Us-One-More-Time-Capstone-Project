// routes/login.js
const db = require("../controllers/dbConnect.js");
const { scryptSync, timingSafeEqual } = require("crypto");

async function login({ USERNAME, EMAIL, PASSWORD }) {
  try {
    if ((!EMAIL && !USERNAME) || !PASSWORD) {
      return { error: "Email/Username and Password are required" };
    }

    // Find by email OR username (pass the same value twice for the placeholders)
    const [rows] = await db.query(
      `SELECT user_id, username, email, user_password, salt, first_name, last_name, user_role_id
       FROM user
       WHERE email = ? OR username = ?`,
      [EMAIL || USERNAME, EMAIL || USERNAME]
    );

    if (rows.length === 0) {
      return { error: "User not found" };
    }

    const user = rows[0];

    // Hash provided password with stored salt and compare safely
    const inputHash = scryptSync(PASSWORD, user.salt, 64);
    const storedHash = Buffer.from(user.user_password, "hex");

    if (
      inputHash.length !== storedHash.length ||
      !timingSafeEqual(inputHash, storedHash)
    ) {
      return { error: "Invalid password" };
    }

    // Success: return a safe user object (no password/salt)
    return {
      message: "Login successful",
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roleId: user.user_role_id,
      },
    };
  } catch (err) {
    console.error("Login error:", err);
    return { error: "Internal server error" };
  }
}

module.exports = login;
