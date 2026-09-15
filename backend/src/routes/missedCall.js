import { Router } from "express";
import { sendWhatsAppMessage } from "../whatsapp.js";
import { saveMessage, createLead } from "../db.js";

/**
 * Triggered by your telecom/virtual-number provider (e.g. a Jazz/Zong
 * Business API webhook, or whatever call-tracking service forwards the
 * clinic's line) whenever an inbound call goes unanswered.
 *
 * Expected body: { "from": "923001234567" }
 */
export function missedCallRouter(client) {
  const router = Router();

  router.post("/", async (req, res) => {
    const { from } = req.body || {};
    if (!from) {
      return res.status(400).json({ error: "Missing 'from' phone number" });
    }

    const text = client.missedCallReply;
    saveMessage({ clientSlug: client.slug, contact: from, direction: "out", body: text });
    await sendWhatsAppMessage(from, text);

    createLead({
      clientSlug: client.slug,
      contact: from,
      source: "missed_call",
      reason: "Unanswered call",
    });

    res.json({ ok: true });
  });

  return router;
}
