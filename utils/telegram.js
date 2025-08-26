// utils/notifiers/telegram.js
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

// Basic HTML escape (if you later enable parse_mode: 'HTML')
const esc = s => String(s ?? '').replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));

async function sendTelegram(text, overrideChatId) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = overrideChatId || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,                  // keep as plain text for now
    // parse_mode: 'HTML', // enable if you switch to HTML formatting + esc()
    disable_web_page_preview: true
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.text();
    throw new Error(`Telegram error ${r.status}: ${e}`);
  }
}

module.exports = { sendTelegram };
