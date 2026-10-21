const sendWhatsApp = async (to, message) => {
  // Normalize phone: strip whatsapp: prefix, spaces, dashes, parentheses
  let phone = to.replace(/^whatsapp:/i, '').replace(/[\s\-().]/g, '');
  
  // Meta API expects '91...'
  const metaPhone = /^[6-9]\d{9}$/.test(phone) ? '91' + phone : phone;

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId || accessToken.includes('your_meta')) {
    console.warn('[WhatsApp] Meta credentials missing in .env. Skipping message.');
    return null;
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: metaPhone,
        type: 'text',
        text: { body: message }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Meta API error');
    }

    console.log('[WhatsApp] Sent via Meta to', metaPhone, '| ID:', data.messages?.[0]?.id);
    return data;
  } catch (err) {
    console.error('[WhatsApp] Meta Send Failed:', err.message);
    throw err;
  }
};

module.exports = { sendWhatsApp };
