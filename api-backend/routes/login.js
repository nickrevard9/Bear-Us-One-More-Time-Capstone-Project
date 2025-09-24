const db = require("../controllers/dbConnect.js");
const { scryptSync } = require("crypto");

async function login({ EMAIL, USERNAME, PASSWORD }) {
  try {
    if (!EMAIL && !USERNAME) {
      throw new Error("Email or Username is required");
    }

    // find user by email or username
    const query = `
      SELECT user_id, username, email, user_password, salt, first_name, last_name, user_role_id
      FROM user
      WHERE email = ? OR username = ?
    `;
    const [rows] = await db.query(query, [EMAIL || USERNAME, EMAIL || USERNAME]);

    if (rows.length === 0) {
      throw new Error("User not found");
    }

    const user = rows[0];

    // hash the provided password with stored salt
    const hashedInput = scryptSync(PASSWORD, user.salt, 64).toString("hex");

    if (hashedInput !== user.user_password) {
      throw new Error("Invalid password");
    }

    // success — return safe user info
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
  } catch (error) {
    console.error("Login error:", error);
    return { error: error.message };
  }
}

module.exports = login;