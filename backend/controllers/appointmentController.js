const db = require('../config/db');

const bookAppointment = async (req, res) => {
  const { doctor_id, appointment_date, appointment_time, reason } = req.body;
  const [result] = await db.query(
    'INSERT INTO appointments (patient_id,doctor_id,appointment_date,appointment_time,reason) VALUES (?,?,?,?,?)',
    [req.user.id, doctor_id, appointment_date, appointment_time, reason]
  );
  res.status(201).json({ id: result.insertId, message: 'Appointment booked' });
};

const getMyAppointments = async (req, res) => {
  let rows;
  if (req.user.role === 'doctor') {
    [rows] = await db.query(
      `SELECT a.*, u.name as patient_name, u.phone as patient_phone 
       FROM appointments a JOIN users u ON a.patient_id = u.id 
       WHERE a.doctor_id = ? ORDER BY a.appointment_date DESC`, [req.user.id]
    );
  } else {
    [rows] = await db.query(
      `SELECT a.*, u.name as doctor_name, d.specialization 
       FROM appointments a JOIN users u ON a.doctor_id = u.id 
       LEFT JOIN doctor_profiles d ON u.id = d.user_id 
       WHERE a.patient_id = ? ORDER BY a.appointment_date DESC`, [req.user.id]
    );
  }
  res.json(rows);
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ message: 'Status updated' });
};

module.exports = { bookAppointment, getMyAppointments, updateStatus };
