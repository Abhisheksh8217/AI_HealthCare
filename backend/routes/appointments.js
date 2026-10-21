const router = require('express').Router();
const { bookAppointment, getMyAppointments, updateStatus } = require('../controllers/appointmentController');
const { auth } = require('../middleware/auth');

router.post('/', auth, bookAppointment);
router.get('/', auth, getMyAppointments);
router.patch('/:id/status', auth, updateStatus);

module.exports = router;
