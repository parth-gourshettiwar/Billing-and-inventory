const express = require('express');
const router = express.Router();
const { getCustomers, getCustomer, createCustomer, searchCustomers } = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getCustomers);
router.get('/search', searchCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomer);

module.exports = router;
