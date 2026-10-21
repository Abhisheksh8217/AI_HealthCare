const twilio = require('twilio');

/**
 * Normalizes any phone number into standard international format (+91...)
 */
const normalizePhone = (phone) => {
  if (!phone) return '';
  let clean = String(phone).replace(/^whatsapp:/i, '').replace(/[\s\-().]/g, '');
  if (/^[6-9]\d{9}$/.test(clean)) return '+91' + clean;
  if (/^91[6-9]\d{9}$/.test(clean)) return '+' + clean;
  if (!clean.startsWith('+')) return '+' + clean;
  return clean;
};

/**
 * Universal WhatsApp message dispatcher.
 * Prioritizes Twilio (active and verified) and supports Meta WhatsApp Cloud API as fallback.
 */
const sendWhatsApp = async (to, message) => {
  const phone = normalizePhone(to);
  if (!phone) {
    console.warn('[WhatsApp] No valid phone number provided. Skipping message.');
    return null;
  }

  const twilioPhone = `whatsapp:${phone}`;
  const metaPhone = phone.replace(/^\+/, '');

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  let lastError = null;

  // ─── 1. Primary: Twilio WhatsApp Provider ───
  if (twilioSid && twilioToken && !twilioSid.includes('your_')) {
    try {
      const client = twilio(twilioSid, twilioToken);
      const result = await client.messages.create({
        from: twilioFrom,
        to: twilioPhone,
        body: message,
      });

      console.log(`[WhatsApp] Successfully dispatched via Twilio to ${phone} | SID: ${result.sid}`);
      return { success: true, provider: 'twilio', sid: result.sid, to: phone };
    } catch (err) {
      console.warn(`[WhatsApp] Twilio dispatch failed (${err.message}). Checking Meta fallback...`);
      lastError = err;
    }
  }

  // ─── 2. Fallback: Meta WhatsApp Cloud API ───
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (metaToken && metaPhoneId && !metaToken.includes('your_')) {
    try {
      const url = `https://graph.facebook.com/v18.0/${metaPhoneId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: metaPhone,
          type: 'text',
          text: { body: message },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Meta API error');
      }

      console.log(`[WhatsApp] Successfully dispatched via Meta to ${metaPhone} | ID: ${data.messages?.[0]?.id}`);
      return { success: true, provider: 'meta', id: data.messages?.[0]?.id, to: phone };
    } catch (err) {
      console.warn(`[WhatsApp] Meta dispatch failed: ${err.message}`);
      lastError = err;
    }
  }

  if (lastError) {
    throw lastError;
  }

  console.warn('[WhatsApp] No active WhatsApp credentials configured in .env');
  return null;
};

module.exports = { sendWhatsApp, normalizePhone };
