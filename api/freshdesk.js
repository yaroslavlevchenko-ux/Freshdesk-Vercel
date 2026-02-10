export default async function handler(req, res) {
  // Разрешаем только POST-запросы
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  try {
    // Получаем данные из запроса
    const { ticket_id, description_text } = req.body || {};

    if (!ticket_id || !description_text) {
      return res.status(400).json({ ok: false, reason: "Missing ticket_id or description_text" });
    }

    // Ищем email в тексте
    const emailMatch = description_text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (!emailMatch) {
      return res.status(400).json({ ok: false, reason: "Email not found in description_text" });
    }

    const email = emailMatch[0];

    // Отправка PUT запроса в Freshdesk
    const response = await fetch(
      `https://help-dressly.freshdesk.com/api/v2/tickets/${ticket_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from(process.env.FRESHDESK_API_KEY + ":X").toString("base64"),
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ ok: false, reason: "Freshdesk API error", details: errorText });
    }

    // Успешно
    return res.status(200).json({ ok: true, email });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}

