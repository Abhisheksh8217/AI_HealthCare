const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { sendVerificationEmail } = require('../utils/email');

const register = async (req, res) => {
  const { name, email, password, phone, role, passcode } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Required fields missing' });
  
  if (role === 'doctor') {
    const expectedPasscode = process.env.DOCTOR_REGISTRATION_PASSCODE || 'DOCTOR2026';
    if (passcode !== expectedPasscode) {
      return res.status(400).json({ message: 'Invalid Authorization Passcode for Doctor registration. Please contact hospital administrator.' });
    }
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already registered' });
    
    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Require email verification if SMTP credentials are provided or explicitly enabled
    const emailConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true' || 
      (process.env.REQUIRE_EMAIL_VERIFICATION !== 'false' && emailConfigured);
    const isVerified = !requireVerification;

    await db.query(
      'INSERT INTO users (name, email, password, phone, role, is_verified, verification_token) VALUES (?,?,?,?,?,?,?)',
      [name, email, hashed, phone || null, role || 'patient', isVerified, isVerified ? null : verificationToken]
    );
    
    if (requireVerification) {
      await sendVerificationEmail(email, name, verificationToken);
      return res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });
    }

    res.status(201).json({ message: 'Registration successful! You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });
    
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    
    // Enforce email verification check
    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email address before logging in.' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('<h3>Verification token is missing.</h3>');

  try {
    const [users] = await db.query('SELECT id FROM users WHERE verification_token = ?', [token]);
    if (!users.length) {
      return res.status(400).send('<h3>Invalid or expired verification token.</h3>');
    }
    const user = users[0];
    await db.query('UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?', [user.id]);
    
    // Redirect to frontend login screen with success flag
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?verified=true`);
  } catch (err) {
    console.error('[Auth] Verification error:', err.message);
    res.status(500).send('<h3>Internal server error during email verification.</h3>');
  }
};

const getMe = async (req, res) => {
  const [rows] = await db.query('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [req.user.id]);
  res.json(rows[0]);
};

module.exports = { register, login, verifyEmail, getMe };
