const db = require('../config/db');

const getProfile = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.name, u.email, u.phone, p.* FROM users u 
     LEFT JOIN patient_profiles p ON u.id = p.user_id 
     WHERE u.id = ?`, [req.user.id]
  );
  res.json(rows[0] || {});
};

const upsertProfile = async (req, res) => {
  const { age, gender, blood_group, address, medical_history, allergies, emergency_contact } = req.body;
  const [existing] = await db.query('SELECT id FROM patient_profiles WHERE user_id = ?', [req.user.id]);
  if (existing.length) {
    await db.query(
      'UPDATE patient_profiles SET age=?,gender=?,blood_group=?,address=?,medical_history=?,allergies=?,emergency_contact=? WHERE user_id=?',
      [age, gender, blood_group, address, medical_history, allergies, emergency_contact, req.user.id]
    );
  } else {
    await db.query(
      'INSERT INTO patient_profiles (user_id,age,gender,blood_group,address,medical_history,allergies,emergency_contact) VALUES (?,?,?,?,?,?,?,?)',
      [req.user.id, age, gender, blood_group, address, medical_history, allergies, emergency_contact]
    );
  }
  res.json({ message: 'Profile saved' });
};

module.exports = { getProfile, upsertProfile };
