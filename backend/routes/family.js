const router = require('express').Router();
const {
  createFamily, getMyFamilies, deleteFamily,
  addMember, removeMember, getMembers,
  getFamilyHealth, sendFamilyReminder, alertFamilyMembers,
  searchUsers, getFamilyAlerts, getInviteInfo, joinFamily
} = require('../controllers/familyController');
const { auth } = require('../middleware/auth');

router.post('/', auth, createFamily);
router.get('/', auth, getMyFamilies);
router.get('/search-users', auth, searchUsers);
router.delete('/:familyId', auth, deleteFamily);
router.post('/:familyId/members', auth, addMember);
router.delete('/:familyId/members/:memberId', auth, removeMember);
router.get('/:familyId/members', auth, getMembers);
router.get('/:familyId/health', auth, getFamilyHealth);
router.get('/:familyId/alerts', auth, getFamilyAlerts);
router.post('/:familyId/remind', auth, sendFamilyReminder);
router.post('/:familyId/alert', auth, alertFamilyMembers);
router.get('/invite-info/:familyId', getInviteInfo);
router.post('/join/:familyId', auth, joinFamily);

module.exports = router;
