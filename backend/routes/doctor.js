const router = require('express').Router();
const { getDoctorProfile, upsertDoctorProfile, getAllPatients, getPatientRecords, writePrescription, getAllDoctors } = require('../controllers/doctorController');
const { auth, role } = require('../middleware/auth');

router.get('/profile', auth, role('doctor'), getDoctorProfile);
router.post('/profile', auth, role('doctor'), upsertDoctorProfile);
router.get('/patients', auth, role('doctor'), getAllPatients);
router.get('/patients/:patientId', auth, role('doctor'), getPatientRecords);
router.post('/prescriptions', auth, role('doctor'), writePrescription);
router.get('/all', auth, getAllDoctors);

module.exports = router;
