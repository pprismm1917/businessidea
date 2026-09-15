import { Router } from "express";
import { listLeads, getConversation, updateLeadStatus } from "../db.js";

export function dashboardRouter(client) {
  const router = Router();

  router.get("/api/leads", (req, res) => {
    res.json(listLeads(client.slug));
  });

  router.get("/api/leads/:id/conversation", (req, res) => {
    const leads = listLeads(client.slug);
    const lead = leads.find((l) => l.id === Number(req.params.id));
    if (!lead) return res.sendStatus(404);
    res.json(getConversation(client.slug, lead.contact, 200));
  });

  router.post("/api/leads/:id/status", (req, res) => {
    const { status } = req.body || {};
    if (!["new", "contacted", "booked", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    updateLeadStatus(Number(req.params.id), status);
    res.json({ ok: true });
  });

  return router;
}
