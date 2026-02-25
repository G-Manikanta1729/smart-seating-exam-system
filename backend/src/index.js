import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const rawPort = process.env.PORT;
let PORT = parseInt(rawPort, 10) || 5000;

// Avoid accidentally binding to privileged or clearly invalid ports (e.g. 50).
// If an env var sets a low privileged port (<1024), fall back to 5000 and warn.
if (rawPort && PORT < 1024) {
  console.warn(`⚠️ process.env.PORT=${rawPort} looks suspicious (privileged/low). Using 5000 instead.`);
  PORT = 5000;
}

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
