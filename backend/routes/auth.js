const router = require('express').Router();
const { register, login, verifyEmail, getMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/verify', verifyEmail);
router.get('/me', auth, getMe);

module.exports = router;
