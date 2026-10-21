const router = require('express').Router();
const { logHealth, getHealthHistory, getAlerts, markAlertRead } = require('../controllers/healthController');
const { auth } = require('../middleware/auth');

router.post('/log', auth, logHealth);
router.get('/history', auth, getHealthHistory);
router.get('/alerts', auth, getAlerts);
router.patch('/alerts/:id/read', auth, markAlertRead);

module.exports = router;
