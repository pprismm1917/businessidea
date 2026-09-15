// Fires test events at your local server so you can see the whole flow
// (message in -> AI reply -> lead saved -> shows on dashboard) without a
// real WhatsApp Business account yet.
//
// Usage:
//   npm run dev                                  (in one terminal)
//   npm run simulate -- chat "what are your hours?"
//   npm run simulate -- chat "my wrist really hurts after a fall"
//   npm run simulate -- missed-call 923001234567

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const [, , mode, ...rest] = process.argv;

async function simulateChat(text) {
  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [{ profile: { name: "Test Patient" } }],
              messages: [
                {
                  from: "923001234567",
                  type: "text",
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const res = await fetch(`${BASE_URL}/webhook/whatsapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  console.log(`Sent chat message. Server responded ${res.status}. Watch the server's console for the AI reply.`);
}

async function simulateMissedCall(from) {
  const res = await fetch(`${BASE_URL}/webhook/missed-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from }),
  });
  const body = await res.json();
  console.log("Missed-call event sent:", body);
}

if (mode === "chat") {
  const text = rest.join(" ") || "What are your hours?";
  simulateChat(text);
} else if (mode === "missed-call") {
  simulateMissedCall(rest[0] || "923001234567");
} else {
  console.log("Usage:\n  npm run simulate -- chat \"your message\"\n  npm run simulate -- missed-call 923001234567");
}
