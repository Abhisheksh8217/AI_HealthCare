const router = require('express').Router();
const multer = require('multer');
const { checkSymptoms, chatbot, summarizeReport, predictRisks, generateMealPlan, inspectDrugs, scanReport } = require('../controllers/aiController');
const { auth } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/symptoms', auth, checkSymptoms);
router.post('/chat', auth, chatbot);
router.post('/summarize-report', auth, summarizeReport);
router.post('/predict-risks', auth, predictRisks);
router.post('/meal-plan', auth, generateMealPlan);
router.post('/inspect-drugs', auth, inspectDrugs);
router.post('/scan-report', auth, upload.single('file'), scanReport);

module.exports = router;
