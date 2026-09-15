import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

// Cheap, fast model — plenty for a front-desk FAQ bot. Swap to a stronger
// model in the Anthropic console/docs if a client needs more nuance.
const MODEL = "claude-haiku-4-5-20251001";

const LEAD_TAG = "[LEAD]";

function buildSystemPrompt(client) {
  return `You are the WhatsApp front-desk assistant for ${client.displayName}, a clinic in Pakistan.

Facts you know (never invent facts beyond these):
- Address: ${client.address}
- Phone: ${client.phone}
- Hours: ${client.hours}
- Services: ${client.services.join(", ")}
- Example consultation fee: ${client.exampleConsultationFee}

Rules:
- Never diagnose or give medical advice. If the patient describes pain, an
  injury, or any symptom, respond with empathy, say a doctor needs to see
  them in person, and offer to help them book a visit.
- Keep replies short: 2-4 sentences, warm, plain language.
- Reply in the same language/style the patient used (English or Roman Urdu).
- If the patient wants to book an appointment, OR you just recommended
  booking because of a symptom, end your reply with the exact tag ${LEAD_TAG}
  on its own line. Never mention this tag to the patient — it is stripped
  before they see the message and only used internally to notify the clinic.`;
}

const FALLBACK_RULES = [
  { test: /hour|open|close|timing/i, reply: (c) => `We're open — ${c.hours}.` },
  { test: /where|address|location|direction/i, reply: (c) => `We're at ${c.address}.` },
  { test: /fee|cost|price|charge/i, reply: (c) => `A new-patient consultation is around ${c.exampleConsultationFee}.` },
  { test: /book|appointment|schedule/i, reply: () => `Happy to help you book — what's your name and a good number to reach you on?`, lead: true },
  { test: /pain|hurt|broken|swollen|injur|fracture|ache|fell|sprain/i, reply: () => `That sounds like something a doctor should look at in person. Want me to get you booked in?`, lead: true },
];

function fallbackRespond(client, text) {
  for (const rule of FALLBACK_RULES) {
    if (rule.test.test(text)) {
      return { reply: rule.reply(client), isLead: !!rule.lead };
    }
  }
  return {
    reply: `I can help with hours, location, booking, or fees — what would you like to know? (Note: running in offline/mock mode — set ANTHROPIC_API_KEY for full AI responses.)`,
    isLead: false,
  };
}

/**
 * @param {object} client - parsed client config (see src/clients/*.json)
 * @param {{direction: 'in'|'out', body: string}[]} history - prior turns, oldest first
 * @param {string} incomingText - the new message from the patient
 * @returns {Promise<{reply: string, isLead: boolean}>}
 */
export async function getAIResponse(client, history, incomingText) {
  if (!anthropic) {
    return fallbackRespond(client, incomingText);
  }

  const messages = [
    ...history.map((m) => ({
      role: m.direction === "in" ? "user" : "assistant",
      content: m.body,
    })),
    { role: "user", content: incomingText },
  ];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: buildSystemPrompt(client),
    messages,
  });

  const raw = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const isLead = raw.includes(LEAD_TAG);
  const reply = raw.replace(LEAD_TAG, "").trim();

  return { reply, isLead };
}
