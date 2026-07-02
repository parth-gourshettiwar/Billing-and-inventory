const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, upload } = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
router.get('/', authenticate, getSettings);
router.put('/', authenticate, upload.single('logo'), updateSettings);
module.exports = router;
