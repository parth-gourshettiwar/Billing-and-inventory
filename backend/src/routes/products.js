const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, toggleProductStatus, getInventoryHistory } = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getProducts);
router.post('/', createProduct);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.patch('/:id/status', toggleProductStatus);
router.get('/:id/history', getInventoryHistory);

module.exports = router;
