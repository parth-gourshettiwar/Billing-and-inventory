const express = require('express');
const router = express.Router();
const { getReports } = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');
router.get('/', authenticate, getReports);
module.exports = router;
