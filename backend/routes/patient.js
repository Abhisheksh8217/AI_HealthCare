const router = require('express').Router();
const { getProfile, upsertProfile } = require('../controllers/patientController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getProfile);
router.post('/', auth, upsertProfile);

module.exports = router;
