const GRAPH_VERSION = "v20.0";

/**
 * Sends a WhatsApp text message via Meta's Cloud API.
 * Falls back to logging to the console when no access token/phone number id
 * is configured yet, so the whole flow can be built and tested before the
 * WhatsApp Business account is approved.
 */
export async function sendWhatsAppMessage(to, body) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[mock WhatsApp] -> ${to}: ${body}`);
    return { mock: true };
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${errText}`);
  }

  return res.json();
}
