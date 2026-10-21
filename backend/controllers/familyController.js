const db = require('../config/db');
const { sendWhatsApp } = require('../utils/whatsapp');

const createFamily = async (req, res) => {
  const { name } = req.body;
  const [result] = await db.query('INSERT INTO family_groups (name, created_by) VALUES (?,?)', [name, req.user.id]);
  res.status(201).json({ id: result.insertId, name });
};

const getMyFamilies = async (req, res) => {
  const [owned] = await db.query('SELECT * FROM family_groups WHERE created_by = ?', [req.user.id]);
  const [member] = await db.query(
    'SELECT g.* FROM family_groups g JOIN family_members m ON g.id = m.family_id WHERE m.user_id = ?',
    [req.user.id]
  );
  const map = new Map();
  [...owned, ...member].forEach(f => map.set(f.id, f));
  res.json([...map.values()]);
};

const deleteFamily = async (req, res) => {
  const [rows] = await db.query('SELECT id FROM family_groups WHERE id = ? AND created_by = ?', [req.params.familyId, req.user.id]);
  if (!rows.length) return res.status(403).json({ message: 'Not authorized' });
  await db.query('DELETE FROM family_groups WHERE id = ?', [req.params.familyId]);
  res.json({ message: 'Family group deleted' });
};

const addMember = async (req, res) => {
  try {
    let { member_name, phone, relation, user_id } = req.body;
    const { familyId } = req.params;

    // Clean empty string
    phone = phone === '' ? null : phone;

    if (!user_id && phone) {
      const [userRows] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
      user_id = userRows.length ? userRows[0].id : null;
    }

    const [result] = await db.query(
      'INSERT INTO family_members (family_id, member_name, phone, relation, user_id) VALUES (?,?,?,?,?)',
      [familyId, member_name, phone, relation, user_id]
    );

    const [groupRows] = await db.query('SELECT name FROM family_groups WHERE id = ?', [familyId]);
    const groupName = groupRows[0]?.name || 'Family Group';

    if (phone) {
      try {
        await sendWhatsApp(phone,
          `👋 *Hello ${member_name}!*\n\n` +
          `You have been added to the *${groupName}* family health group on HealthCare App.\n\n` +
          `Your health data will be shared with the family for transparency and care.\n\n` +
          `_Stay healthy! — HealthCare App_`
        );
      } catch (err) { console.error('WhatsApp Error:', err.message); }
    }

    res.status(201).json({ id: result.insertId, member_name, phone, relation, user_id });
  } catch (err) {
    console.error('addMember failed:', err);
    res.status(500).json({ message: err.message });
  }
};

const removeMember = async (req, res) => {
  const [family] = await db.query('SELECT created_by FROM family_groups WHERE id = ?', [req.params.familyId]);
  if (!family.length || family[0].created_by !== req.user.id)
    return res.status(403).json({ message: 'Only the group creator can remove members' });
  await db.query('DELETE FROM family_members WHERE id = ? AND family_id = ?', [req.params.memberId, req.params.familyId]);
  res.json({ message: 'Member removed' });
};

const getMembers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM family_members WHERE family_id = ?', [req.params.familyId]);
    const [familyRows] = await db.query('SELECT created_by FROM family_groups WHERE id = ?', [req.params.familyId]);
    if (familyRows.length) {
      const creatorId = familyRows[0].created_by;
      const [creatorRows] = await db.query(
        "SELECT id as user_id, name as member_name, phone, 'Creator' as relation FROM users WHERE id = ?",
        [creatorId]
      );
      if (creatorRows.length && !rows.some(r => r.user_id === creatorId)) {
        rows.unshift({ ...creatorRows[0], id: `creator_${creatorId}` });
      }
    }
    res.json(rows);
  } catch (err) {
    console.error('getMembers failed:', err);
    res.status(500).json({ message: err.message });
  }
};

const getFamilyHealth = async (req, res) => {
  const [members] = await db.query(
    'SELECT user_id FROM family_members WHERE family_id = ? AND user_id IS NOT NULL',
    [req.params.familyId]
  );
  const [familyGroup] = await db.query('SELECT created_by FROM family_groups WHERE id = ?', [req.params.familyId]);
  const userIds = [...new Set([...members.map(m => m.user_id), familyGroup[0]?.created_by].filter(Boolean))];
  if (!userIds.length) return res.json([]);

  const placeholders = userIds.map(() => '?').join(',');
  const [logs] = await db.query(
    `SELECT h.*, u.name as member_name FROM health_logs h
     JOIN users u ON h.user_id = u.id
     WHERE h.user_id IN (${placeholders})
     ORDER BY h.logged_at DESC LIMIT 50`,
    userIds
  );
  res.json(logs);
};

// Send health reminder to a specific family member by WhatsApp
const sendFamilyReminder = async (req, res) => {
  const { member_name, phone, message } = req.body;
  const senderName = req.user.name;
  if (!phone) return res.status(400).json({ message: 'Phone required' });
  try {
    await sendWhatsApp(phone,
      `💊 *Health Reminder for ${member_name}*\n\n` +
      `📩 From: *${senderName}*\n\n` +
      `${message}\n\n` +
      `_Sent via HealthCare App — Stay healthy!_`
    );
    res.json({ message: 'Reminder sent to ' + member_name });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send: ' + err.message });
  }
};

// Alert all family members when a member has a health issue
const alertFamilyMembers = async (req, res) => {
  const { familyId } = req.params;
  const { alertMessage, severity } = req.body;
  const senderName = req.user.name;

  const [members] = await db.query(
    'SELECT member_name, phone FROM family_members WHERE family_id = ? AND phone IS NOT NULL',
    [familyId]
  );

  const emoji = severity === 'high' ? '🚨' : '⚠️';
  let sent = 0;
  for (const m of members) {
    try {
      await sendWhatsApp(m.phone,
        `${emoji} *Health Alert — ${senderName}*\n\n` +
        `Dear *${m.member_name}*,\n\n` +
        `${alertMessage}\n\n` +
        `_Please check on them. — HealthCare App_`
      );
      sent++;
    } catch (err) { console.error('Alert error:', err.message); }
  }
  res.json({ message: `Alert sent to ${sent} family member(s)` });
};

const searchUsers = async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) return res.json([]);
  try {
    const [rows] = await db.query(
      `SELECT id, name, phone, email FROM users 
       WHERE role = 'patient' AND (name LIKE ? OR phone LIKE ?) 
       LIMIT 10`,
      [`%${query}%`, `%${query}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFamilyAlerts = async (req, res) => {
  const { familyId } = req.params;
  try {
    const [members] = await db.query(
      'SELECT user_id FROM family_members WHERE family_id = ? AND user_id IS NOT NULL',
      [familyId]
    );
    const [familyGroup] = await db.query('SELECT created_by FROM family_groups WHERE id = ?', [familyId]);
    const userIds = [...new Set([...members.map(m => m.user_id), familyGroup[0]?.created_by].filter(Boolean))];
    if (!userIds.length) return res.json([]);

    const placeholders = userIds.map(() => '?').join(',');
    const [alerts] = await db.query(
      `SELECT a.*, u.name as member_name FROM health_alerts a
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id IN (${placeholders}) AND a.is_read = FALSE
       ORDER BY a.created_at DESC`,
      userIds
    );
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getInviteInfo = async (req, res) => {
  const { familyId } = req.params;
  try {
    const [rows] = await db.query('SELECT name FROM family_groups WHERE id = ?', [familyId]);
    if (!rows.length) return res.status(404).json({ message: 'Family group not found' });
    res.json({ name: rows[0].name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const joinFamily = async (req, res) => {
  const { familyId } = req.params;
  const { relation } = req.body;
  const userId = req.user.id;
  const userPhone = req.user.phone || null;
  const userName = req.user.name;

  try {
    // Check if already a member
    const [exists] = await db.query(
      'SELECT id FROM family_members WHERE family_id = ? AND user_id = ?',
      [familyId, userId]
    );
    if (exists.length) {
      return res.status(400).json({ message: 'You are already a member of this family group.' });
    }

    // Check if the user is the creator of the group
    const [creatorRows] = await db.query('SELECT created_by, name FROM family_groups WHERE id = ?', [familyId]);
    if (!creatorRows.length) {
      return res.status(404).json({ message: 'Family group not found' });
    }
    if (creatorRows[0].created_by === userId) {
      return res.status(400).json({ message: 'You are the creator of this family group.' });
    }

    // Insert into family_members
    await db.query(
      'INSERT INTO family_members (family_id, member_name, phone, relation, user_id) VALUES (?,?,?,?,?)',
      [familyId, userName, userPhone, relation, userId]
    );

    res.status(201).json({ message: 'Successfully joined family group!', name: creatorRows[0].name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createFamily, getMyFamilies, deleteFamily,
  addMember, removeMember, getMembers,
  getFamilyHealth, sendFamilyReminder, alertFamilyMembers,
  searchUsers, getFamilyAlerts, getInviteInfo, joinFamily
};
