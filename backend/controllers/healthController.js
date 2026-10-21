const db = require('../config/db');
const { sendWhatsApp } = require('../utils/whatsapp');

const calcHealthScore = (heart_rate, steps, sleep_hours) => {
  let score = 100;
  if (heart_rate !== null && heart_rate !== undefined && heart_rate > 0) {
    if (heart_rate > 100) score -= 25;
    else if (heart_rate > 90) score -= 10;
  }
  if (sleep_hours !== null && sleep_hours !== undefined && sleep_hours > 0) {
    if (sleep_hours < 5) score -= 25;
    else if (sleep_hours < 7) score -= 10;
  }
  if (steps !== null && steps !== undefined && steps > 0) {
    if (steps < 3000) score -= 20;
    else if (steps < 7000) score -= 10;
  }
  return Math.max(0, score);
};

const logHealth = async (req, res) => {
  try {
    let { heart_rate, steps, sleep_hours, weight, blood_pressure, notes } = req.body;
    
    // Clean empty strings to null to prevent MySQL zero default conversion
    heart_rate = heart_rate === '' || heart_rate === undefined ? null : parseInt(heart_rate, 10);
    steps = steps === '' || steps === undefined ? null : parseInt(steps, 10);
    sleep_hours = sleep_hours === '' || sleep_hours === undefined ? null : parseFloat(sleep_hours);
    weight = weight === '' || weight === undefined ? null : parseFloat(weight);
    blood_pressure = blood_pressure === '' || blood_pressure === undefined ? null : blood_pressure;
    notes = notes === '' || notes === undefined ? null : notes;

    const health_score = calcHealthScore(heart_rate, steps, sleep_hours);

    await db.query(
      'INSERT INTO health_logs (user_id,heart_rate,steps,sleep_hours,weight,blood_pressure,notes,health_score) VALUES (?,?,?,?,?,?,?,?)',
      [req.user.id, heart_rate, steps, sleep_hours, weight, blood_pressure, notes, health_score]
    );

    const alerts = [];
    
    // Heart rate thresholds
    if (heart_rate !== null && heart_rate > 110) {
      alerts.push({ type: 'heart_rate', msg: `High heart rate: ${heart_rate} bpm (Tachycardia)`, severity: 'high' });
    } else if (heart_rate !== null && heart_rate < 50 && heart_rate > 0) {
      alerts.push({ type: 'heart_rate', msg: `Low heart rate: ${heart_rate} bpm (Bradycardia)`, severity: 'high' });
    }

    // Sleep hours threshold
    if (sleep_hours !== null && sleep_hours < 5 && sleep_hours > 0) {
      alerts.push({ type: 'sleep', msg: `Low sleep: ${sleep_hours} hours`, severity: 'medium' });
    }

    // Blood pressure parsing and threshold checks (e.g. 145/95)
    if (blood_pressure && blood_pressure.includes('/')) {
      const parts = blood_pressure.split('/');
      const sys = parseInt(parts[0]?.trim(), 10);
      const dia = parseInt(parts[1]?.trim(), 10);
      if (!isNaN(sys) && !isNaN(dia)) {
        if (sys > 140 || dia > 90) {
          alerts.push({ type: 'blood_pressure', msg: `High blood pressure: ${blood_pressure} (Hypertension)`, severity: 'high' });
        } else if (sys < 90 || dia < 60) {
          alerts.push({ type: 'blood_pressure', msg: `Low blood pressure: ${blood_pressure} (Hypotension)`, severity: 'high' });
        }
      }
    }

    for (const a of alerts) {
      await db.query(
        'INSERT INTO health_alerts (user_id,alert_type,message,severity) VALUES (?,?,?,?)',
        [req.user.id, a.type, a.msg, a.severity]
      );
    }

    // If there are high severity alerts, trigger emergency WhatsApp notifications
    if (alerts.some(a => a.severity === 'high')) {
      try {
        const [userRows] = await db.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
        const userName = userRows[0]?.name || 'Patient';
        const alertSummary = alerts.map(a => `• ${a.msg}`).join('\n');

        // 1. Notify Family Members (via family groups)
        const [families] = await db.query(
          `SELECT DISTINCT g.id FROM family_groups g
           LEFT JOIN family_members m ON g.id = m.family_id
           WHERE g.created_by = ? OR m.user_id = ?`,
          [req.user.id, req.user.id]
        );

        for (const family of families) {
          const [members] = await db.query(
            'SELECT member_name, phone FROM family_members WHERE family_id = ? AND phone IS NOT NULL AND user_id != ?',
            [family.id, req.user.id]
          );
          for (const m of members) {
            try {
              await sendWhatsApp(m.phone,
                `🚨 *Health Alert — ${userName}*\n\n` +
                `Dear *${m.member_name}*,\n\n` +
                `${userName} has logged health data with critical concerns:\n${alertSummary}\n\n` +
                `Please check on them immediately.\n_HealthCare App_`
              );
            } catch (e) { console.error('Family alert error:', e.message); }
          }
        }

        // 2. Notify Emergency Contact (from Patient Profile)
        const [profileRows] = await db.query('SELECT emergency_contact FROM patient_profiles WHERE user_id = ?', [req.user.id]);
        const emergencyPhone = profileRows[0]?.emergency_contact;
        if (emergencyPhone) {
          try {
            await sendWhatsApp(emergencyPhone,
              `🚨 *EMERGENCY HEALTH ALERT — ${userName}*\n\n` +
              `Dear Emergency Contact,\n\n` +
              `Patient *${userName}* has logged critical vital signs:\n${alertSummary}\n\n` +
              `Please check on them immediately.\n_HealthCare System_`
            );
          } catch (e) { console.error('Emergency contact WhatsApp failed:', e.message); }
        }

        // 3. Notify Doctors (with scheduled appointments)
        const [doctorRows] = await db.query(
          `SELECT DISTINCT u.phone, u.name FROM appointments a
           JOIN users u ON a.doctor_id = u.id
           WHERE a.patient_id = ? AND a.status = 'scheduled' AND u.phone IS NOT NULL`,
          [req.user.id]
        );
        for (const doc of doctorRows) {
          try {
            await sendWhatsApp(doc.phone,
              `🚨 *PATIENT VITAL ALERT — ${userName}*\n\n` +
              `Dr. ${doc.name},\n\n` +
              `Your patient *${userName}* has logged critical vital metrics:\n${alertSummary}\n\n` +
              `Please review their health status in your dashboard.\n_HealthCare System_`
            );
          } catch (e) { console.error('Doctor alert WhatsApp failed:', e.message); }
        }

      } catch (e) { console.error('WhatsApp alert dispatch failed:', e.message); }
    }

    res.status(201).json({ message: 'Health data logged', health_score, alerts });
  } catch (err) {
    console.error('logHealth failed:', err);
    res.status(500).json({ message: err.message });
  }
};

const getHealthHistory = async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM health_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 30',
    [req.user.id]
  );
  res.json(rows);
};

const getAlerts = async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM health_alerts WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(rows);
};

const markAlertRead = async (req, res) => {
  await db.query('UPDATE health_alerts SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Marked as read' });
};

module.exports = { logHealth, getHealthHistory, getAlerts, markAlertRead };
