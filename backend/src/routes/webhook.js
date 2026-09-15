import { Router } from "express";
import { getAIResponse } from "../ai.js";
import { sendWhatsAppMessage } from "../whatsapp.js";
import { saveMessage, getConversation, createLead } from "../db.js";

export function webhookRouter(client) {
  const router = Router();

  // Meta calls this once when you register the webhook URL, to confirm you
  // own it. Must echo back hub.challenge if the verify token matches.
  router.get("/", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  });

  // Incoming WhatsApp messages land here (Meta Cloud API webhook shape).
  router.post("/", async (req, res) => {
    res.sendStatus(200); // ack immediately, Meta retries on timeout otherwise

    try {
      const entry = req.body?.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];
      if (!message || message.type !== "text") return;

      const from = message.from; // patient's WhatsApp number
      const text = message.text.body;
      const contactName = change?.contacts?.[0]?.profile?.name;

      saveMessage({ clientSlug: client.slug, contact: from, direction: "in", body: text });

      const history = getConversation(client.slug, from);
      const { reply, isLead } = await getAIResponse(client, history.slice(0, -1), text);

      saveMessage({ clientSlug: client.slug, contact: from, direction: "out", body: reply });
      await sendWhatsAppMessage(from, reply);

      if (isLead) {
        createLead({
          clientSlug: client.slug,
          contact: from,
          name: contactName,
          source: "chatbot",
          reason: text,
        });
      }
    } catch (err) {
      console.error("Error handling WhatsApp webhook:", err);
    }
  });

  return router;
}
