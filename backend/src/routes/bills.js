const express = require('express');
const router = express.Router();
const { createBill, getBill, getBills, cancelBill } = require('../controllers/billController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/', createBill);
router.get('/', getBills);
router.get('/:id', getBill);
router.patch('/:id/cancel', cancelBill);

module.exports = router;
