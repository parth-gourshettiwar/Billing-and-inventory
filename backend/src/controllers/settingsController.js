const { query } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const getSettings = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM settings WHERE id = 1');
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Settings not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { shop_name, owner_name, address, phone, email = '', gstin, invoice_prefix = 'INV',
      footer_message = '', terms_conditions = '', currency = '₹', date_format = 'DD-MM-YYYY',
      low_stock_threshold = 10 } = req.body;

    if (!shop_name || !owner_name || !address || !phone || !gstin) {
      return res.status(400).json({ success: false, message: 'Shop name, owner name, address, phone, and GSTIN are required' });
    }

    let logo_url = req.body.logo_url || '';
    if (req.file) {
      logo_url = `/uploads/${req.file.filename}`;
    }

    const result = await query(
      `UPDATE settings SET shop_name=$1, owner_name=$2, address=$3, phone=$4, email=$5, gstin=$6,
       invoice_prefix=$7, footer_message=$8, terms_conditions=$9, currency=$10, date_format=$11,
       low_stock_threshold=$12, logo_url=CASE WHEN $13 != '' THEN $13 ELSE logo_url END,
       updated_at=CURRENT_TIMESTAMP WHERE id=1 RETURNING *`,
      [shop_name, owner_name, address, phone, email, gstin, invoice_prefix, footer_message,
       terms_conditions, currency, date_format, parseInt(low_stock_threshold), logo_url]
    );

    await query('INSERT INTO activity_logs (action, description) VALUES ($1, $2)',
      ['SETTINGS_UPDATED', 'Shop settings updated']);

    res.json({ success: true, message: 'Settings updated successfully', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings, upload };
