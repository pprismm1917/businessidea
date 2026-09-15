# BoneLine backend

A working front-desk automation system: an AI WhatsApp assistant that
answers patient questions, a missed-call text-back flow, and a lead
dashboard — built to be resold to one clinic/business at a time by
swapping a single config file.

This runs fully offline right now (fallback rule-based replies, mock
WhatsApp sending logged to the console) so you can build and test the
whole flow before signing up for any paid account. Verified working
end-to-end as of this build.

## Quick start (no external accounts needed)

```bash
npm install
cp .env.example .env
npm run dev
```

In another terminal:

```bash
npm run simulate -- chat "what are your hours?"
npm run simulate -- chat "I fell and my wrist really hurts"
npm run simulate -- missed-call 923001234567
```

Watch the server's terminal for the replies it "sent" (logged, not
actually delivered, since no WhatsApp account is connected yet), and
open **http://localhost:3000/dashboard.html** to see captured leads.

## Turning on real AI replies

Get a key from https://console.anthropic.com, put it in `.env` as
`ANTHROPIC_API_KEY=...`, restart the server. `/health` will report
`"aiMode": "claude"` once it's active. Without a key, it uses simple
keyword-matching fallback rules — good enough to test the flow, not
good enough for real patients.

## Going live with a real WhatsApp number (Pakistan)

WhatsApp is the right channel here, not SMS — see the businesses
already doing this: Wati, WAB2C, Vonage, Sinch all offer WhatsApp
Business API access for Pakistani numbers.

1. Pick a WhatsApp Business Solution Provider (BSP) — e.g. Wati or
   WAB2C (WAB2C is built specifically for the Pakistani market).
2. Complete Meta Business Verification for the client's business (the
   UAE company can be the verified business entity if the client
   doesn't have their own registered business).
3. Get your `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` from
   the BSP/Meta dashboard, add them to `.env`.
4. Deploy this server somewhere always-on (Railway, Render, or any
   small VPS both work fine for this load) so it has a public HTTPS
   URL.
5. In the Meta/BSP dashboard, register your webhook URL as
   `https://your-domain.com/webhook/whatsapp` with the same
   `WHATSAPP_VERIFY_TOKEN` you set in `.env`.

Once that's done, real incoming WhatsApp messages will hit this exact
code path — nothing else changes.

## Missed-call text-back

This needs a virtual number that forwards to the clinic's real line,
from a provider (e.g. a Jazz/Zong Business API, or a call-tracking
service) that can call a webhook when a call goes unanswered. Point
that webhook at `POST /webhook/missed-call` with body
`{ "from": "923001234567" }`.

## Adding a new client (the "replicate" part)

1. Copy `src/clients/usama-ortho.json` to `src/clients/<new-slug>.json`
   and fill in that business's real facts.
2. Set `CLIENT_SLUG=<new-slug>` in that client's `.env` (each client
   runs its own instance of this same codebase — nothing else to
   change).
3. Repeat the WhatsApp BSP setup above for their number.

## What this does NOT do yet

- No real patient data safeguards beyond a local SQLite file — fine
  for a demo/pilot, not sufficient for a medical client handling real
  PHI at scale. Revisit before onboarding a real clinic long-term
  (encryption at rest, access controls, a proper BAA with the BSP).
- No outbound marketing/bulk messaging — only replies to inbound
  messages and missed-call triggers, which avoids WhatsApp's stricter
  (and pricier) marketing-message rules.
