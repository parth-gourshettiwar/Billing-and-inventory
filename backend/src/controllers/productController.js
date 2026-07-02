const { query } = require('../config/database');
const { paginate } = require('../utils/helpers');

const getProducts = async (req, res, next) => {
  try {
    const { search = '', filter = 'all', page = 1, limit = 20 } = req.query;
    const { limit: l, offset } = paginate(page, limit);
    const settings = await query('SELECT low_stock_threshold FROM settings WHERE id = 1');
    const threshold = settings.rows[0]?.low_stock_threshold || 10;

    let conditions = [];
    let params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(p.product_name ILIKE $${idx} OR p.brand ILIKE $${idx} OR p.hsn_code ILIKE $${idx} OR p.oem_number ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    if (filter === 'active') { conditions.push(`p.status = 'Active'`); }
    else if (filter === 'inactive') { conditions.push(`p.status = 'Inactive'`); }
    else if (filter === 'low_stock') { conditions.push(`p.stock <= ${threshold} AND p.stock > 0 AND p.status = 'Active'`); }
    else if (filter === 'out_of_stock') { conditions.push(`p.stock = 0`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await query(`SELECT COUNT(*) FROM products p ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(l, offset);
    const result = await query(
      `SELECT p.*, 
        CASE WHEN p.gst_rate > 0 THEN ROUND(p.selling_price_inclusive / (1 + p.gst_rate/100), 2) ELSE p.selling_price_inclusive END AS taxable_price,
        ROUND(((p.selling_price_inclusive / (1 + p.gst_rate/100)) - p.purchase_price) / NULLIF(p.purchase_price, 0) * 100, 2) AS profit_margin_pct
       FROM products p ${where} ORDER BY p.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      meta: { total, page: parseInt(page), limit: l, totalPages: Math.ceil(total / l), threshold },
    });
  } catch (err) {
    next(err);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { product_name, brand = '', oem_number = '', hsn_code, purchase_price, selling_price_inclusive, gst_rate, stock = 0, unit = 'PCS', description = '' } = req.body;
    if (!product_name || !hsn_code) return res.status(400).json({ success: false, message: 'Product name and HSN code are required' });
    if (parseFloat(purchase_price) < 0) return res.status(400).json({ success: false, message: 'Purchase price cannot be negative' });
    if (parseFloat(selling_price_inclusive) < 0) return res.status(400).json({ success: false, message: 'Selling price cannot be negative' });
    if (parseFloat(gst_rate) < 0) return res.status(400).json({ success: false, message: 'GST rate cannot be negative' });
    if (parseInt(stock) < 0) return res.status(400).json({ success: false, message: 'Stock cannot be negative' });

    const result = await query(
      `INSERT INTO products (product_name, brand, oem_number, hsn_code, purchase_price, selling_price_inclusive, gst_rate, stock, unit, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [product_name, brand, oem_number, hsn_code, purchase_price, selling_price_inclusive, gst_rate, stock, unit, description]
    );
    const product = result.rows[0];

    // Log inventory history
    await query('INSERT INTO inventory_history (product_id, action, description) VALUES ($1, $2, $3)',
      [product.id, 'PRODUCT_ADDED', `Product "${product_name}" added with stock ${stock}`]);
    await query('INSERT INTO activity_logs (action, description) VALUES ($1, $2)',
      ['PRODUCT_ADDED', `Product "${product_name}" added`]);

    res.status(201).json({ success: true, message: 'Product added successfully', data: product });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    const old = existing.rows[0];

    const { product_name = old.product_name, brand = old.brand, oem_number = old.oem_number,
      hsn_code = old.hsn_code, purchase_price = old.purchase_price, selling_price_inclusive = old.selling_price_inclusive,
      gst_rate = old.gst_rate, stock = old.stock, unit = old.unit, description = old.description } = req.body;

    if (!product_name || !hsn_code) return res.status(400).json({ success: false, message: 'Product name and HSN code are required' });

    const result = await query(
      `UPDATE products SET product_name=$1, brand=$2, oem_number=$3, hsn_code=$4, purchase_price=$5, 
       selling_price_inclusive=$6, gst_rate=$7, stock=$8, unit=$9, description=$10, updated_at=CURRENT_TIMESTAMP
       WHERE id=$11 RETURNING *`,
      [product_name, brand, oem_number, hsn_code, purchase_price, selling_price_inclusive, gst_rate, stock, unit, description, id]
    );

    // Log changes
    const changes = [];
    if (old.purchase_price != purchase_price) changes.push(`Purchase price changed from ${old.purchase_price} to ${purchase_price}`);
    if (old.selling_price_inclusive != selling_price_inclusive) changes.push(`Selling price changed from ${old.selling_price_inclusive} to ${selling_price_inclusive}`);
    if (old.gst_rate != gst_rate) changes.push(`GST rate changed from ${old.gst_rate}% to ${gst_rate}%`);
    if (old.stock != stock) {
      changes.push(`Stock changed from ${old.stock} to ${stock}`);
      await query('INSERT INTO inventory_history (product_id, action, description) VALUES ($1, $2, $3)',
        [id, 'STOCK_ADJUSTED', `Manual stock adjustment: ${old.stock} → ${stock}`]);
    }
    if (changes.length > 0) {
      await query('INSERT INTO inventory_history (product_id, action, description) VALUES ($1, $2, $3)',
        [id, 'PRODUCT_UPDATED', changes.join('; ')]);
    }

    res.json({ success: true, message: 'Product updated successfully', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const toggleProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    const newStatus = existing.rows[0].status === 'Active' ? 'Inactive' : 'Active';
    const result = await query('UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [newStatus, id]);
    await query('INSERT INTO inventory_history (product_id, action, description) VALUES ($1, $2, $3)',
      [id, newStatus === 'Inactive' ? 'PRODUCT_DEACTIVATED' : 'PRODUCT_ACTIVATED', `Product status changed to ${newStatus}`]);
    res.json({ success: true, message: `Product ${newStatus.toLowerCase()}`, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const getInventoryHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM inventory_history WHERE product_id = $1 ORDER BY created_at DESC LIMIT 100', [id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, toggleProductStatus, getInventoryHistory };
