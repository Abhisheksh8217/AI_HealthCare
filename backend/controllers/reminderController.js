const db = require('../config/db');
const { sendWhatsApp } = require('../utils/whatsapp');

const getReminders = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(rows);
};

const createReminder = async (req, res) => {
  const { title, description, reminder_type, reminder_time, frequency, phone, lang } = req.body;
  const [result] = await db.query(
    'INSERT INTO reminders (user_id,title,description,reminder_type,reminder_time,frequency,phone) VALUES (?,?,?,?,?,?,?)',
    [req.user.id, title, description, reminder_type, reminder_time, frequency, phone]
  );

  let twilioError = null;
  if (phone) {
    const [userRows] = await db.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const senderName = userRows.length ? userRows[0].name : 'A Family Member';
    
    const typeEmoji = { medicine: '💊', checkup: '🏥', habit: '🏃', other: '🔔' };
    const emoji = typeEmoji[reminder_type] || '🔔';
    const msg = lang === 'kn'
      ? `${emoji} *ಆರೋಗ್ಯ ಜ್ಞಾಪನೆ ಹೊಂದಿಸಲಾಗಿದೆ*\n👤 ಕಳುಹಿಸಿದವರು: ${senderName}\n\n📌 *${title}*\n` +
        (description ? `📝 ${description}\n` : '') +
        (reminder_time ? `⏰ ಸಮಯ: ${reminder_time}\n` : '') +
        (frequency ? `🔁 ಆವರ್ತನ: ${frequency}\n` : '') +
        `\n_ಆರೋಗ್ಯವಾಗಿರಿ! — HealthCare App_`
      : `${emoji} *HealthCare Reminder Set*\n👤 Sent by: ${senderName}\n\n📌 *${title}*\n` +
        (description ? `📝 ${description}\n` : '') +
        (reminder_time ? `⏰ Time: ${reminder_time}\n` : '') +
        (frequency ? `🔁 Frequency: ${frequency}\n` : '') +
        `\n_Stay healthy! — HealthCare App_`;
    try {
      await sendWhatsApp(phone, msg);
    } catch (err) {
      console.error('WhatsApp Error:', err.message);
      twilioError = "To receive WhatsApp alerts on " + phone + ", send 'join attention-two' to +1 415 523 8886 on WhatsApp first.";
    }
  }

  res.status(201).json({ 
    id: result.insertId, 
    message: 'Reminder created',
    warning: twilioError 
  });
};

const triggerReminder = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM reminders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!rows.length) return res.status(404).json({ message: 'Not found' });
  const r = rows[0];
  if (!r.phone) return res.status(400).json({ message: 'No phone number on this reminder' });

  const [userRows] = await db.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
  const senderName = userRows.length ? userRows[0].name : 'A Family Member';

  const { lang } = req.body;
  const typeEmoji = { medicine: '💊', checkup: '🏥', habit: '🏃', other: '🔔' };
  const emoji = typeEmoji[r.reminder_type] || '🔔';
  const msg = lang === 'kn'
    ? `${emoji} *ಜ್ಞಾಪನೆ: ${r.title}*\n👤 ಕಳುಹಿಸಿದವರು: ${senderName}\n\n` +
      (r.description ? `📝 ${r.description}\n` : '') +
      (r.reminder_time ? `⏰ ನಿಗದಿತ ಸಮಯ: ${r.reminder_time}\n` : '') +
      `\n_HealthCare App — ನಿಮ್ಮ ಆರೋಗ್ಯ ಕಾಪಾಡಿಕೊಳ್ಳಿ!_`
    : `${emoji} *Reminder: ${r.title}*\n👤 Sent by: ${senderName}\n\n` +
      (r.description ? `📝 ${r.description}\n` : '') +
      (r.reminder_time ? `⏰ Scheduled: ${r.reminder_time}\n` : '') +
      `\n_HealthCare App — Take care of yourself!_`;

  try {
    await sendWhatsApp(r.phone, msg);
    res.json({ message: 'WhatsApp notification sent successfully!' });
  } catch (err) {
    console.error('WhatsApp Error:', err.message);
    res.status(500).json({
      message: `Failed to deliver WhatsApp message to ${r.phone}. If using sandbox, send 'join attention-two' to +1 415 523 8886 on WhatsApp first.`,
      error: err.message,
    });
  }
};

const deleteReminder = async (req, res) => {
  await db.query('DELETE FROM reminders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Deleted' });
};

module.exports = { getReminders, createReminder, triggerReminder, deleteReminder };
