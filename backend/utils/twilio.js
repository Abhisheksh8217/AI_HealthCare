const twilio = require('twilio');

const sendWhatsApp = async (to, message) => {
  // Normalize phone: strip whatsapp: prefix, spaces, dashes, parentheses
  let phone = to.replace(/^whatsapp:/i, '').replace(/[\s\-().]/g, '');
  // If only 10 digits (Indian number without country code), prepend +91
  if (/^[6-9]\d{9}$/.test(phone)) phone = '+91' + phone;
  else if (!phone.startsWith('+')) phone = '+' + phone;

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${phone}`,
      body: message,
    });
    console.log('[WhatsApp] Sent to', phone, '| SID:', result.sid);
    return result;
  } catch (err) {
    console.error('[WhatsApp] Failed:', err.message);
    throw err;
  }
};

module.exports = { sendWhatsApp };
