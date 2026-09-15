import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadClient } from "./clientConfig.js";
import { webhookRouter } from "./routes/webhook.js";
import { missedCallRouter } from "./routes/missedCall.js";
import { dashboardRouter } from "./routes/dashboard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const clientSlug = process.env.CLIENT_SLUG || "usama-ortho";
const client = loadClient(clientSlug);

const app = express();
app.use(express.json());

app.use("/webhook/whatsapp", webhookRouter(client));
app.use("/webhook/missed-call", missedCallRouter(client));
app.use("/", dashboardRouter(client));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    client: client.displayName,
    aiMode: process.env.ANTHROPIC_API_KEY ? "claude" : "fallback-rules",
    whatsappMode: process.env.WHATSAPP_ACCESS_TOKEN ? "live" : "mock",
  });
});

app.listen(PORT, () => {
  console.log(`\nBoneLine backend running for: ${client.displayName}`);
  console.log(`  → http://localhost:${PORT}/health`);
  console.log(`  → http://localhost:${PORT}/dashboard.html\n`);
});
