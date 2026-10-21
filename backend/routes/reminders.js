const router = require('express').Router();
const { getReminders, createReminder, triggerReminder, deleteReminder } = require('../controllers/reminderController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getReminders);
router.post('/', auth, createReminder);
router.post('/:id/trigger', auth, triggerReminder);
router.delete('/:id', auth, deleteReminder);

module.exports = router;
