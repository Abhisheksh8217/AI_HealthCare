const db = require('../config/db');

const getDoctorProfile = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.name, u.email, u.phone, d.* FROM users u 
     LEFT JOIN doctor_profiles d ON u.id = d.user_id 
     WHERE u.id = ?`, [req.user.id]
  );
  res.json(rows[0] || {});
};

const upsertDoctorProfile = async (req, res) => {
  const { specialization, license_number, hospital, experience, bio } = req.body;
  const [existing] = await db.query('SELECT id FROM doctor_profiles WHERE user_id = ?', [req.user.id]);
  if (existing.length) {
    await db.query(
      'UPDATE doctor_profiles SET specialization=?,license_number=?,hospital=?,experience=?,bio=? WHERE user_id=?',
      [specialization, license_number, hospital, experience, bio, req.user.id]
    );
  } else {
    await db.query(
      'INSERT INTO doctor_profiles (user_id,specialization,license_number,hospital,experience,bio) VALUES (?,?,?,?,?,?)',
      [req.user.id, specialization, license_number, hospital, experience, bio]
    );
  }
  res.json({ message: 'Doctor profile saved' });
};

const getAllPatients = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email, u.phone, p.age, p.gender, p.blood_group 
     FROM users u LEFT JOIN patient_profiles p ON u.id = p.user_id 
     WHERE u.role = 'patient'`
  );
  res.json(rows);
};

const getPatientRecords = async (req, res) => {
  const patientId = req.params.patientId;
  const [profile] = await db.query(
    `SELECT u.name, u.email, u.phone, p.* FROM users u 
     LEFT JOIN patient_profiles p ON u.id = p.user_id WHERE u.id = ?`, [patientId]
  );
  const [logs] = await db.query('SELECT * FROM health_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 10', [patientId]);
  const [prescriptions] = await db.query(
    `SELECT pr.*, u.name as doctor_name FROM prescriptions pr 
     JOIN users u ON pr.doctor_id = u.id WHERE pr.patient_id = ? ORDER BY pr.created_at DESC`, [patientId]
  );
  res.json({ profile: profile[0], logs, prescriptions });
};

const writePrescription = async (req, res) => {
  const { patient_id, diagnosis, medications, instructions } = req.body;
  await db.query(
    'INSERT INTO prescriptions (doctor_id,patient_id,diagnosis,medications,instructions) VALUES (?,?,?,?,?)',
    [req.user.id, patient_id, diagnosis, medications, instructions]
  );
  res.status(201).json({ message: 'Prescription written' });
};

const getAllDoctors = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email, d.specialization, d.hospital, d.experience 
     FROM users u LEFT JOIN doctor_profiles d ON u.id = d.user_id 
     WHERE u.role = 'doctor'`
  );
  res.json(rows);
};

module.exports = { getDoctorProfile, upsertDoctorProfile, getAllPatients, getPatientRecords, writePrescription, getAllDoctors };
