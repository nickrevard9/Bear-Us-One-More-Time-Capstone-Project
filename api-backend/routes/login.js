const login = require("../routes/login"); // your login function
const { createSession } = require("../models/session");

app.post("/api/auth/login", async (req, res) => {
  const { email, username, password } = req.body;

  const result = await login({
    EMAIL: email,
    USERNAME: username,
    PASSWORD: password,
  });

  if (result?.error) {
    return res.status(401).json({ error: result.error });
  }

  const token = await createSession(result.user.id);

  res.json({ user: result.user, accessToken: token });
});
